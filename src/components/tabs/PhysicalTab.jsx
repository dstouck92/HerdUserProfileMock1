import { Card, Btn, Btn2, Empty } from "../ui";

const F = "'DM Sans', sans-serif";

export default function PhysicalTab({ vinyl, merch, onAddVinyl, onAddMerch }) {
  const merchByArtist = {};
  for (const m of merch) {
    if (!merchByArtist[m.artist_name]) merchByArtist[m.artist_name] = [];
    merchByArtist[m.artist_name].push(m);
  }
  if (!vinyl.length && !merch.length) return (
    <div>
      <Empty icon="💿" title="No Physical Collection Yet" desc="Track your vinyl records and merch." />
      <div style={{ display: "flex", gap: 10, padding: "0 16px" }}>
        <Btn2 onClick={onAddVinyl} style={{ flex: 1 }}>+ Vinyl</Btn2>
        <Btn onClick={onAddMerch} style={{ flex: 1 }}>+ Merch</Btn>
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>💿</span><span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>Vinyl Collection</span></div>
        <button onClick={onAddVinyl} style={{ padding: "5px 12px", borderRadius: 16, border: "1px solid rgba(13,148,136,0.25)", background: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 11, fontWeight: 600, color: "#0d9488", cursor: "pointer" }}>+ Add</button>
      </div>
      {vinyl.length ? (
        <>
          <div style={{ padding: "0 20px", marginBottom: 10, fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.5)" }}><strong style={{ color: "#0f766e" }}>{vinyl.length}</strong> Records | <strong style={{ color: "#0f766e" }}>{vinyl.filter((v) => v.is_limited_edition).length}</strong> Limited</div>
          <Card>{vinyl.map((v, i) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 14, borderBottom: i < vinyl.length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
              <div style={{ width: 48, height: 48, borderRadius: 6, background: "linear-gradient(135deg, #312e81, #4338ca)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💿</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{v.artist_name}</div>
                <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginTop: 2 }}>{v.album_name}{v.is_limited_edition && <span style={{ color: "#0d9488", fontWeight: 600 }}> · Limited</span>}</div>
              </div>
            </div>
          ))}</Card>
        </>
      ) : <Card style={{ padding: 20, textAlign: "center" }}><div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.4)" }}>No vinyl yet</div></Card>}
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>👕</span><span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>Merch Collection</span></div>
        <button onClick={onAddMerch} style={{ padding: "5px 12px", borderRadius: 16, border: "1px solid rgba(13,148,136,0.25)", background: "rgba(255,255,255,0.6)", fontFamily: F, fontSize: 11, fontWeight: 600, color: "#0d9488", cursor: "pointer" }}>+ Add</button>
      </div>
      {merch.length ? (
        <Card>{Object.entries(merchByArtist).map(([a, items], ai) => (
          <div key={a} style={{ padding: "12px 20px", borderBottom: ai < Object.keys(merchByArtist).length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
            <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>{a}</div>
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", padding: "3px 0 3px 12px" }}>
                <span>{item.item_name} <span style={{ color: "rgba(55,48,107,0.35)" }}>· {item.merch_type}</span></span>
                {item.purchase_price && <span style={{ color: "#0f766e", fontWeight: 600 }}>${item.purchase_price}</span>}
              </div>
            ))}
          </div>
        ))}</Card>
      ) : <Card style={{ padding: 20, textAlign: "center" }}><div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.4)" }}>No merch yet</div></Card>}
    </div>
  );
}
