import { useState } from "react";
import { Inp, Btn } from "./ui";

const F = "'DM Sans', sans-serif";

export default function AddConcertModal({ onClose, onAdd }) {
  const [mode, setMode] = useState("search");
  const [q, setQ] = useState("");
  const [artist, setArtist] = useState("");
  const [tour, setTour] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [concertDetailsFilter, setConcertDetailsFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    setConcertDetailsFilter("");
    setYearFilter("");
    try {
      const url = `/api/concerts/search?artist=${encodeURIComponent(q.trim())}`;
      const res = await fetch(url);
      let data;
      try {
        data = await res.json();
      } catch (_) {
        setSearchError("Invalid response. Try again or use Manual Entry.");
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setSearchResults(Array.isArray(data?.concerts) ? data.concerts : []);
    } catch (err) {
      setSearchError(err?.message || "Could not search. Try manual entry.");
    } finally {
      setSearching(false);
    }
  };

  const addFromSearch = (c) => {
    onAdd({ id: crypto.randomUUID(), artist: c.artist, tour: c.tour || null, date: c.date, venue: c.venue || "", city: c.city || null, ticket_type: null, ticket_price: null, source: "setlist.fm" });
    onClose();
  };

  const detailsLower = concertDetailsFilter.trim().toLowerCase();
  const yearTrim = yearFilter.trim();
  const filteredResults = searchResults.filter((c) => {
    if (detailsLower) {
      const searchText = [c.artist, c.tour, c.date, c.venue, c.city].filter(Boolean).join(" ").toLowerCase();
      if (!searchText.includes(detailsLower)) return false;
    }
    if (yearTrim && c.date) {
      if (!c.date.startsWith(yearTrim)) return false;
    }
    return true;
  });

  const add = () => {
    if (!artist || !date || !venue) return;
    onAdd({ id: crypto.randomUUID(), artist, tour, date, venue, city, ticket_type: ticketType || null, ticket_price: ticketPrice ? parseFloat(ticketPrice) : null, source: "manual" });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: 20, padding: "24px 20px 36px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Add Concert</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "flex", marginBottom: 20, background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: 3 }}>
          {[["search", "Search Setlist.fm"], ["manual", "Manual Entry"]].map(([m, l]) => (
            <button key={m} onClick={() => { setMode(m); setSearchError(""); setSearchResults([]); setConcertDetailsFilter(""); setYearFilter(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: mode === m ? "#fff" : "transparent", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: F, fontSize: 13, fontWeight: 600, color: mode === m ? "#4f46e5" : "rgba(55,48,107,0.4)", cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {mode === "search" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search artist name..." style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none" }} />
              <button onClick={search} disabled={searching} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: searching ? "wait" : "pointer" }}>🔍</button>
            </div>
            {searchError && <div style={{ fontFamily: F, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{searchError}</div>}
            {searching && <div style={{ textAlign: "center", padding: 24, fontFamily: F, fontSize: 13, color: "#4f46e5" }}>Searching Setlist.fm…</div>}
            {!searching && searchResults.length > 0 && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#4f46e5", display: "block", marginBottom: 6 }}>Concert details — name, venue, etc.</label>
                  <input value={concertDetailsFilter} onChange={(e) => setConcertDetailsFilter(e.target.value)} placeholder="Filter by venue, tour, city…" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#4f46e5", display: "block", marginBottom: 6 }}>Year</label>
                  <input type="text" inputMode="numeric" value={yearFilter} onChange={(e) => setYearFilter(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="e.g. 2024" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }} />
                </div>
                {(concertDetailsFilter.trim() || yearFilter.trim()) && <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginBottom: 8 }}>Showing {filteredResults.length} of {searchResults.length}</div>}
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {filteredResults.length === 0 ? <div style={{ padding: 20, textAlign: "center", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.5)" }}>No concerts match the filters.</div> : filteredResults.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", marginBottom: 8, background: "rgba(99,102,241,0.06)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.1)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.artist}{c.tour ? ` · ${c.tour}` : ""}</div>
                        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginTop: 2 }}>{c.date}{c.venue ? ` · ${c.venue}` : ""}{c.city ? `, ${c.city}` : ""}</div>
                      </div>
                      <button onClick={() => addFromSearch(c)} style={{ marginLeft: 12, padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!searching && searchResults.length === 0 && !searchError && <div style={{ textAlign: "center", padding: 24, fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.4)", lineHeight: 1.6 }}>Search for an artist to find concerts.<br />Powered by Setlist.fm.</div>}
          </>
        ) : (
          <>
            <Inp label="Artist *" value={artist} onChange={setArtist} placeholder="Fred Again" />
            <Inp label="Tour Name" value={tour} onChange={setTour} placeholder="Actual Life Tour" />
            <Inp label="Date *" type="date" value={date} onChange={setDate} />
            <Inp label="Venue *" value={venue} onChange={setVenue} placeholder="Hollywood Palladium" />
            <Inp label="City" value={city} onChange={setCity} placeholder="Los Angeles, CA" />
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><Inp label="Ticket Type" value={ticketType} onChange={setTicketType} placeholder="GA, VIP..." /></div>
              <div style={{ flex: 1 }}><Inp label="Price ($)" type="number" value={ticketPrice} onChange={setTicketPrice} placeholder="150" /></div>
            </div>
            <Btn onClick={add} disabled={!artist || !date || !venue}>Add Concert</Btn>
          </>
        )}
      </div>
    </div>
  );
}
