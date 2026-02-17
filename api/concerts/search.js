const SETLIST_API_KEY = process.env.SETLIST_FM_API_KEY || 'sMd8Hesl527ESeQAgkrbTEKg0E_e96X2642X'

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const artist = (req.query.artist || '').trim()
  if (!artist) {
    return res.status(400).json({ error: 'Missing artist query param' })
  }

  try {
    const resp = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artist)}&p=1`,
      {
        headers: {
          'x-api-key': SETLIST_API_KEY,
          Accept: 'application/json',
          'User-Agent': 'HerdApp/1.0 (Concert search)',
        },
      }
    )
    if (resp.status === 403) {
      return res.status(403).json({
        error: 'Setlist.fm rejected the request. Get a free API key at setlist.fm/settings/api and add SETLIST_FM_API_KEY in Vercel project Environment Variables.',
      })
    }
    if (resp.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' })
    }
    if (!resp.ok) {
      const t = await resp.text()
      let errMsg = t || 'Setlist.fm error'
      try {
        const j = JSON.parse(t)
        if (j && j.message) errMsg = j.message
      } catch (_) {}
      return res.status(resp.status).json({ error: errMsg })
    }
    const data = await resp.json()
    const concerts = mapSetlistsToConcerts(data, artist)
    const total = data.total ?? concerts.length
    return res.status(200).json({ concerts, total })
  } catch (err) {
    console.error('Setlist.fm API error:', err)
    return res.status(500).json({ error: err.message || 'Search failed' })
  }
}
