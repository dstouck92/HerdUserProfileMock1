import { useState } from "react";
import { Card, Stats, Sec, Empty } from "../ui";

const F = "'DM Sans', sans-serif";

export default function DigitalTab({ data, onUpload }) {
  if (!data) return <Empty icon="🎵" title="No Streaming Data Yet" desc="Upload your Spotify Extended Streaming History to see top artists, songs, and stats." btn="Upload Spotify History" onAction={onUpload} />;

  const [insightsModal, setInsightsModal] = useState(null); // 'artists' | 'tracks' | null

  const artistsToShow = data.topArtists.slice(0, 10);
  const tracksToShow = data.topTracks.slice(0, 10);

  const hasMoreArtists = data.topArtists.length > 10;
  const hasMoreTracks = data.topTracks.length > 10;

  // For each artist, find their most-played track from topTracks
  const getTopTrackForArtist = (artistName) => {
    const byArtist = data.topTracks.filter((t) => t.artist === artistName);
    if (!byArtist.length) return null;
    return byArtist.reduce((best, t) => (t.plays > best.plays ? t : best), byArtist[0]);
  };

  return (
    <div>
      <Stats stats={[{ value: Math.round(data.totalHours * 60).toLocaleString(), label: "Total Minutes" }, { value: data.uniqueArtists.toLocaleString(), label: "Artists" }, { value: data.uniqueTracks.toLocaleString(), label: "Tracks" }]} />
      <div style={{ margin: "0 20px 12px", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onUpload}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            fontFamily: F,
            fontSize: 12,
            fontWeight: 600,
            color: "#6366f1",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Re-upload Spotify history
        </button>
      </div>
      <Sec
        icon="🎵"
        right={hasMoreArtists ? "View All ›" : undefined}
        onRightClick={hasMoreArtists ? () => setInsightsModal("artists") : undefined}
      >
        Top Artists
      </Sec>
      <Card>{artistsToShow.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}>
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${240 + i * 10},70%,${55 + i * 4}%), hsl(${250 + i * 12},60%,${65 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "rgba(255,255,255,0.8)" }}>♫</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{getTopTrackForArtist(a.name) ? `Top Track: ${getTopTrackForArtist(a.name).name}` : `${a.plays.toLocaleString()} plays`}</div>
          </div>
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{Math.round(a.hours * 60)} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
        </div>
      ))}</Card>
      <Sec
        icon="🎶"
        right={hasMoreTracks ? "View All ›" : undefined}
        onRightClick={hasMoreTracks ? () => setInsightsModal("tracks") : undefined}
      >
        Top Songs
      </Sec>
      <Card>{tracksToShow.map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}>
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${260 + i * 8},65%,${50 + i * 4}%), hsl(${270 + i * 10},55%,${60 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>♪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{t.artist}</div>
          </div>
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{Math.round(t.hours * 60)} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
        </div>
      ))}</Card>
      <Sec icon="📊">Platform Usage</Sec>
      <Card>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14, gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>♫</div>
            <span style={{ flex: 1, fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>Spotify</span>
          </div>
          <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginBottom: 12 }}>Retroactive only (from your export). No live tracking.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontFamily: F, fontSize: 13, color: "#1e1b4b" }}>
            <span style={{ color: "rgba(55,48,107,0.55)" }}>Total hours</span><span style={{ fontWeight: 600, textAlign: "right" }}>{data.totalHours.toLocaleString()}</span>
            <span style={{ color: "rgba(55,48,107,0.55)" }}>Total minutes</span><span style={{ fontWeight: 600, textAlign: "right" }}>{Math.round(data.totalHours * 60).toLocaleString()}</span>
            <span style={{ color: "rgba(55,48,107,0.55)" }}>Top artist</span><span style={{ fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.topArtists[0]?.name ?? "—"}</span>
            <span style={{ color: "rgba(55,48,107,0.55)" }}>Top track</span><span style={{ fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.topTracks[0]?.name ?? "—"}</span>
            <span style={{ color: "rgba(55,48,107,0.55)" }}>Years in data</span><span style={{ fontWeight: 600, textAlign: "right" }}>{data.startDate && data.endDate ? (Math.round((new Date(data.endDate) - new Date(data.startDate)) / (365.25 * 24 * 3600 * 1000) * 10) / 10) : "—"}</span>
          </div>
          {data.startDate && data.endDate && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(99,102,241,0.1)", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.55)" }}>
              <span>Average minutes per day </span>
              <strong style={{ color: "#1e1b4b", fontSize: 15 }}>{Math.round((data.totalHours * 60) / Math.max(1, (new Date(data.endDate) - new Date(data.startDate)) / (24 * 3600 * 1000)))}</strong>
            </div>
          )}
        </div>
      </Card>

      {insightsModal && (
        <InsightsModal
          mode={insightsModal}
          data={data}
          onClose={() => setInsightsModal(null)}
        />
      )}
    </div>
  );
}

