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

  let accessToken = null
  try {
    accessToken = req.body?.access_token || req.headers.authorization?.replace(/^Bearer\\s+/i, '')
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

    const raw = req.body?.watchHistory ?? req.body?.watch_history ?? req.body
    const list = Array.isArray(raw)
      ? raw
      : raw?.records && Array.isArray(raw.records)
      ? raw.records
      : []

    const ESTIMATE_MIN_PER_VIDEO = 8
    const records = list
      .map((r) => ({
        title: r.title ?? r.name ?? '',
        titleUrl: r.titleUrl ?? r.url ?? r.title_url ?? '',
        channelName:
          r.subtitles && r.subtitles[0]?.name
            ? r.subtitles[0].name
            : r.channelTitle ?? r.channel ?? '',
        channelUrl:
          r.subtitles && r.subtitles[0]?.url
            ? r.subtitles[0].url
            : r.channelUrl ?? '',
        time: r.time ?? r.timestamp ?? null,
        durationMinutes: typeof r.durationMinutes === 'number' ? r.durationMinutes : null,
      }))
      .filter((r) => r.title || r.titleUrl)

    const videoCount = records.length
    const totalMinutes = records.reduce(
      (sum, r) => sum + (r.durationMinutes ?? ESTIMATE_MIN_PER_VIDEO),
      0,
    )
    const roundedMinutes = Math.round(totalMinutes * 10) / 10

    await supabaseAdmin
      .from('user_youtube_takeout')
      .upsert(
        {
          user_id: user.id,
          watch_history_json: records,
          video_count: videoCount,
          total_watch_minutes: roundedMinutes,
          imported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

    return res
      .status(200)
      .json({ ok: true, video_count: videoCount, total_watch_minutes: roundedMinutes })
  } catch (e) {
    console.error('YouTube takeout import error (Vercel fn):', e)
    return res.status(500).json({ error: 'Takeout import failed' })
  }
}

