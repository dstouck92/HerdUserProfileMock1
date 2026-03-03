/**
 * Vercel serverless: GET /api/market/concerts
 * Query params:
 *   - artists: comma-separated artist names (required)
 *   - city: optional city filter
 *   - country or countryCode: optional 2-letter country code
 *   - sizePerArtist: optional number of events per artist (1–10, default 5)
 *
 * Returns { events: [...] } or { error }.
 */

const FETCH_TIMEOUT_MS = 15000;
/** Delay between each Ticketmaster request to avoid spike-arrest (5/sec, burst 1). */
const TICKETMASTER_DELAY_MS = 400;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function mapTicketmasterEventsToConcerts(data, artistHint) {
  const events = data?._embedded?.events || [];
  return events.map((e) => {
    const attractions = e._embedded?.attractions || [];
    const primaryAttraction = attractions[0];
    const venue = e._embedded?.venues?.[0] || {};
    const images = Array.isArray(e.images) ? e.images : [];
    const preferredImage =
      images.find((img) => img.width >= 640) || images[0] || null;

    return {
      id: e.id,
      artist: primaryAttraction?.name || artistHint || null,
      event_name: e.name || null,
      date: e.dates?.start?.dateTime || e.dates?.start?.localDate || null,
      venue: venue.name || null,
      city: venue.city?.name || null,
      country: venue.country?.countryCode || null,
      ticket_url: e.url || null,
      image_url: preferredImage?.url || null,
      source: "ticketmaster",
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TICKETMASTER_API_KEY || "";
  if (!apiKey) {
    return res.status(503).json({
      error:
        "Ticketmaster API key not configured. Add TICKETMASTER_API_KEY in Vercel Environment Variables.",
    });
  }

  const artistsParam = (req.query.artists || "").trim();
  const city = (req.query.city || "").trim();
  const countryCode = (req.query.country || req.query.countryCode || "").trim();
  const sizePerArtist = Math.min(
    10,
    Math.max(1, Number(req.query.sizePerArtist) || 5),
  );

  if (!artistsParam) {
    return res.status(400).json({
      error: "Missing artists query param (comma-separated names)",
    });
  }

  let artistNames = artistsParam
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  // Cap to avoid long runtimes and rate limits (Ticketmaster ~5/sec, we space 400ms)
  const MAX_ARTISTS = 12;
  if (artistNames.length > MAX_ARTISTS) {
    artistNames = artistNames.slice(0, MAX_ARTISTS);
  }

  if (!artistNames.length) {
    return res
      .status(400)
      .json({ error: "No valid artist names in artists query param" });
  }

  // Ticketmaster requires YYYY-MM-DDTHH:mm:ssZ (no milliseconds)
  const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const results = [];
    for (let i = 0; i < artistNames.length; i++) {
      const artist = artistNames[i];
      const params = new URLSearchParams({
        apikey: apiKey,
        keyword: artist,
        sort: "date,asc",
        size: String(sizePerArtist),
        startDateTime: nowIso,
      });
      if (city) params.append("city", city);
      if (countryCode)
        params.append("countryCode", countryCode.toUpperCase());

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

      const resp = await fetch(url, { signal: controller.signal });
      if (resp.status === 401 || resp.status === 403) {
        const text = await resp.text();
        throw new Error(
          `Ticketmaster auth error (${resp.status}): ${
            text || "Forbidden or unauthorized"
          }`,
        );
      }
      if (resp.status === 429) {
        const text = await resp.text();
        throw new Error(
          `Ticketmaster rate limit (${resp.status}): ${
            text || "Too many requests"
          }`,
        );
      }
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(
          `Ticketmaster error (${resp.status}): ${
            text || "Unknown error"
          }`,
        );
      }

      const json = await resp.json();
      results.push(mapTicketmasterEventsToConcerts(json, artist));

      if (i < artistNames.length - 1) {
        await delay(TICKETMASTER_DELAY_MS);
      }
    }

    clearTimeout(timeoutId);

    const byId = new Map();
    for (const list of results) {
      for (const ev of list) {
        if (!ev?.id) continue;
        if (!byId.has(ev.id)) byId.set(ev.id, ev);
      }
    }

    const events = Array.from(byId.values()).sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return da - db;
    });

    return res.status(200).json({ events });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return res
        .status(504)
        .json({ error: "Ticketmaster search timed out. Try again." });
    }
    console.error("Ticketmaster API error (Vercel):", err);
    return res
      .status(500)
      .json({ error: err.message || "Ticketmaster search failed" });
  }
}