// --- Insights modal (View All): pie chart, averages, vibe, top 50 list ---
const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6366f1", "#94a3b8"];
function InsightsModal({ mode, data, onClose }) {
  const totalMinutes = data.totalHours * 60;
  const musicMinutes = data.topArtists.reduce((s, a) => s + a.hours * 60, 0);
  const top50Artists = data.topArtists.slice(0, 50);
  const top50Tracks = data.topTracks.slice(0, 50);

  // Pie: top 6 artists or top 6 tracks by listen time (music only so % add up)
  const pieSlices = mode === "artists"
    ? top50Artists.slice(0, 6).map((a) => ({ label: a.name, value: a.hours * 60 }))
    : top50Tracks.slice(0, 6).map((t) => ({ label: t.name, value: t.hours * 60 }));
  const sliceSum = pieSlices.reduce((s, x) => s + x.value, 0);
  const otherMinutes = Math.max(0, musicMinutes - sliceSum);
  if (otherMinutes > 0) pieSlices.push({ label: "Other", value: otherMinutes });
  const totalPie = pieSlices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const conicParts = pieSlices.map((s, i) => {
    const pct = (s.value / totalPie) * 100;
    const start = acc;
    acc += pct;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${acc}%`;
  });
  const conicGradient = `conic-gradient(${conicParts.join(", ")})`;

  const avgMinPerArtist = data.topArtists.length ? totalMinutes / data.uniqueArtists : 0;
  const avgPlaysPerTrack = data.topTracks.length ? data.topTracks.reduce((s, t) => s + t.plays, 0) / data.uniqueTracks : 0;
  const topShare = data.topArtists[0] && musicMinutes > 0 ? (data.topArtists[0].hours * 60 / musicMinutes) * 100 : 0;
  const vibeText = topShare > 15 ? "You're loyal to a few favorites — when you love an artist, you really go deep." : data.uniqueArtists > 500 ? "Eclectic listener — you explore widely across many artists and sounds." : "Your taste spans a solid mix of go-tos and discovery.";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "90vh", background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
          <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{mode === "artists" ? "Artist Insights" : "Song Insights"}</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflow: "auto", padding: "16px 20px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
            <div style={{ width: 140, height: 140, borderRadius: "50%", background: conicGradient, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {pieSlices.slice(0, 7).map((s, i) => (
                <div key={i} style={{ fontFamily: F, fontSize: 12, color: "#1e1b4b", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                  <span style={{ color: "rgba(55,48,107,0.5)", marginLeft: "auto" }}>{((s.value / totalPie) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(99,102,241,0.06)", borderRadius: 12, fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.8)" }}>
            <strong style={{ color: "#4f46e5" }}>Averages:</strong> {Math.round(avgMinPerArtist)} min per artist · {avgPlaysPerTrack.toFixed(0)} plays per track (music). Based on your exported history (retroactive only).
          </div>
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(236,72,153,0.06)", borderRadius: 12, fontFamily: F, fontSize: 13, color: "#1e1b4b", fontStyle: "italic" }}>
            {vibeText}
          </div>
          <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>Top 50 {mode === "artists" ? "Artists" : "Songs"}</div>
          <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12 }}>
            {mode === "artists"
              ? top50Artists.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < top50Artists.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "rgba(55,48,107,0.4)", width: 24, textAlign: "right" }}>{i + 1}</span>
                    <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>{Math.round(a.hours * 60)} min</span>
                  </div>
                ))
              : top50Tracks.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < top50Tracks.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "rgba(55,48,107,0.4)", width: 24, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                      <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{t.artist}</div>
                    </div>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "#4f46e5" }}>{Math.round(t.hours * 60)} min</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
