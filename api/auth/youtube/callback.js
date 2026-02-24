import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) throw new Error('Supabase admin env vars missing')
  return createClient(url, serviceRole)
}

function verifyState(state) {
  if (!state || typeof state !== 'string') return null
  const secret = process.env.YOUTUBE_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) return null
  const [data, sig] = state.split('.')
  if (!data || !sig) return null
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    return payload
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed')
  }

  const youtubeClientId = process.env.YOUTUBE_CLIENT_ID
  const youtubeClientSecret = process.env.YOUTUBE_CLIENT_SECRET
  const youtubeRedirectUri = process.env.YOUTUBE_REDIRECT_URI
  if (!youtubeClientId || !youtubeClientSecret || !youtubeRedirectUri) {
    return res.redirect('/?youtube=error&reason=config')
  }

  const { code, state } = req.query
  if (!code || !state) return res.redirect('/?youtube=error&reason=missing')

  const payload = verifyState(state)
  if (!payload?.uid || !payload?.ts) return res.redirect('/?youtube=error&reason=state')

  // Optional: expire after 10 minutes
  const TEN_MIN = 10 * 60 * 1000
  if (Date.now() - payload.ts > TEN_MIN) return res.redirect('/?youtube=error&reason=expired')

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
      console.error('YouTube token exchange error (Vercel fn):', err)
      return res.redirect('/?youtube=error&reason=token')
    }
    const tokens = await tokenRes.json()

    const supabaseAdmin = getSupabaseAdmin()
    const userId = payload.uid

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name, username, phone')
      .eq('id', userId)
      .single()

    const {
      data: { user },
    } = await supabaseAdmin.auth.admin.getUserById(userId)

    await supabaseAdmin.from('user_youtube').upsert(
      {
        user_id: userId,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        herd_display_name: profile?.display_name ?? null,
        herd_email: user?.email ?? null,
        herd_phone: profile?.phone ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    return res.redirect('/?youtube=connected&tab=Digital')
  } catch (e) {
    console.error('YouTube callback error (Vercel fn):', e)
    return res.redirect('/?youtube=error&reason=server')
  }
}

