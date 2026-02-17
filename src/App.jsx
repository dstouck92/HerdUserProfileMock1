import { useState, useCallback, useEffect } from "react";
import { supabase } from "./lib/supabase";

/*
HERD MVP3 — Production Prototype
Foundation from HerdMVP3_Prototype2.jsx (Claude → Cursor)

CURSOR INTEGRATION NOTES:
- Auth: Replace with Supabase Auth (supabase.auth.signUp / signInWithPassword)
- Storage: Replace useState with Supabase queries
- Spotify JSON: Parse server-side via API route, store in user_streaming_stats
- Concerts: Setlist.fm search wired via /api/concerts/search
- File upload: Use Supabase Storage for merch photos

SPOTIFY EXTENDED HISTORY SCHEMA (per record):
{ ts, ms_played, master_metadata_track_name, master_metadata_album_artist_name,
  master_metadata_album_album_name, spotify_track_uri, platform, shuffle, skipped }
Files: Streaming_History_Audio_YYYY-YYYY_N.json — users upload all or a zip.
*/

// CURSOR: Move to lib/spotify-json-parser.ts
function parseSpotifyFiles(filesContent) {
  const artistStats = {}, trackStats = {};
  let totalMs = 0, totalRecords = 0;
  for (const fileData of filesContent) {
    for (const r of fileData) {
      const artist = r.master_metadata_album_artist_name;
      const track = r.master_metadata_track_name;
      const album = r.master_metadata_album_album_name;
      const ms = r.ms_played || 0;
      if (!artist || !track || ms < 5000) continue;
      totalMs += ms; totalRecords++;
      if (!artistStats[artist]) artistStats[artist] = { total_ms: 0, play_count: 0 };
      artistStats[artist].total_ms += ms; artistStats[artist].play_count++;
      const tk = `${track}|||${artist}|||${album || ""}`;
      if (!trackStats[tk]) trackStats[tk] = { track, artist, album, total_ms: 0, play_count: 0 };
      trackStats[tk].total_ms += ms; trackStats[tk].play_count++;
    }
  }
  return {
    totalHours: Math.round(totalMs / 3600000), totalRecords,
    uniqueArtists: Object.keys(artistStats).length,
    uniqueTracks: Object.keys(trackStats).length,
    topArtists: Object.entries(artistStats).map(([name, s]) => ({ name, hours: Math.round(s.total_ms / 3600000 * 10) / 10, plays: s.play_count })).sort((a, b) => b.hours - a.hours),
    topTracks: Object.values(trackStats).sort((a, b) => b.play_count - a.play_count).map(t => ({ name: t.track, artist: t.artist, album: t.album, plays: t.play_count, hours: Math.round(t.total_ms / 3600000 * 10) / 10 })),
  };
}

const F = "'DM Sans', sans-serif";
const GradientBg = ({ children }) => (<div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "linear-gradient(165deg, #ede9fe 0%, #e0e7ff 25%, #ddd6fe 45%, #c7d2fe 65%, #e0e7ff 85%, #ede9fe 100%)", fontFamily: F, position: "relative" }}><link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />{children}</div>);
const Card = ({ children, style }) => (<div style={{ margin: "0 16px 16px", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.55)", boxShadow: "0 2px 16px rgba(99,102,241,0.06)", overflow: "hidden", ...style }}>{children}</div>);
const Btn = ({ children, onClick, disabled, style }) => (<button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: disabled ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : "0 4px 16px rgba(99,102,241,0.3)", ...style }}>{children}</button>);
const Btn2 = ({ children, onClick, style }) => (<button onClick={onClick} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.6)", color: "#6366f1", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", ...style }}>{children}</button>);
const Inp = ({ label, type, value, onChange, placeholder }) => (<div style={{ marginBottom: 16 }}><label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#4f46e5", display: "block", marginBottom: 6 }}>{label}</label><input type={type||"text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }} /></div>);

const TabBar = ({ active, onSelect }) => (<div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.15)", marginBottom: 20 }}>{["Curate","Digital","Physical","Live"].map(t => (<button key={t} onClick={() => onSelect(t)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", color: active===t ? "#4f46e5" : "rgba(55,48,107,0.55)", fontFamily: F, fontSize: 15, fontWeight: active===t ? 700 : 500, cursor: "pointer", position: "relative" }}>{t}{active===t && <span style={{ position: "absolute", bottom: -1, left: "30%", right: "30%", height: 3, borderRadius: 2, background: "linear-gradient(90deg, #6366f1, #818cf8)" }} />}</button>))}</div>);

