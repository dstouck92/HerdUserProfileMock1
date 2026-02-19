const DISCOGS_USER_AGENT = 'HerdApp/1.0 +https://getherd.co'

function mapDiscogsResultsToVinyl(data) {
  const results = data.results || []
  return results
    .map((r) => {
      const artistName =
        r.artists?.[0]?.name ||
        (r.title && r.title.includes(' – ') ? r.title.split(' – ')[0].trim() : null) ||
        ''
      const albumName = r.title || ''
      return {
        artist_name: artistName,
        album_name: albumName,
        year: r.year || null,
        id: r.id,
        thumb: r.thumb || null,
        source: 'discogs',
      }
    })
    .filter((v) => v.artist_name && v.album_name)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const q = (req.query.q || '').trim()
  if (!q) {
    return res.status(400).json({ error: 'Missing q query param' })
  }

  try {
    const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(q)}&type=release&per_page=25`
    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': DISCOGS_USER_AGENT,
      },
    })
    if (resp.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' })
    }
    if (!resp.ok) {
      const t = await resp.text()
      let errMsg = t || 'Discogs error'
      try {
        const j = JSON.parse(t)
        if (j && j.message) errMsg = j.message
      } catch (_) {}
      return res.status(resp.status).json({ error: errMsg })
    }
    const data = await resp.json()
    const results = mapDiscogsResultsToVinyl(data)
    const total = data.pagination?.items ?? results.length
    return res.status(200).json({ results, total })
  } catch (err) {
    console.error('Discogs API error:', err)
    return res.status(500).json({ error: err.message || 'Search failed' })
  }
}
