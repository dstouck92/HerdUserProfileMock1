/**
 * Vercel serverless: GET /api/spotify/artist-image?artist_id=SPOTIFY_ARTIST_ID
 * Returns { imageUrl } for the artist's first Spotify image, or { error }.
 * Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in environment variables.
 */

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const artistId = (req.query.artist_id || req.query.artistId || "").trim();
  if (!artistId) {
    return res.status(400).json({ error: "Missing artist_id query param" });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).json({
      error: "Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel Environment Variables.",
    });
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
      return res.status(502).json({ error: "Spotify token failed", details: text });
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(502).json({ error: "No access token in Spotify response" });
    }

    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (artistRes.status === 404) {
      return res.status(404).json({ error: "Artist not found" });
    }
    if (!artistRes.ok) {
      const text = await artistRes.text();
      return res.status(502).json({ error: "Spotify artist request failed", details: text });
    }
    const artist = await artistRes.json();
    const imageUrl = artist.images?.[0]?.url || null;
    return res.status(200).json({ imageUrl });
  } catch (err) {
    console.error("Spotify artist-image error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