const ProfileHeader = ({ user }) => (<div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 20px 12px" }}><div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a78bfa, #c4b5fd)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 24, fontWeight: 700, color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.35)", flexShrink: 0 }}>{user.display_name.split(" ").map(n=>n[0]).join("")}</div><div><div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: "#1e1b4b" }}>{user.display_name}</div><div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", marginTop: 2 }}>@{user.username}</div><button style={{ marginTop: 8, padding: "6px 24px", borderRadius: 20, border: "none", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" }}>Public Profile</button></div></div>);

const Sec = ({ children, icon, right }) => (<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", marginBottom: 10, marginTop: 4 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{icon && <span style={{ fontSize: 20 }}>{icon}</span>}<span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>{children}</span></div>{right && <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#6366f1", cursor: "pointer" }}>{right}</span>}</div>);

const Stats = ({ stats }) => (<div style={{ display: "flex", margin: "0 20px 16px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.5)" }}>{stats.map((s,i) => (<div key={i} style={{ flex: 1, display: "flex" }}><div style={{ flex: 1, textAlign: "center", padding: "10px 4px" }}><div style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: "#1e1b4b" }}>{s.value}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.55)", fontWeight: 500 }}>{s.label}</div></div>{i < stats.length-1 && <div style={{ width: 1, background: "rgba(99,102,241,0.12)", margin: "8px 0" }} />}</div>))}</div>);

const Empty = ({ icon, title, desc, btn, onAction }) => (<Card style={{ padding: "32px 24px", textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div><div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>{title}</div><div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.55)", lineHeight: 1.6, marginBottom: 20 }}>{desc}</div>{btn && <Btn onClick={onAction} style={{ width: "auto", padding: "12px 32px", display: "inline-block" }}>{btn}</Btn>}</Card>);

// AUTH
const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [username, setUsername] = useState(""); const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (mode === "signup") {
      if (!email||!username||!displayName||!password) return setError("All fields required.");
      if (password.length < 6) return setError("Password must be 6+ characters.");
    } else {
      if (!email||!password) return setError("Email and password required.");
    }

    if (supabase) {
      setLoading(true);
      try {
        if (mode === "signup") {
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName, username, phone: phone || null } },
          });
          if (authError) throw authError;
          if (data?.user) {
            const profile = await getOrCreateProfile(data.user, displayName, username, phone);
            onAuth(profile);
          }
        } else {
          const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          if (data?.user) {
            const profile = await getOrCreateProfile(data.user);
            onAuth(profile);
          }
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mock when no Supabase
    if (mode === "signup") onAuth({ id: "mock", email, phone, username, display_name: displayName });
    else onAuth({ id: "mock", email, phone: "", username: email.split("@")[0], display_name: email.split("@")[0] });
  };

  async function getOrCreateProfile(authUser, displayName, username, phone) {
    const { data: existing } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    const payload = {
      id: authUser.id,
      display_name: displayName ?? existing?.display_name ?? authUser.user_metadata?.display_name ?? authUser.email?.split("@")[0] ?? "",
      username: username ?? existing?.username ?? authUser.user_metadata?.username ?? authUser.email?.split("@")[0] ?? "",
      phone: phone ?? existing?.phone ?? authUser.user_metadata?.phone ?? null,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    return { id: payload.id, display_name: payload.display_name, username: payload.username };
  }
  return (<GradientBg><div style={{ padding: "60px 24px 40px", textAlign: "center" }}><div style={{ fontSize: 44, marginBottom: 8 }}>🐾</div><div style={{ fontFamily: F, fontSize: 32, fontWeight: 800, color: "#1e1b4b" }}>Herd</div><div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.55)", marginTop: 4, marginBottom: 32 }}>Your music fandom, all in one place</div>
    <Card style={{ margin: "0 0 20px", padding: "24px 20px" }}>
      <div style={{ display: "flex", marginBottom: 24, background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: 3 }}>{["login","signup"].map(m => (<button key={m} onClick={() => {setMode(m);setError("");}} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: mode===m ? "#fff" : "transparent", boxShadow: mode===m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: F, fontSize: 14, fontWeight: 600, color: mode===m ? "#4f46e5" : "rgba(55,48,107,0.4)", cursor: "pointer" }}>{m==="login"?"Log In":"Sign Up"}</button>))}</div>
      {mode === "signup" && <><Inp label="Display Name" value={displayName} onChange={setDisplayName} placeholder="David Stouck" /><Inp label="Username" value={username} onChange={setUsername} placeholder="davidstouck" /><Inp label="Phone (optional)" type="tel" value={phone} onChange={setPhone} placeholder="(555) 123-4567" /></>}
      <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" />
      <Inp label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" />
      {error && <div style={{ fontFamily: F, fontSize: 13, color: "#dc2626", marginBottom: 12, textAlign: "left" }}>{error}</div>}
      <Btn onClick={submit} disabled={loading}>{loading ? "…" : mode==="login"?"Log In":"Create Account"}</Btn>
      <div style={{ marginTop: 16, display: "flex", gap: 10 }}><Btn2 style={{ flex: 1, padding: "10px 0", fontSize: 13 }}>Google</Btn2><Btn2 style={{ flex: 1, padding: "10px 0", fontSize: 13 }}>Spotify</Btn2></div>
    </Card></div></GradientBg>);
};

