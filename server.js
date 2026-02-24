import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer as createViteServer } from 'vite'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SETLIST_API_KEY = process.env.SETLIST_FM_API_KEY || 'sMd8Hesl527ESeQAgkrbTEKg0E_e96X2642X'
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
const FETCH_TIMEOUT_MS = 15000
const DISCOGS_USER_AGENT = 'HerdApp/1.0 +https://getherd.co'

const app = express()
app.use(express.json())

const searchCache = new Map()
const vinylSearchCache = new Map()

// YouTube OAuth state (in-memory; expires in 10 min)
const youtubeStateStore = new Map()
const YOUTUBE_STATE_TTL_MS = 10 * 60 * 1000
function pruneYoutubeState() {
  const now = Date.now()
  for (const [k, v] of youtubeStateStore.entries()) if (now - v.createdAt > YOUTUBE_STATE_TTL_MS) youtubeStateStore.delete(k)
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null
const youtubeClientId = process.env.YOUTUBE_CLIENT_ID
const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET
const youtubeRedirectUri = process.env.YOUTUBE_REDIRECT_URI

function mapSetlistsToConcerts(data, artist) {
  const setlists = data.setlist || []
  return setlists.map((s) => {
    let date = ''
    if (s.eventDate) {
      const [d, m, y] = s.eventDate.split('-')
      date = `${y}-${m}-${d}`
    }
    const city = s.venue?.city?.name
      ? `${s.venue.city.name}${s.venue.city.country?.code ? `, ${s.venue.city.country.code}` : ''}`
      : ''
    return {
      artist: s.artist?.name || artist,
      tour: s.tour?.name || null,
      date,
      venue: s.venue?.name || null,
      city: city || null,
      source: 'setlist.fm',
    }
  })
}

// API: search concerts via Setlist.fm (with cache + timeout to avoid rate limits and "failed to fetch")
app.get('/api/concerts/search', (req, res) => {
  const artist = req.query.artist?.trim()
  if (!artist) {
    return res.status(400).json({ error: 'Missing artist query param' })
  }

  const cacheKey = artist.toLowerCase()
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return res.json({ concerts: cached.concerts, total: cached.total })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  fetch(`https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&p=1`, {
    headers: {
      'x-api-key': SETLIST_API_KEY,
      Accept: 'application/json',
      'User-Agent': 'HerdApp/1.0 (Concert search)',
    },
    signal: controller.signal,
  })
    .then((resp) => {
      clearTimeout(timeoutId)
      if (resp.status === 429) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' }).then(() => null)
      }
      if (resp.status === 403) {
        return res.status(403).json({
          error: 'Setlist.fm rejected the request. Get a free API key at setlist.fm/settings/api and add SETLIST_FM_API_KEY to your .env file.',
        }).then(() => null)
      }
      if (!resp.ok) {
        return resp.text().then((t) => {
          let errMsg = t || 'Setlist.fm error'
          try {
            const j = JSON.parse(t)
            if (j && j.message) errMsg = j.message
          } catch (_) {}
          res.status(resp.status).json({ error: errMsg })
          return null
        })
      }
      return resp.json()
    })
    .then((data) => {
      if (!data) {
        if (!res.headersSent) res.status(502).json({ error: 'Empty response from Setlist.fm' })
        return
      }
      try {
        const concerts = mapSetlistsToConcerts(data, artist)
        const total = data.total ?? concerts.length
        searchCache.set(cacheKey, { concerts, total, at: Date.now() })
        if (!res.headersSent) res.json({ concerts, total })
      } catch (e) {
        console.error('Setlist.fm parse error:', e)
        if (!res.headersSent) res.status(500).json({ error: 'Search failed' })
      }
    })
    .catch((err) => {
      clearTimeout(timeoutId)
      if (res.headersSent) return
      if (err.name === 'AbortError') {
        res.status(504).json({ error: 'Search timed out. Try again.' })
      } else {
        console.error('Setlist.fm API error:', err)
        res.status(500).json({ error: err.message || 'Search failed' })
      }
    })
})

// API: search vinyl/releases via Discogs (User-Agent only; no OAuth needed for database search)
function mapDiscogsResultsToVinyl(data) {
  const results = data.results || []
  return results.map((r) => {
    const artistName = r.artists?.[0]?.name || (r.title && r.title.includes(' – ') ? r.title.split(' – ')[0].trim() : null) || ''
    const albumName = r.title || ''
    return {
      artist_name: artistName,
      album_name: albumName,
      year: r.year || null,
      id: r.id,
      thumb: r.thumb || null,
      source: 'discogs',
    }
  }).filter((v) => v.artist_name && v.album_name)
}

