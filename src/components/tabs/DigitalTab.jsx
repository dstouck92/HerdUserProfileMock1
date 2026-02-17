import { useState } from "react";
import { Card, Stats, Sec, Empty } from "../ui";

const F = "'DM Sans', sans-serif";

export default function DigitalTab({ data, onUpload }) {
  if (!data) return <Empty icon="🎵" title="No Streaming Data Yet" desc="Upload your Spotify Extended Streaming History to see top artists, songs, and stats." btn="Upload Spotify History" onAction={onUpload} />;

  const [showAllArtists, setShowAllArtists] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);

  const artistsToShow = showAllArtists ? data.topArtists : data.topArtists.slice(0, 10);
  const tracksToShow = showAllTracks ? data.topTracks : data.topTracks.slice(0, 10);

  const hasMoreArtists = data.topArtists.length > 10;
  const hasMoreTracks = data.topTracks.length > 10;

  return (
    <div>
      <Stats stats={[{ value: data.totalHours.toLocaleString(), label: "Total Hours" }, { value: data.uniqueArtists.toLocaleString(), label: "Artists" }, { value: data.uniqueTracks.toLocaleString(), label: "Tracks" }]} />
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
        right={hasMoreArtists ? (showAllArtists ? "Show Top 10" : "View All ›") : undefined}
        onRightClick={hasMoreArtists ? () => setShowAllArtists((v) => !v) : undefined}
      >
        Top Artists
      </Sec>
      <Card>{artistsToShow.map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}>
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${240 + i * 10},70%,${55 + i * 4}%), hsl(${250 + i * 12},60%,${65 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "rgba(255,255,255,0.8)" }}>♫</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{a.plays.toLocaleString()} plays</div>
          </div>
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{a.hours} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Hrs</span></span>
        </div>
      ))}</Card>
      <Sec
        icon="🎶"
        right={hasMoreTracks ? (showAllTracks ? "Show Top 10" : "View All ›") : undefined}
        onRightClick={hasMoreTracks ? () => setShowAllTracks((v) => !v) : undefined}
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
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{t.plays} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Plays</span></span>
        </div>
      ))}</Card>
      <Sec icon="📊">Platform Usage</Sec>
      <Card>
        <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>♫</div>
          <span style={{ flex: 1, fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>Spotify</span>
          <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{data.totalHours.toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Hours</span></span>
        </div>
      </Card>
    </div>
  );
}