// SPOTIFY UPLOAD MODAL
const SpotifyUploadModal = ({ onClose, onComplete }) => {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const handle = useCallback(async (files) => {
    setProcessing(true); const audio = [];
    for (const f of files) { if (f.name.endsWith(".json") && f.name.includes("Streaming_History_Audio")) { setProgress(`Reading ${f.name}...`); try { audio.push(JSON.parse(await f.text())); } catch(e){} } }
    if (!audio.length) { setProgress("No valid Spotify audio files found."); setProcessing(false); return; }
    setProgress(`Analyzing ${audio.length} files...`); await new Promise(r=>setTimeout(r,500));
    const stats = parseSpotifyFiles(audio);
    setProgress(`Done! ${stats.totalHours.toLocaleString()} hours, ${stats.uniqueArtists.toLocaleString()} artists.`);
    await new Promise(r=>setTimeout(r,800)); onComplete(stats);
  }, [onComplete]);
  return (<div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
    <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Upload Spotify History</div><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>✕</button></div>
      <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", marginBottom: 20, lineHeight: 1.6 }}>Upload your Spotify Extended Streaming History JSON files or ZIP.<br/><br/><strong style={{ color: "#4f46e5" }}>How:</strong> Spotify → Settings → Privacy → Request data → "Extended streaming history"</div>
      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);handle(Array.from(e.dataTransfer.files));}} style={{ border: `2px dashed ${dragging?"#6366f1":"rgba(99,102,241,0.25)"}`, borderRadius: 16, padding: "36px 20px", textAlign: "center", background: dragging?"rgba(99,102,241,0.05)":"rgba(99,102,241,0.02)", marginBottom: 16 }}>
        {processing ? <><div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div><div style={{ fontFamily: F, fontSize: 14, color: "#4f46e5", fontWeight: 600 }}>{progress}</div></> : <><div style={{ fontSize: 32, marginBottom: 8 }}>📂</div><div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b", marginBottom: 4 }}>Drag & drop files here</div><div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Streaming_History_Audio_*.json or .zip</div></>}
      </div>
      {!processing && <label style={{ display: "block" }}><input type="file" multiple accept=".json,.zip" onChange={e=>handle(Array.from(e.target.files))} style={{ display: "none" }} /><Btn>Browse Files</Btn></label>}
    </div></div>);
};

