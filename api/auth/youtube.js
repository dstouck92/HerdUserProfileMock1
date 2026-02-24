import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) throw new Error('Supabase admin env vars missing')
  return createClient(url, serviceRole)
}

function signState(payload) {
  const secret = process.env.YOUTUBE_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Missing YOUTUBE_STATE_SECRET or SUPABASE_SERVICE_ROLE_KEY')
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const youtubeClientId = process.env.YOUTUBE_CLIENT_ID
  const youtubeRedirectUri = process.env.YOUTUBE_REDIRECT_URI
  if (!youtubeClientId || !youtubeRedirectUri) {
    return res.status(503).json({ error: 'YouTube connect is not configured on the server.' })
  }

  let accessToken = null
  try {
    accessToken = req.body?.access_token || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  } catch (_) {
    accessToken = null
  }
  if (!accessToken) {
    return res.status(401).json({ error: 'Missing access_token' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
    if (error || !user?.id) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const state = signState({ uid: user.id, ts: Date.now() })
    const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'
    const url =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: youtubeClientId,
        redirect_uri: youtubeRedirectUri,
        response_type: 'code',
        scope: YOUTUBE_SCOPE,
        access_type: 'offline',
        prompt: 'consent',
        state,
      }).toString()

    return res.status(200).json({ url })
  } catch (e) {
    console.error('YouTube auth init error (Vercel fn):', e)
    return res.status(500).json({ error: 'Could not start YouTube connect' })
  }
}

