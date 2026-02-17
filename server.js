import express from 'express'
import { createServer as createViteServer } from 'vite'
import { config } from 'dotenv'

config()

const SETLIST_API_KEY = process.env.SETLIST_FM_API_KEY || 'sMd8Hesl527ESeQAgkrbTEKg0E_e96X2642X'
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
const FETCH_TIMEOUT_MS = 15000

const app = express()

const searchCache = new Map()

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

// Vite dev server
const vite = await createViteServer({ server: { middlewareMode: true } })
app.use(vite.middlewares)

const port = process.env.PORT || 5173
app.listen(port, () => {
  console.log(`\n  ➜  Local:   http://localhost:${port}/`)
  console.log(`  ➜  API:     http://localhost:${port}/api/concerts/search?artist=...\n`)
})