// ADD CONCERT MODAL
const AddConcertModal = ({ onClose, onAdd }) => {
  const [mode, setMode] = useState("search"); const [q, setQ] = useState("");
  const [artist, setArtist] = useState(""); const [tour, setTour] = useState("");
  const [date, setDate] = useState(""); const [venue, setVenue] = useState("");
  const [city, setCity] = useState(""); const [ticketType, setTicketType] = useState("");
  const [ticketPrice, setTicketPrice] = useState(""); const [searching, setSearching] = useState(false);
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

  const add = () => { if(!artist||!date||!venue) return; onAdd({ id: crypto.randomUUID(), artist, tour, date, venue, city, ticket_type: ticketType||null, ticket_price: ticketPrice?parseFloat(ticketPrice):null, source:"manual" }); onClose(); };
  return (<div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: 20, padding: "24px 20px 36px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Add Concert</div><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>✕</button></div>
      <div style={{ display: "flex", marginBottom: 20, background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: 3 }}>{[["search","Search Setlist.fm"],["manual","Manual Entry"]].map(([m,l])=>(<button key={m} onClick={()=>{setMode(m);setSearchError("");setSearchResults([]);setConcertDetailsFilter("");setYearFilter("");}} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: mode===m?"#fff":"transparent", boxShadow: mode===m?"0 1px 4px rgba(0,0,0,0.08)":"none", fontFamily: F, fontSize: 13, fontWeight: 600, color: mode===m?"#4f46e5":"rgba(55,48,107,0.4)", cursor: "pointer" }}>{l}</button>))}</div>
      {mode==="search" ? <>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search artist name..." style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none" }} /><button onClick={search} disabled={searching} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: searching?"wait":"pointer" }}>🔍</button></div>
        {searchError && <div style={{ fontFamily: F, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{searchError}</div>}
        {searching && <div style={{ textAlign: "center", padding: 24, fontFamily: F, fontSize: 13, color: "#4f46e5" }}>Searching Setlist.fm…</div>}
        {!searching && searchResults.length > 0 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#4f46e5", display: "block", marginBottom: 6 }}>Concert details — name, venue, etc.</label>
              <input value={concertDetailsFilter} onChange={e=>setConcertDetailsFilter(e.target.value)} placeholder="Filter by venue, tour, city…" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#4f46e5", display: "block", marginBottom: 6 }}>Year</label>
              <input type="text" inputMode="numeric" value={yearFilter} onChange={e=>setYearFilter(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="e.g. 2024" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }} />
            </div>
            {(concertDetailsFilter.trim() || yearFilter.trim()) && <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginBottom: 8 }}>Showing {filteredResults.length} of {searchResults.length}</div>}
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filteredResults.length === 0 ? <div style={{ padding: 20, textAlign: "center", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.5)" }}>No concerts match the filters.</div> : filteredResults.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", marginBottom: 8, background: "rgba(99,102,241,0.06)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.1)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.artist}{c.tour ? ` · ${c.tour}` : ""}</div>
                  <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginTop: 2 }}>{c.date}{c.venue ? ` · ${c.venue}` : ""}{c.city ? `, ${c.city}` : ""}</div>
                </div>
                <button onClick={()=>addFromSearch(c)} style={{ marginLeft: 12, padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Add</button>
              </div>
            ))}
            </div>
          </>
        )}
        {!searching && searchResults.length === 0 && !searchError && <div style={{ textAlign: "center", padding: 24, fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.4)", lineHeight: 1.6 }}>Search for an artist to find concerts.<br/>Powered by Setlist.fm.</div>}
      </> : <>
        <Inp label="Artist *" value={artist} onChange={setArtist} placeholder="Fred Again" />
        <Inp label="Tour Name" value={tour} onChange={setTour} placeholder="Actual Life Tour" />
        <Inp label="Date *" type="date" value={date} onChange={setDate} />
        <Inp label="Venue *" value={venue} onChange={setVenue} placeholder="Hollywood Palladium" />
        <Inp label="City" value={city} onChange={setCity} placeholder="Los Angeles, CA" />
        <div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><Inp label="Ticket Type" value={ticketType} onChange={setTicketType} placeholder="GA, VIP..." /></div><div style={{ flex: 1 }}><Inp label="Price ($)" type="number" value={ticketPrice} onChange={setTicketPrice} placeholder="150" /></div></div>
        <Btn onClick={add} disabled={!artist||!date||!venue}>Add Concert</Btn>
      </>}
    </div></div>);
};

