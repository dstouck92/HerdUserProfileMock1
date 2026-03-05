import React, { useEffect, useMemo, useState } from "react";
import { Card, F, Sec } from "./ui";
import { useDebounce } from "../hooks/useDebounce";
import { supabase } from "../lib/supabase";

const MAX_MUSIC_ARTISTS = 5;
const formatDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function FeedPage({ user, supabase: supabaseClient, userHerds }) {
  const [releases, setReleases] = useState([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicUpdateLoading, setMusicUpdateLoading] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [cacheLoaded, setCacheLoaded] = useState(false);

  const [events, setEvents] = useState([]);
  const [concertsLoading, setConcertsLoading] = useState(false);
  const [concertsError, setConcertsError] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const followedHerds = Array.isArray(userHerds) ? userHerds.slice(0, 30) : [];
  const artistNamesQuery = useMemo(() => {
    if (!followedHerds.length) return "";
    return followedHerds
      .map((h) => h?.name)
      .filter((n) => typeof n === "string" && n.trim().length > 0)
      .join(",");
  }, [followedHerds]);
  const artistIdsForMusic = useMemo(() => {
    return followedHerds
      .map((h) => h?.spotify_artist_id)
      .filter((id) => typeof id === "string" && id.trim().length > 0)
      .slice(0, MAX_MUSIC_ARTISTS);
  }, [followedHerds]);

  const debouncedArtistQuery = useDebounce(artistNamesQuery, 400);
  const debouncedCity = useDebounce(city, 400);
  const debouncedCountry = useDebounce(country, 400);

  const sb = supabaseClient || supabase;

  // Load music cache on mount
  useEffect(() => {
    if (!sb || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await sb
        .from("feed_music_cache")
        .select("releases_json")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data?.releases_json) {
        setReleases(Array.isArray(data.releases_json) ? data.releases_json : []);
      }
      setCacheLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [sb, user?.id]);

  // First-time fetch: only when cache loaded, releases empty, and we have artist ids
  useEffect(() => {
    if (!cacheLoaded || releases.length > 0 || artistIdsForMusic.length === 0) return;
    if (!user?.id || !sb) return;
    let cancelled = false;
    setMusicLoading(true);
    setMusicError("");
    (async () => {
      try {
        const res = await fetch(
          `/api/spotify/latest-releases?artist_ids=${encodeURIComponent(artistIdsForMusic.join(","))}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setMusicError(data.error || "Could not load music.");
          setReleases([]);
          return;
        }
        const list = Array.isArray(data.releases) ? data.releases : [];
        setReleases(list);
        await sb.from("feed_music_cache").upsert(
          { user_id: user.id, releases_json: list, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      } catch (e) {
        if (!cancelled) {
          setMusicError(e.message || "Could not load music.");
          setReleases([]);
        }
      } finally {
        if (!cancelled) setMusicLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cacheLoaded, artistIdsForMusic.join(","), user?.id, sb]);

  const handleMusicUpdate = async () => {
    if (artistIdsForMusic.length === 0 || !user?.id || !sb) return;
    setMusicUpdateLoading(true);
    setMusicError("");
    try {
      const res = await fetch(
        `/api/spotify/latest-releases?artist_ids=${encodeURIComponent(artistIdsForMusic.join(","))}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMusicError(data.error || "Could not update.");
        return;
      }
      const list = Array.isArray(data.releases) ? data.releases : [];
      setReleases(list);
      await sb.from("feed_music_cache").upsert(
        { user_id: user.id, releases_json: list, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    } catch (e) {
      setMusicError(e.message || "Could not update.");
    } finally {
      setMusicUpdateLoading(false);
    }
  };

  // Concerts: same as Market bottom
  useEffect(() => {
    if (!debouncedArtistQuery) {
      setEvents([]);
      setConcertsError("");
      setConcertsLoading(false);
      return;
    }
    let cancelled = false;
    setConcertsLoading(true);
    setConcertsError("");
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("artists", debouncedArtistQuery);
        if (debouncedCity.trim()) params.set("city", debouncedCity.trim());
        if (debouncedCountry.trim()) params.set("country", debouncedCountry.trim());
        const res = await fetch(`/api/market/concerts?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load concerts");
        }
        const data = await res.json();
        if (cancelled) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (e) {
        if (!cancelled) {
          setConcertsError(e.message || "Could not load concerts.");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setConcertsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedArtistQuery, debouncedCity, debouncedCountry]);

  const hasHerds = followedHerds.length > 0;
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    return events.filter((ev) => {
      const evVenue = (ev.venue || "").toLowerCase();
      const vFilter = venue.trim().toLowerCase();
      if (vFilter && !evVenue.includes(vFilter)) return false;
      const evDate = ev.date ? new Date(ev.date) : null;
      if (startDate) {
        const start = new Date(startDate);
        if (!evDate || evDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!evDate || evDate > end) return false;
      }
      return true;
    });
  }, [events, venue, startDate, endDate]);
  const eventsToRender =
    filteredEvents.length > 0 || venue || startDate || endDate ? filteredEvents : events;

  const handleOpenTickets = (url) => {
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Music recommended for you */}
      <div style={{ padding: "24px 20px 8px" }}>
        <div
          style={{
            fontFamily: F,
            fontSize: 22,
            fontWeight: 700,
            color: "#1e1b4b",
            marginBottom: 4,
          }}
        >
          Music recommended for you
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleMusicUpdate}
            disabled={musicUpdateLoading || artistIdsForMusic.length === 0}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid rgba(13,148,136,0.5)",
              background: "rgba(16,185,129,0.12)",
              fontFamily: F,
              fontSize: 12,
              fontWeight: 600,
              color: "#0f766e",
              cursor: musicUpdateLoading || !artistIdsForMusic.length ? "default" : "pointer",
              opacity: (musicUpdateLoading || !artistIdsForMusic.length) ? 0.7 : 1,
            }}
          >
            {musicUpdateLoading ? "Updating…" : "Update"}
          </button>
        </div>
        {musicError && (
          <div
            style={{
              fontFamily: F,
              fontSize: 12,
              color: "#b91c1c",
              marginBottom: 8,
            }}
          >
            {musicError}
          </div>
        )}
        {musicLoading && (
          <Card style={{ padding: "20px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.8)" }}>
              Loading music…
            </div>
          </Card>
        )}
        {!musicLoading && artistIdsForMusic.length === 0 && (
          <Card style={{ padding: "16px" }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.8)" }}>
              Follow artist fan clubs in Herds to see music recommended for you here.
            </div>
          </Card>
        )}
        {!musicLoading && artistIdsForMusic.length > 0 && releases.length === 0 && !musicError && (
          <Card style={{ padding: "16px" }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.8)" }}>
              No recent releases found. Try "Update" later.
            </div>
          </Card>
        )}
        {!musicLoading && releases.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {releases.map((r) => (
              <a
                key={`${r.artistId}-${r.albumId}`}
                href={r.spotify_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  minWidth: 140,
                  maxWidth: 160,
                  borderRadius: 16,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(226,232,240,0.9)",
                  overflow: "hidden",
                  flexShrink: 0,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    height: 110,
                    background: r.imageUrl
                      ? `url(${r.imageUrl}) center/cover`
                      : "linear-gradient(135deg,#0d9488,#10b981)",
                  }}
                />
                <div style={{ padding: "8px 10px 10px" }}>
                  <div
                    style={{
                      fontFamily: F,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: 4,
                    }}
                  >
                    {r.name}
                  </div>
                  <div
                    style={{
                      fontFamily: F,
                      fontSize: 11,
                      color: "rgba(55,65,81,0.7)",
                    }}
                  >
                    {r.artistName || "Artist"}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Concerts Recommended For You */}
      <Sec icon="🎟️" right="Filters ›" onRightClick={() => setFiltersOpen(true)}>
        Concerts Recommended for You
      </Sec>
      <div
        style={{
          padding: "0 20px 4px",
          fontFamily: F,
          fontSize: 12,
          color: "rgba(55,48,107,0.7)",
        }}
      >
        {hasHerds
          ? "Upcoming concerts by your favorite artists."
          : "Follow a few fan clubs to start seeing recommended concerts here."}
      </div>

      <div style={{ padding: "8px 16px 24px" }}>
        {concertsLoading && (
          <Card style={{ padding: "20px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.8)" }}>
              Loading Concerts…
            </div>
          </Card>
        )}
        {!concertsLoading && concertsError && (
          <Card style={{ padding: "16px", background: "#fef2f2" }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "#b91c1c" }}>{concertsError}</div>
          </Card>
        )}
        {!concertsLoading && !concertsError && hasHerds && events.length === 0 && (
          <Card style={{ padding: "20px 16px" }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.8)" }}>
              No upcoming Ticketmaster events found for these artists right now.
            </div>
          </Card>
        )}
        {!concertsLoading &&
          !concertsError &&
          hasHerds &&
          events.length > 0 &&
          (venue || startDate || endDate) &&
          filteredEvents.length === 0 && (
            <Card style={{ padding: "20px 16px" }}>
              <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.8)" }}>
                No concerts match your filters. Try adjusting them.
              </div>
            </Card>
          )}
        {!concertsLoading && !concertsError && !hasHerds && (
          <Card style={{ padding: "20px 16px" }}>
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.8)" }}>
              Join a few fan clubs from the Herds tab to see concerts recommended for you here.
            </div>
          </Card>
        )}
        {!concertsLoading &&
          !concertsError &&
          eventsToRender.map((ev) => (
            <Card
              key={ev.id}
              style={{
                margin: "0 0 12px",
                padding: "10px 12px",
                display: "flex",
                alignItems: "stretch",
                gap: 10,
              }}
            >
              {ev.image_url && (
                <img
                  src={ev.image_url}
                  alt={ev.event_name || ev.artist || "Concert"}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontFamily: F,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1e1b4b",
                    marginBottom: 2,
                  }}
                >
                  {ev.artist || "Artist"}
                </div>
                <div
                  style={{
                    fontFamily: F,
                    fontSize: 12,
                    color: "rgba(55,48,107,0.75)",
                    marginBottom: 2,
                  }}
                >
                  {ev.event_name}
                </div>
                <div
                  style={{
                    fontFamily: F,
                    fontSize: 11,
                    color: "rgba(55,48,107,0.7)",
                    marginBottom: 4,
                  }}
                >
                  {formatDate(ev.date)}
                  {ev.venue && <> · {ev.venue}</>}
                  {ev.city && (
                    <> · {ev.city}{ev.country ? `, ${ev.country}` : ""}</>
                  )}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenTickets(ev.ticket_url)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: "none",
                      background: "linear-gradient(135deg, #0d9488, #10b981)",
                      color: "#fff",
                      fontFamily: F,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: ev.ticket_url ? "pointer" : "default",
                      opacity: ev.ticket_url ? 1 : 0.5,
                    }}
                    disabled={!ev.ticket_url}
                  >
                    Find Tickets
                  </button>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {filtersOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFiltersOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 20,
              background: "#fff",
              boxShadow: "0 20px 60px rgba(15,23,42,0.45)",
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>
                Filters
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  fontFamily: F,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0f766e",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chicago"
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.7)",
                  fontFamily: F,
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  fontFamily: F,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0f766e",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Country code
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. US, CA, GB"
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.7)",
                  fontFamily: F,
                  fontSize: 13,
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontFamily: F,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0f766e",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.7)",
                    fontFamily: F,
                    fontSize: 13,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontFamily: F,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#0f766e",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.7)",
                    fontFamily: F,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(135deg, #0d9488, #10b981)",
                color: "#fff",
                fontFamily: F,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
