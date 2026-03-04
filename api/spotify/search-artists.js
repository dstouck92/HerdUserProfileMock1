/**
 * Vercel serverless: GET /api/spotify/search-artists?q=QUERY
 * Returns { artists: [{ id, name, imageUrl }] } from Spotify.
 * Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in environment variables.
 */

const SPOTIFY_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const spotifySearchCache = new Map();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const q = (req.query.q || req.query.query || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Missing q query param" });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).json({
      error: "Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel Environment Variables.",
    });
  }

  const cacheKey = q.toLowerCase();
  const cached = spotifySearchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < SPOTIFY_SEARCH_CACHE_TTL_MS) {
    return res.status(200).json({ artists: cached.artists });
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      let msg = "Spotify token failed.";
      try {
        const j = JSON.parse(text);
        if (j && j.error_description) msg = `Spotify: ${j.error_description}`;
        else if (j && j.error) msg = `Spotify: ${j.error}`;
      } catch (_) {
        if (text && text.length < 200) msg = `Spotify: ${text}`;
      }
      return res.status(502).json({ error: msg, details: text });
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(502).json({ error: "No access token in Spotify response" });
    }

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?type=artist&limit=10&q=${encodeURIComponent(q)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (searchRes.status === 429) {
      const retryAfter = searchRes.headers.get("Retry-After") || "60";
      return res.status(429).json({
        error: `Spotify rate limit. Try again in ${retryAfter} seconds.`,
        retryAfter: parseInt(retryAfter, 10) || 60,
      });
    }
    if (!searchRes.ok) {
      const text = await searchRes.text();
      let msg = "Spotify search failed.";
      try {
        const j = JSON.parse(text);
        if (j && j.error && j.error.message) msg = `Spotify: ${j.error.message}`;
        else if (j && j.error) msg = `Spotify: ${j.error}`;
      } catch (_) {
        if (text && text.length < 200) msg = `Spotify: ${text}`;
      }
      return res.status(502).json({ error: msg, details: text });
    }
    const json = await searchRes.json();
    const items = json?.artists?.items || [];
    const artists = items.map((a) => ({
      id: a.id,
      name: a.name,
      imageUrl: (a.images && a.images[0] && a.images[0].url) || null,
    }));
    spotifySearchCache.set(cacheKey, { artists, at: Date.now() });
    return res.status(200).json({ artists });
  } catch (err) {
    console.error("Spotify search-artists error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