// ADD ITEM MODAL (vinyl or merch)
const AddItemModal = ({ type, onClose, onAdd }) => {
  const [artist, setArtist] = useState(""); const [itemName, setItemName] = useState("");
  const [merchType, setMerchType] = useState("T-Shirt"); const [albumName, setAlbumName] = useState("");
  const [isLimited, setIsLimited] = useState(false); const [isTour, setIsTour] = useState(false);
  const [tourName, setTourName] = useState(""); const [price, setPrice] = useState(""); const [loc, setLoc] = useState("");
  const types = ["T-Shirt","Hoodie","Hat","Poster","Tote Bag","Sweatpants","Jacket","Other"];
  const add = () => {
    if (!artist||(type==="vinyl"?!albumName:!itemName)) return;
    if (type==="vinyl") onAdd({ id: Date.now().toString(), artist_name: artist, album_name: albumName, is_limited_edition: isLimited });
    else onAdd({ id: Date.now().toString(), artist_name: artist, item_name: itemName, merch_type: merchType, is_tour_merch: isTour, tour_name: tourName||null, purchase_price: price?parseFloat(price):null, purchase_location: loc||null });
    onClose();
  };
  return (<div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", boxShadow: "0 -10px 40px rgba(0,0,0,0.15)", maxHeight: "85vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Add {type==="vinyl"?"Vinyl Record":"Merch"}</div><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>✕</button></div>
      <Inp label="Artist *" value={artist} onChange={setArtist} placeholder="Fred Again" />
      {type==="vinyl" ? <>
        <Inp label="Album Name *" value={albumName} onChange={setAlbumName} placeholder="Actual Life 3" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><input type="checkbox" checked={isLimited} onChange={()=>setIsLimited(!isLimited)} style={{ accentColor: "#6366f1" }} /><span style={{ fontFamily: F, fontSize: 14, color: "#1e1b4b" }}>Limited Edition</span></div>
      </> : <>
        <Inp label="Item Name *" value={itemName} onChange={setItemName} placeholder="Actual Life Tour Tee" />
        <div style={{ marginBottom: 16 }}><label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#4f46e5", display: "block", marginBottom: 6 }}>Type</label><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{types.map(t=>(<button key={t} onClick={()=>setMerchType(t)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${merchType===t?"#6366f1":"rgba(99,102,241,0.15)"}`, background: merchType===t?"rgba(99,102,241,0.1)":"transparent", fontFamily: F, fontSize: 12, fontWeight: merchType===t?700:500, color: merchType===t?"#4f46e5":"rgba(55,48,107,0.5)", cursor: "pointer" }}>{t}</button>))}</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><input type="checkbox" checked={isTour} onChange={()=>setIsTour(!isTour)} style={{ accentColor: "#6366f1" }} /><span style={{ fontFamily: F, fontSize: 14, color: "#1e1b4b" }}>Tour Merch</span></div>
        {isTour && <Inp label="Tour Name" value={tourName} onChange={setTourName} placeholder="Actual Life Tour" />}
        <div style={{ display: "flex", gap: 12 }}><div style={{ flex: 1 }}><Inp label="Price ($)" type="number" value={price} onChange={setPrice} placeholder="45" /></div><div style={{ flex: 1 }}><Inp label="Where Purchased" value={loc} onChange={setLoc} placeholder="MSG, Online..." /></div></div>
      </>}
      <Btn onClick={add} disabled={!artist||(type==="vinyl"?!albumName:!itemName)}>Add {type==="vinyl"?"Record":"Item"}</Btn>
    </div></div>);
};

// TABS
const LiveTab = ({ concerts, onAdd }) => {
  if (!concerts.length) return <Empty icon="🎫" title="No Concerts Yet" desc="Search Setlist.fm or manually add concerts you've attended." btn="+ Add Concert" onAction={onAdd} />;
  return (<div>
    <Stats stats={[{value:concerts.length,label:"Concerts"},{value:new Set(concerts.filter(c=>c.tour).map(c=>c.tour)).size,label:"Tours"},{value:new Set(concerts.map(c=>c.artist)).size,label:"Artists"}]} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 10 }}><span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>Concert History</span><button onClick={onAdd} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 12, fontWeight: 600, color: "#6366f1", cursor: "pointer" }}>+ Add</button></div>
    <Card>{concerts.map((c,i) => (<div key={c.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i===concerts.length-1?"none":"1px solid rgba(99,102,241,0.07)" }}><span style={{ fontSize: 26, marginRight: 14 }}>🎫</span><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>{c.artist}</strong>{c.tour&&<span style={{ fontWeight: 400, color: "rgba(55,48,107,0.6)" }}> - {c.tour}</span>}</div><div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginTop: 2 }}><span style={{ fontWeight: 600, color: "#6366f1" }}>{c.date}</span>{c.venue&&<> | {c.venue}</>}{c.city&&<>, {c.city}</>}</div></div><span style={{ color: "rgba(99,102,241,0.35)", fontSize: 18 }}>›</span></div>))}</Card>
  </div>);
};

