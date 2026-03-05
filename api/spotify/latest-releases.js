/**
 * Vercel serverless: GET /api/spotify/latest-releases?artist_ids=id1,id2,id3
 * Returns latest album or single per artist (max 5 artists). Used for Feed "Music recommended for you".
 * Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.
 * Response: { releases: [{ artistId, artistName, albumId, name, type, release_date, imageUrl, spotify_url }] }
 */

const MAX_ARTISTS = 5;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const raw = (req.query.artist_ids || req.query.artistIds || "").trim();
  const artistIds = raw
    ? raw.split(",").map((id) => id.trim()).filter(Boolean).slice(0, MAX_ARTISTS)
    : [];

  if (artistIds.length === 0) {
    return res.status(200).json({ releases: [] });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).json({
      error:
        "Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel Environment Variables.",
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

    const releases = [];
    for (const artistId of artistIds) {
      const albumsRes = await fetch(
        `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}/albums?include_groups=album,single&limit=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!albumsRes.ok) {
        if (albumsRes.status === 429) {
          const retryAfter = albumsRes.headers.get("retry-after") || "60";
          return res.status(429).json({
            error: `Spotify rate limit. Try again in ${retryAfter} seconds.`,
          });
        }
        continue; // skip this artist
      }
      const albumsData = await albumsRes.json();
      const items = albumsData.items || [];
      if (items.length === 0) continue;
      const sorted = [...items].sort((a, b) => {
        const dA = a.release_date || "";
        const dB = b.release_date || "";
        return dB.localeCompare(dA);
      });
      const latest = sorted[0];
      const artistName = latest.artists?.[0]?.name || null;
      releases.push({
        artistId,
        artistName,
        albumId: latest.id,
        name: latest.name || "Release",
        type: latest.album_type || "album",
        release_date: latest.release_date || null,
        imageUrl: latest.images?.[0]?.url || null,
        spotify_url: latest.external_urls?.spotify || null,
      });
    }

    return res.status(200).json({ releases });
  } catch (err) {
    console.error("Spotify latest-releases error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