app.get('/api/vinyl/search', (req, res) => {
  const q = req.query.q?.trim()
  if (!q) {
    return res.status(400).json({ error: 'Missing q query param' })
  }

  const cacheKey = q.toLowerCase()
  const cached = vinylSearchCache.get(cacheKey)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return res.json({ results: cached.results, total: cached.total })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(q)}&type=release&per_page=25`
  fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': DISCOGS_USER_AGENT,
    },
    signal: controller.signal,
  })
    .then((resp) => {
      clearTimeout(timeoutId)
      if (resp.status === 429) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' }).then(() => null)
      }
      if (!resp.ok) {
        return resp.text().then((t) => {
          let errMsg = t || 'Discogs error'
          try {
            const j = JSON.parse(t)
            if (j && j.message) errMsg = j.message
          } catch (_) {}
          res.status(resp.status).json({ error: errMsg })
          return null
        })
      }
      return resp.json()
    })
    .then((data) => {
      if (!data) {
        if (!res.headersSent) res.status(502).json({ error: 'Empty response from Discogs' })
        return
      }
      try {
        const results = mapDiscogsResultsToVinyl(data)
        const total = data.pagination?.items ?? results.length
        vinylSearchCache.set(cacheKey, { results, total, at: Date.now() })
        if (!res.headersSent) res.json({ results, total })
      } catch (e) {
        console.error('Discogs parse error:', e)
        if (!res.headersSent) res.status(500).json({ error: 'Search failed' })
      }
    })
    .catch((err) => {
      clearTimeout(timeoutId)
      if (res.headersSent) return
      if (err.name === 'AbortError') {
        res.status(504).json({ error: 'Search timed out. Try again.' })
      } else {
        console.error('Discogs API error:', err)
        res.status(500).json({ error: err.message || 'Search failed' })
      }
    })
})

// --- YouTube OAuth & sync (optional; requires YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI, SUPABASE_SERVICE_ROLE_KEY) ---
if (supabaseAdmin && youtubeClientId && youtubeClientSecret && youtubeRedirectUri) {
  const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'

  // POST /api/auth/youtube — body: { access_token }. Returns { url } to redirect user to Google.
  app.post('/api/auth/youtube', async (req, res) => {
    try {
      const accessToken = req.body?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
      if (!accessToken) return res.status(401).json({ error: 'Missing access_token' })
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
      if (error || !user?.id) return res.status(401).json({ error: 'Invalid token' })
      pruneYoutubeState()
      const state = crypto.randomBytes(16).toString('hex')
      youtubeStateStore.set(state, { userId: user.id, createdAt: Date.now() })
      const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: youtubeClientId,
        redirect_uri: youtubeRedirectUri,
        response_type: 'code',
        scope: YOUTUBE_SCOPE,
        access_type: 'offline',
        prompt: 'consent',
        state,
      }).toString()
      return res.json({ url })
    } catch (e) {
      console.error('YouTube auth init error:', e)
      return res.status(500).json({ error: 'Could not start YouTube connect' })
    }
  })

  // GET /api/auth/youtube/callback — Google redirects here with ?code= & state=
  app.get('/api/auth/youtube/callback', async (req, res) => {
    const { code, state } = req.query
    if (!code || !state) return res.redirect('/?youtube=error&reason=missing')
    const stored = youtubeStateStore.get(state)
    youtubeStateStore.delete(state)
    if (!stored || Date.now() - stored.createdAt > YOUTUBE_STATE_TTL_MS) return res.redirect('/?youtube=error&reason=expired')
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: youtubeClientId,
          client_secret: youtubeClientSecret,
          redirect_uri: youtubeRedirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      })
      if (!tokenRes.ok) {
        const err = await tokenRes.text()
        console.error('YouTube token exchange error:', err)
        return res.redirect('/?youtube=error&reason=token')
      }
      const tokens = await tokenRes.json()
      const { data: profile } = await supabaseAdmin.from('profiles').select('display_name, username, phone').eq('id', stored.userId).single()
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(stored.userId)
      await supabaseAdmin.from('user_youtube').upsert({
        user_id: stored.userId,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        herd_display_name: profile?.display_name ?? null,
        herd_email: user?.email ?? null,
        herd_phone: profile?.phone ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      return res.redirect('/?youtube=connected&tab=Digital')
    } catch (e) {
      console.error('YouTube callback error:', e)
      return res.redirect('/?youtube=error&reason=server')
    }
  })

  // POST /api/youtube/sync — Authorization: Bearer <access_token>. Fetches from YouTube API and updates cache.
  app.post('/api/youtube/sync', async (req, res) => {
    try {
      const accessToken = req.body?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
      if (!accessToken) return res.status(401).json({ error: 'Missing access_token' })
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
      if (error || !user?.id) return res.status(401).json({ error: 'Invalid token' })
      const { data: row } = await supabaseAdmin.from('user_youtube').select('refresh_token, access_token, token_expires_at').eq('user_id', user.id).single()
      if (!row?.refresh_token) return res.status(400).json({ error: 'YouTube not connected' })
      let access = row.access_token
      const expires = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0
      if (!access || Date.now() > expires - 60000) {
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
        access = tok.access_token
        await supabaseAdmin.from('user_youtube').update({
          access_token: tok.access_token,
          token_expires_at: tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id)
      }
      const headers = { Authorization: `Bearer ${access}` }
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
      const likedPlaylistId = channel?.contentDetails?.relatedPlaylists?.likes
      const subscriptions = subsRes.ok ? (await subsRes.json()).items || [] : []
      const playlists = playlistsRes.ok ? (await playlistsRes.json()).items || [] : []
      let likedVideos = []
      if (likedPlaylistId) {
        const likesRes = await fetch(`${base}/playlistItems?part=snippet&playlistId=${likedPlaylistId}&maxResults=50`, { headers })
        if (likesRes.ok) likedVideos = (await likesRes.json()).items || []
      }
      const subscriptionsJson = subscriptions.map(s => ({
        channelId: s.snippet?.resourceId?.channelId,
        title: s.snippet?.title,
      }))
      const playlistsJson = playlists.map(p => ({
        id: p.id,
        title: p.snippet?.title,
        itemCount: p.contentDetails?.itemCount ?? 0,
      }))
      const likedVideosJson = likedVideos.map(i => ({
        videoId: i.contentDetails?.videoId,
        title: i.snippet?.title,
        channelId: i.snippet?.channelId,
        channelTitle: i.snippet?.channelTitle,
      }))
      const likesByChannel = {}
      likedVideosJson.forEach(v => {
        const k = v.channelId || v.channelTitle || 'unknown'
        likesByChannel[k] = (likesByChannel[k] || 0) + 1
      })
      const ranked = subscriptionsJson
        .map(s => ({ ...s, likedCount: likesByChannel[s.channelId] || 0 }))
        .sort((a, b) => b.likedCount - a.likedCount)
      await supabaseAdmin.from('user_youtube').update({
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
      }).eq('user_id', user.id)
      return res.json({ ok: true, last_fetched_at: new Date().toISOString() })
    } catch (e) {
      console.error('YouTube sync error:', e)
      return res.status(500).json({ error: 'YouTube sync failed' })
    }
  })

  // POST /api/youtube/takeout — body: { watchHistory: array }. Import Takeout watch-history.json; adds to YouTube section + total watch time.
  app.post('/api/youtube/takeout', async (req, res) => {
    try {
      const accessToken = req.body?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
      if (!accessToken) return res.status(401).json({ error: 'Missing access_token' })
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
      if (error || !user?.id) return res.status(401).json({ error: 'Invalid token' })
      const raw = req.body?.watchHistory ?? req.body?.watch_history ?? req.body
      const list = Array.isArray(raw) ? raw : (raw?.records && Array.isArray(raw.records) ? raw.records : [])
      const ESTIMATE_MIN_PER_VIDEO = 8
      const records = list.map(r => ({
        title: r.title ?? r.name ?? '',
        titleUrl: r.titleUrl ?? r.url ?? r.title_url ?? '',
        channelName: (r.subtitles && r.subtitles[0]?.name) ? r.subtitles[0].name : (r.channelTitle ?? r.channel ?? ''),
        channelUrl: (r.subtitles && r.subtitles[0]?.url) ? r.subtitles[0].url : (r.channelUrl ?? ''),
        time: r.time ?? r.timestamp ?? null,
        durationMinutes: typeof r.durationMinutes === 'number' ? r.durationMinutes : null,
      })).filter(r => r.title || r.titleUrl)
      const videoCount = records.length
      const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes ?? ESTIMATE_MIN_PER_VIDEO), 0)
      await supabaseAdmin.from('user_youtube_takeout').upsert({
        user_id: user.id,
        watch_history_json: records,
        video_count: videoCount,
        total_watch_minutes: Math.round(totalMinutes * 10) / 10,
        imported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      return res.json({ ok: true, video_count: videoCount, total_watch_minutes: Math.round(totalMinutes * 10) / 10 })
    } catch (e) {
      console.error('YouTube takeout import error:', e)
      return res.status(500).json({ error: 'Takeout import failed' })
    }
  })
}

// Serve static files from public/ (avatars, etc.) so /avatars/* and /goat-headphones.png work
app.use(express.static(path.join(__dirname, 'public')))

// Vite dev server (handles HTML, JS, HMR)
const vite = await createViteServer({ server: { middlewareMode: true } })
app.use(vite.middlewares)

const port = process.env.PORT || 5173
app.listen(port, () => {
  console.log(`\n  ➜  Local:   http://localhost:${port}/`)
  console.log(`  ➜  API:     http://localhost:${port}/api/concerts/search?artist=...\n`)
})