const DigitalTab = ({ data, onUpload }) => {
  if (!data) return <Empty icon="🎵" title="No Streaming Data Yet" desc="Upload your Spotify Extended Streaming History to see top artists, songs, and stats." btn="Upload Spotify History" onAction={onUpload} />;
  return (<div>
    <Stats stats={[{value:data.totalHours.toLocaleString(),label:"Total Hours"},{value:data.uniqueArtists.toLocaleString(),label:"Artists"},{value:data.uniqueTracks.toLocaleString(),label:"Tracks"}]} />
    <Sec icon="🎵" right="View All ›">Top Artists</Sec>
    <Card>{data.topArtists.slice(0,10).map((a,i) => (<div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}><span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i+1}</span><div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${240+i*10},70%,${55+i*4}%), hsl(${250+i*12},60%,${65+i*3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "rgba(255,255,255,0.8)" }}>♫</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{a.plays.toLocaleString()} plays</div></div><span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{a.hours} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Hrs</span></span></div>))}</Card>
    <Sec icon="🎶" right="View All ›">Top Songs</Sec>
    <Card>{data.topTracks.slice(0,10).map((t,i) => (<div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}><span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i+1}</span><div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${260+i*8},65%,${50+i*4}%), hsl(${270+i*10},55%,${60+i*3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>♪</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{t.artist}</div></div><span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{t.plays} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Plays</span></span></div>))}</Card>
    <Sec icon="📊">Platform Usage</Sec>
    <Card><div style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>♫</div><span style={{ flex: 1, fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>Spotify</span><span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{data.totalHours.toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Hours</span></span></div></Card>
  </div>);
};

const PhysicalTab = ({ vinyl, merch, onAddVinyl, onAddMerch }) => {
  const merchByArtist = {};
  for (const m of merch) { if(!merchByArtist[m.artist_name]) merchByArtist[m.artist_name]=[]; merchByArtist[m.artist_name].push(m); }
  if (!vinyl.length && !merch.length) return (<div><Empty icon="💿" title="No Physical Collection Yet" desc="Track your vinyl records and merch." /><div style={{ display: "flex", gap: 10, padding: "0 16px" }}><Btn2 onClick={onAddVinyl} style={{ flex: 1 }}>+ Vinyl</Btn2><Btn onClick={onAddMerch} style={{ flex: 1 }}>+ Merch</Btn></div></div>);
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 4 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>💿</span><span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>Vinyl Collection</span></div><button onClick={onAddVinyl} style={{ padding: "5px 12px", borderRadius: 16, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 11, fontWeight: 600, color: "#6366f1", cursor: "pointer" }}>+ Add</button></div>
    {vinyl.length ? <><div style={{ padding: "0 20px", marginBottom: 10, fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.5)" }}><strong style={{ color: "#4f46e5" }}>{vinyl.length}</strong> Records | <strong style={{ color: "#4f46e5" }}>{vinyl.filter(v=>v.is_limited_edition).length}</strong> Limited</div><Card>{vinyl.map((v,i)=>(<div key={v.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 14, borderBottom: i<vinyl.length-1?"1px solid rgba(99,102,241,0.06)":"none" }}><div style={{ width: 48, height: 48, borderRadius: 6, background: "linear-gradient(135deg, #312e81, #4338ca)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💿</div><div style={{ flex: 1 }}><div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{v.artist_name}</div><div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginTop: 2 }}>{v.album_name}{v.is_limited_edition&&<span style={{ color: "#6366f1", fontWeight: 600 }}> · Limited</span>}</div></div></div>))}</Card></> : <Card style={{ padding: 20, textAlign: "center" }}><div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.4)" }}>No vinyl yet</div></Card>}
    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>👕</span><span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>Merch Collection</span></div><button onClick={onAddMerch} style={{ padding: "5px 12px", borderRadius: 16, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 11, fontWeight: 600, color: "#6366f1", cursor: "pointer" }}>+ Add</button></div>
    {merch.length ? <Card>{Object.entries(merchByArtist).map(([a, items], ai)=>(<div key={a} style={{ padding: "12px 20px", borderBottom: ai<Object.keys(merchByArtist).length-1?"1px solid rgba(99,102,241,0.06)":"none" }}><div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>{a}</div>{items.map(item=>(<div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", padding: "3px 0 3px 12px" }}><span>{item.item_name} <span style={{ color: "rgba(55,48,107,0.35)" }}>· {item.merch_type}</span></span>{item.purchase_price&&<span style={{ color: "#4f46e5", fontWeight: 600 }}>${item.purchase_price}</span>}</div>))}</div>))}</Card> : <Card style={{ padding: 20, textAlign: "center" }}><div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.4)" }}>No merch yet</div></Card>}
  </div>);
};

const CurateTab = ({ concerts, merch, vinyl, data }) => {
  const hasData = concerts.length>0 || merch.length>0 || vinyl.length>0 || data;
  if (!hasData) return <Empty icon="✨" title="Nothing to Curate Yet" desc="Add concerts, merch, vinyl, or upload Spotify history first." />;
  return (<div>
    <div style={{ margin: "0 20px 16px", padding: "14px 16px", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))", borderRadius: 14, border: "1px solid rgba(99,102,241,0.15)" }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5", marginBottom: 4 }}>✨ Curate Your Public Profile</div><div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", lineHeight: 1.5 }}>Select items from Digital, Physical, and Live tabs to feature publicly.</div></div>
    {data && data.topArtists.length>0 && <><Sec icon="🎵">From Your Streaming</Sec><Card>{data.topArtists.slice(0,3).map((a,i)=>(<div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i<2?"1px solid rgba(99,102,241,0.06)":"none" }}><input type="checkbox" style={{ accentColor: "#6366f1" }} /><div style={{ flex: 1 }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{a.name}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{a.hours} hours</div></div><span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#059669", background: "rgba(16,185,129,0.08)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>streaming</span></div>))}</Card></>}
    {concerts.length>0 && <><Sec icon="🎫">From Your Concerts</Sec><Card>{concerts.slice(0,3).map((c,i)=>(<div key={c.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i<Math.min(concerts.length,3)-1?"1px solid rgba(99,102,241,0.06)":"none" }}><input type="checkbox" style={{ accentColor: "#6366f1" }} /><div style={{ flex: 1 }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{c.artist}{c.tour?` - ${c.tour}`:""}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{c.date} · {c.venue}</div></div><span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#4f46e5", background: "rgba(99,102,241,0.08)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>concert</span></div>))}</Card></>}
    <div style={{ margin: "8px 20px 20px", display: "flex", gap: 10 }}><Btn2 style={{ flex: 1 }}>+ Add Item</Btn2><Btn style={{ flex: 1 }}>Preview Profile</Btn></div>
  </div>);
};

// MAIN APP (exported as App for Vite entry)
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [activeTab, setActiveTab] = useState("Digital");
  const [streamingData, setStreamingData] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [vinyl, setVinyl] = useState([]);
  const [merch, setMerch] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showConcert, setShowConcert] = useState(false);
  const [showVinyl, setShowVinyl] = useState(false);
  const [showMerch, setShowMerch] = useState(false);

  // Supabase: restore session and load profile
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("id, display_name, username").eq("id", session.user.id).single();
        setUser(profile || { id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user" });
      }
      setAuthLoading(false);
    };
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setUser(null);
        setConcerts([]);
        setVinyl([]);
        setMerch([]);
        setStreamingData(null);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("id, display_name, username").eq("id", session.user.id).single();
      setUser(profile || { id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user" });
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Load user data when logged in (Supabase)
  useEffect(() => {
    if (!supabase || !user?.id) return;
    const uid = user.id;
    (async () => {
      const [cRes, vRes, mRes, sRes] = await Promise.all([
        supabase.from("concerts").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("vinyl").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("merch").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("user_streaming_stats").select("*").eq("user_id", uid).single(),
      ]);
      if (cRes.data) setConcerts(cRes.data.map(r => ({ id: r.id, artist: r.artist, tour: r.tour, date: r.date, venue: r.venue, city: r.city, ticket_type: r.ticket_type, ticket_price: r.ticket_price, source: r.source })));
      if (vRes.data) setVinyl(vRes.data.map(r => ({ id: r.id, artist_name: r.artist_name, album_name: r.album_name, is_limited_edition: r.is_limited_edition })));
      if (mRes.data) setMerch(mRes.data.map(r => ({ id: r.id, artist_name: r.artist_name, item_name: r.item_name, merch_type: r.merch_type, is_tour_merch: r.is_tour_merch, tour_name: r.tour_name, purchase_price: r.purchase_price, purchase_location: r.purchase_location })));
      if (sRes.data?.user_id) {
        const s = sRes.data;
        setStreamingData({
          totalHours: s.total_hours ?? 0,
          totalRecords: s.total_records ?? 0,
          uniqueArtists: s.unique_artists ?? 0,
          uniqueTracks: s.unique_tracks ?? 0,
          topArtists: s.top_artists ?? [],
          topTracks: s.top_tracks ?? [],
        });
      }
    })();
  }, [user?.id]);

  const handleLogout = () => {
    if (supabase) supabase.auth.signOut();
    setUser(null);
  };

  const handleAddConcert = async (c) => {
    if (supabase && user?.id) {
      const { data, error } = await supabase.from("concerts").insert({
        user_id: user.id,
        artist: c.artist,
        tour: c.tour || null,
        date: c.date,
        venue: c.venue || null,
        city: c.city || null,
        ticket_type: c.ticket_type || null,
        ticket_price: c.ticket_price ?? null,
        source: c.source || "manual",
      }).select().single();
      if (!error && data) {
        setConcerts(prev => [{ id: data.id, artist: data.artist, tour: data.tour, date: data.date, venue: data.venue, city: data.city, ticket_type: data.ticket_type, ticket_price: data.ticket_price, source: data.source }, ...prev]);
        return;
      }
    }
    setConcerts(prev => [{ ...c, id: c.id || crypto.randomUUID() }, ...prev]);
  };

  const handleAddVinyl = async (v) => {
    if (supabase && user?.id) {
      const { data, error } = await supabase.from("vinyl").insert({
        user_id: user.id,
        artist_name: v.artist_name,
        album_name: v.album_name,
        is_limited_edition: v.is_limited_edition ?? false,
      }).select().single();
      if (!error && data) {
        setVinyl(prev => [{ id: data.id, artist_name: data.artist_name, album_name: data.album_name, is_limited_edition: data.is_limited_edition }, ...prev]);
        return;
      }
    }
    setVinyl(prev => [{ ...v, id: v.id || crypto.randomUUID() }, ...prev]);
  };

  const handleAddMerch = async (m) => {
    if (supabase && user?.id) {
      const { data, error } = await supabase.from("merch").insert({
        user_id: user.id,
        artist_name: m.artist_name,
        item_name: m.item_name,
        merch_type: m.merch_type,
        is_tour_merch: m.is_tour_merch ?? false,
        tour_name: m.tour_name || null,
        purchase_price: m.purchase_price ?? null,
        purchase_location: m.purchase_location || null,
      }).select().single();
      if (!error && data) {
        setMerch(prev => [{ id: data.id, artist_name: data.artist_name, item_name: data.item_name, merch_type: data.merch_type, is_tour_merch: data.is_tour_merch, tour_name: data.tour_name, purchase_price: data.purchase_price, purchase_location: data.purchase_location }, ...prev]);
        return;
      }
    }
    setMerch(prev => [{ ...m, id: m.id || crypto.randomUUID() }, ...prev]);
  };

  const handleStreamingComplete = async (d) => {
    if (supabase && user?.id) {
      await supabase.from("user_streaming_stats").upsert({
        user_id: user.id,
        total_hours: d.totalHours,
        total_records: d.totalRecords,
        unique_artists: d.uniqueArtists,
        unique_tracks: d.uniqueTracks,
        top_artists: d.topArtists,
        top_tracks: d.topTracks,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
    setStreamingData(d);
    setShowUpload(false);
  };

  if (authLoading) {
    return (<GradientBg><div style={{ padding: "80px 24px", textAlign: "center", fontFamily: F, fontSize: 15, color: "#4f46e5" }}>Loading…</div></GradientBg>);
  }
  if (!user) return <AuthScreen onAuth={u => setUser(u)} />;
  return (<GradientBg>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 0" }}><span style={{ fontSize: 22, color: "#6366f1", fontWeight: 700 }}>‹</span><span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{activeTab}</span><button onClick={handleLogout} style={{ background: "none", border: "none", fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.4)", cursor: "pointer" }}>Log out</button></div>
    <ProfileHeader user={user} />
    <div style={{ padding: "8px 20px 0" }}><TabBar active={activeTab} onSelect={setActiveTab} /></div>
    <div style={{ paddingBottom: 40 }}>
      {activeTab==="Live" && <LiveTab concerts={concerts} onAdd={()=>setShowConcert(true)} />}
      {activeTab==="Digital" && <DigitalTab data={streamingData} onUpload={()=>setShowUpload(true)} />}
      {activeTab==="Physical" && <PhysicalTab vinyl={vinyl} merch={merch} onAddVinyl={()=>setShowVinyl(true)} onAddMerch={()=>setShowMerch(true)} />}
      {activeTab==="Curate" && <CurateTab concerts={concerts} merch={merch} vinyl={vinyl} data={streamingData} />}
    </div>
    {showUpload && <SpotifyUploadModal onClose={()=>setShowUpload(false)} onComplete={handleStreamingComplete} />}
    {showConcert && <AddConcertModal onClose={()=>setShowConcert(false)} onAdd={handleAddConcert} />}
    {showVinyl && <AddItemModal type="vinyl" onClose={()=>setShowVinyl(false)} onAdd={handleAddVinyl} />}
    {showMerch && <AddItemModal type="merch" onClose={()=>setShowMerch(false)} onAdd={handleAddMerch} />}
  </GradientBg>);
}
