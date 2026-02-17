import { Card, Sec, Btn, Btn2, Empty } from "../ui";

const F = "'DM Sans', sans-serif";

export default function CurateTab({ concerts, merch, vinyl, data }) {
  const hasData = concerts.length > 0 || merch.length > 0 || vinyl.length > 0 || data;
  if (!hasData) return <Empty icon="✨" title="Nothing to Curate Yet" desc="Add concerts, merch, vinyl, or upload Spotify history first." />;
  return (
    <div>
      <div style={{ margin: "0 20px 16px", padding: "14px 16px", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))", borderRadius: 14, border: "1px solid rgba(99,102,241,0.15)" }}>
        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#4f46e5", marginBottom: 4 }}>✨ Curate Your Public Profile</div>
        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", lineHeight: 1.5 }}>Select items from Digital, Physical, and Live tabs to feature publicly.</div>
      </div>
      {data && data.topArtists.length > 0 && (
        <>
          <Sec icon="🎵">From Your Streaming</Sec>
          <Card>{data.topArtists.slice(0, 3).map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i < 2 ? "1px solid rgba(99,102,241,0.06)" : "none" }}>
              <input type="checkbox" style={{ accentColor: "#6366f1" }} />
              <div style={{ flex: 1 }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{a.name}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{a.hours} hours</div></div>
              <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#059669", background: "rgba(16,185,129,0.08)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>streaming</span>
            </div>
          ))}</Card>
        </>
      )}
      {concerts.length > 0 && (
        <>
          <Sec icon="🎫">From Your Concerts</Sec>
          <Card>{concerts.slice(0, 3).map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i < Math.min(concerts.length, 3) - 1 ? "1px solid rgba(99,102,241,0.06)" : "none" }}>
              <input type="checkbox" style={{ accentColor: "#6366f1" }} />
              <div style={{ flex: 1 }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{c.artist}{c.tour ? ` - ${c.tour}` : ""}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{c.date} · {c.venue}</div></div>
              <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#4f46e5", background: "rgba(99,102,241,0.08)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>concert</span>
            </div>
          ))}</Card>
        </>
      )}
      <div style={{ margin: "8px 20px 20px", display: "flex", gap: 10 }}>
        <Btn2 style={{ flex: 1 }}>+ Add Item</Btn2>
        <Btn style={{ flex: 1 }}>Preview Profile</Btn>
      </div>
    </div>
  );
}
