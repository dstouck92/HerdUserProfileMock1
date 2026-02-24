import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) throw new Error('Supabase admin env vars missing')
  return createClient(url, serviceRole)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const youtubeClientId = process.env.YOUTUBE_CLIENT_ID
  const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET
  if (!youtubeClientId || !youtubeClientSecret) {
    return res.status(503).json({ error: 'YouTube sync not configured on server' })
  }

  let accessToken = null
  try {
    accessToken = req.body?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  } catch (_) {
    accessToken = null
  }
  if (!accessToken) return res.status(401).json({ error: 'Missing access_token' })

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken)
    if (error || !user?.id) return res.status(401).json({ error: 'Invalid token' })

    const { data: row } = await supabaseAdmin
      .from('user_youtube')
      .select('refresh_token, access_token, token_expires_at')
      .eq('user_id', user.id)
      .single()

    if (!row?.refresh_token) return res.status(400).json({ error: 'YouTube not connected' })

    let ytAccess = row.access_token
    const expires = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0

    if (!ytAccess || Date.now() > expires - 60000) {
      const tr = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: row.refresh_token,
          client_id: youtubeClientId,
          client_secret: youtubeClientSecret,
          grant_type: 'refresh_token',
        }).toString(),
      })
      if (!tr.ok) return res.status(502).json({ error: 'YouTube token refresh failed' })
      const tok = await tr.json()
      ytAccess = tok.access_token
      await supabaseAdmin
        .from('user_youtube')
        .update({
          access_token: tok.access_token,
          token_expires_at: tok.expires_in
            ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }

    const headers = { Authorization: `Bearer ${ytAccess}` }
    const base = 'https://www.googleapis.com/youtube/v3'

    const [channelRes, subsRes, playlistsRes] = await Promise.all([
      fetch(`${base}/channels?part=snippet,contentDetails&mine=true`, { headers }),
      fetch(`${base}/subscriptions?part=snippet&mine=true&maxResults=50`, { headers }),
      fetch(`${base}/playlists?part=snippet,contentDetails&mine=true&maxResults=50`, { headers }),
    ])

    if (!channelRes.ok) return res.status(502).json({ error: 'YouTube channel fetch failed' })

    const channelData = await channelRes.json()
    const channel = channelData.items?.[0]
    const channelId = channel?.id

    const subscriptions = subsRes.ok ? (await subsRes.json()).items || [] : []
    const playlists = playlistsRes.ok ? (await playlistsRes.json()).items || [] : []

    let likedVideos = []
    const likedPlaylistId = channel?.contentDetails?.relatedPlaylists?.likes
    if (likedPlaylistId) {
      const likesRes = await fetch(
        `${base}/playlistItems?part=snippet,contentDetails&playlistId=${likedPlaylistId}&maxResults=50`,
        { headers },
      )
      if (likesRes.ok) likedVideos = (await likesRes.json()).items || []
    }

    const subscriptionsJson = subscriptions.map((s) => ({
      channelId: s.snippet?.resourceId?.channelId,
      title: s.snippet?.title,
    }))
    const playlistsJson = playlists.map((p) => ({
      id: p.id,
      title: p.snippet?.title,
      itemCount: p.contentDetails?.itemCount ?? 0,
    }))
    const likedVideosJson = likedVideos.map((i) => ({
      videoId: i.contentDetails?.videoId,
      title: i.snippet?.title,
      channelId: i.snippet?.channelId,
      channelTitle: i.snippet?.channelTitle,
    }))

    const likesByChannel = {}
    likedVideosJson.forEach((v) => {
      const k = v.channelId || v.channelTitle || 'unknown'
      likesByChannel[k] = (likesByChannel[k] || 0) + 1
    })
    const ranked = subscriptionsJson
      .map((s) => ({ ...s, likedCount: likesByChannel[s.channelId] || 0 }))
      .sort((a, b) => b.likedCount - a.likedCount)

    await supabaseAdmin
      .from('user_youtube')
      .update({
        youtube_channel_id: channelId,
        youtube_channel_title: channel?.snippet?.title ?? null,
        subscription_count: subscriptions.length,
        playlist_count: playlists.length,
        liked_count: likedVideosJson.length,
        subscriptions_json: subscriptionsJson,
        playlists_json: playlistsJson,
        liked_videos_json: likedVideosJson,
        subscriptions_ranked_by_likes_json: ranked,
        last_fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return res.status(200).json({ ok: true, last_fetched_at: new Date().toISOString() })
  } catch (e) {
    console.error('YouTube sync error (Vercel fn):', e)
    return res.status(500).json({ error: 'YouTube sync failed' })
  }
}

