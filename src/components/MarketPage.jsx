import React, { useEffect, useMemo, useState } from "react";
import { Card, F, Sec } from "./ui";

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

export default function MarketPage({ userHerds }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedHerdId, setSelectedHerdId] = useState("all");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
   const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const followedHerds = Array.isArray(userHerds) ? userHerds.slice(0, 30) : [];

  const artistQuery = useMemo(() => {
    if (!followedHerds.length) return "";
    if (selectedHerdId === "all") {
      return followedHerds
        .map((h) => h?.name)
        .filter((n) => typeof n === "string" && n.trim().length > 0)
        .join(",");
    }
    const herd = followedHerds.find((h) => h.id === selectedHerdId);
    return herd?.name || "";
  }, [followedHerds, selectedHerdId]);

  useEffect(() => {
    if (!artistQuery) {
      setEvents([]);
      setError("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchEvents = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("artists", artistQuery);
        if (city.trim()) params.set("city", city.trim());
        if (country.trim()) params.set("country", country.trim());
        const res = await fetch(`/api/market/concerts?${params.toString()}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load concerts");
        }
        const data = await res.json();
        if (cancelled) return;
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (e) {
        if (cancelled) return;
        setError(e.message || "Could not load concerts right now.");
        setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [artistQuery, city, country]);

  const handleOpenTickets = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener");
  };

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
    filteredEvents.length > 0 || venue || startDate || endDate
      ? filteredEvents
      : events;

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Top Shopify-like merch carousel (static placeholder for now) */}
      <div style={{ padding: "24px 20px 8px" }}>
        <div
          style={{
            fontFamily: F,
            fontSize: 22,
            fontWeight: 700,
            color: "#1e1b4b",
            marginBottom: 12,
          }}
        >
          Marketplace
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedHerdId("all")}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border:
                selectedHerdId === "all"
                  ? "1px solid rgba(13,148,136,0.7)"
                  : "1px solid rgba(148,163,184,0.4)",
              background:
                selectedHerdId === "all"
                  ? "rgba(16,185,129,0.16)"
                  : "rgba(255,255,255,0.7)",
              fontFamily: F,
              fontSize: 13,
              fontWeight: 600,
              color:
                selectedHerdId === "all"
                  ? "#0f766e"
                  : "rgba(55,48,107,0.8)",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            All
          </button>
          {followedHerds.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setSelectedHerdId(h.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border:
                  selectedHerdId === h.id
                    ? "1px solid rgba(13,148,136,0.7)"
                    : "1px solid rgba(148,163,184,0.4)",
                background:
                  selectedHerdId === h.id
                    ? "rgba(16,185,129,0.16)"
                    : "rgba(255,255,255,0.7)",
                fontFamily: F,
                fontSize: 13,
                fontWeight: 600,
                color:
                  selectedHerdId === h.id
                    ? "#0f766e"
                    : "rgba(55,48,107,0.8)",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>
      <Card
        style={{
          margin: "0 16px 20px",
          padding: "12px 0 16px",
        }}
      >
        <div
          style={{
            padding: "0 12px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: F,
              fontSize: 14,
              fontWeight: 600,
              color: "#1e1b4b",
            }}
          >
            Featured Merch
          </div>
          <div
            style={{
              fontFamily: F,
              fontSize: 11,
              color: "rgba(55,48,107,0.6)",
            }}
          >
            Shopify integration coming soon
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            padding: "4px 12px 4px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                minWidth: 140,
                maxWidth: 160,
                borderRadius: 16,
                background: "rgba(248,250,252,0.9)",
                border: "1px solid rgba(226,232,240,0.9)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  height: 110,
                  background:
                    i === 1
                      ? "linear-gradient(135deg,#0d9488,#10b981)"
                      : i === 2
                      ? "linear-gradient(135deg,#4f46e5,#22d3ee)"
                      : "linear-gradient(135deg,#f97316,#ec4899)",
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
                  Artist merch
                </div>
                <div
                  style={{
                    fontFamily: F,
                    fontSize: 11,
                    color: "rgba(55,65,81,0.7)",
                  }}
                >
                  Connect Shopify to show real items here.
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Concerts Recommended For You */}
      <Sec
        icon="🎟️"
        right="Filters ›"
        onRightClick={() => setFiltersOpen(true)}
      >
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
        {loading && (
          <Card style={{ padding: "20px 16px", textAlign: "center" }}>
            <div
              style={{
                fontFamily: F,
                fontSize: 13,
                color: "rgba(55,48,107,0.8)",
              }}
            >
              Loading Concerts…
            </div>
          </Card>
        )}
        {!loading && error && (
          <Card style={{ padding: "16px 16px", background: "#fef2f2" }}>
            <div
              style={{
                fontFamily: F,
                fontSize: 13,
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          </Card>
        )}
        {!loading && !error && hasHerds && events.length === 0 && (
          <Card style={{ padding: "20px 16px" }}>
            <div
              style={{
                fontFamily: F,
                fontSize: 13,
                color: "rgba(55,48,107,0.8)",
              }}
            >
              No upcoming Ticketmaster events found for these artists right now.
            </div>
          </Card>
        )}
        {!loading &&
          !error &&
          hasHerds &&
          events.length > 0 &&
          (venue || startDate || endDate) &&
          filteredEvents.length === 0 && (
            <Card style={{ padding: "20px 16px" }}>
              <div
                style={{
                  fontFamily: F,
                  fontSize: 13,
                  color: "rgba(55,48,107,0.8)",
                }}
              >
                No concerts match your filters. Try adjusting them.
              </div>
            </Card>
          )}
        {!loading && !error && !hasHerds && (
          <Card style={{ padding: "20px 16px" }}>
            <div
              style={{
                fontFamily: F,
                fontSize: 13,
                color: "rgba(55,48,107,0.8)",
              }}
            >
              Join a few fan clubs from the Herds tab to see concerts recommended
              for you here.
            </div>
          </Card>
        )}
        {!loading &&
          !error &&
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
                  {ev.venue && (
                    <>
                      {" · "}
                      {ev.venue}
                    </>
                  )}
                  {ev.city && (
                    <>
                      {" · "}
                      {ev.city}
                      {ev.country ? `, ${ev.country}` : ""}
                    </>
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
                      background:
                        "linear-gradient(135deg, #0d9488, #10b981)",
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
              <div
                style={{
                  fontFamily: F,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1e1b4b",
                }}
              >
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
                background:
                  "linear-gradient(135deg, #0d9488, #10b981)",
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

