import { useState } from "react";
import { Inp, Btn } from "./ui";

const F = "'DM Sans', sans-serif";

export default function AddItemModal({ type, onClose, onAdd }) {
  const [artist, setArtist] = useState("");
  const [itemName, setItemName] = useState("");
  const [merchType, setMerchType] = useState("T-Shirt");
  const [albumName, setAlbumName] = useState("");
  const [isLimited, setIsLimited] = useState(false);
  const [isTour, setIsTour] = useState(false);
  const [tourName, setTourName] = useState("");
  const [price, setPrice] = useState("");
  const [loc, setLoc] = useState("");
  const types = ["T-Shirt", "Hoodie", "Hat", "Poster", "Tote Bag", "Sweatpants", "Jacket", "Other"];

  const [vinylMode, setVinylMode] = useState("search");
  const [vinylQuery, setVinylQuery] = useState("");
  const [vinylSearching, setVinylSearching] = useState(false);
  const [vinylResults, setVinylResults] = useState([]);
  const [vinylSearchError, setVinylSearchError] = useState("");

  const searchVinyl = async () => {
    if (!vinylQuery.trim()) return;
    setVinylSearching(true);
    setVinylSearchError("");
    setVinylResults([]);
    try {
      const res = await fetch(`/api/vinyl/search?q=${encodeURIComponent(vinylQuery.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setVinylResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setVinylSearchError(err?.message || "Could not search. Try manual entry.");
    } finally {
      setVinylSearching(false);
    }
  };

  const addFromVinylSearch = (v) => {
    onAdd({ id: crypto.randomUUID?.() || Date.now().toString(), artist_name: v.artist_name, album_name: v.album_name, is_limited_edition: isLimited });
    onClose();
  };

  const add = () => {
    if (!artist || (type === "vinyl" ? !albumName : !itemName)) return;
    if (type === "vinyl") onAdd({ id: Date.now().toString(), artist_name: artist, album_name: albumName, is_limited_edition: isLimited });
    else onAdd({ id: Date.now().toString(), artist_name: artist, item_name: itemName, merch_type: merchType, is_tour_merch: isTour, tour_name: tourName || null, purchase_price: price ? parseFloat(price) : null, purchase_location: loc || null });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: 20, padding: "24px 20px 36px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Add {type === "vinyl" ? "Vinyl Record" : "Merch"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        {type === "vinyl" ? (
          <>
            <div style={{ display: "flex", marginBottom: 20, background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: 3 }}>
              {[["search", "Search Discogs"], ["manual", "Manual Entry"]].map(([m, l]) => (
                <button key={m} onClick={() => { setVinylMode(m); setVinylSearchError(""); setVinylResults([]); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: vinylMode === m ? "#fff" : "transparent", boxShadow: vinylMode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: F, fontSize: 13, fontWeight: 600, color: vinylMode === m ? "#4f46e5" : "rgba(55,48,107,0.4)", cursor: "pointer" }}>{l}</button>
              ))}
            </div>
            {vinylMode === "search" ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input value={vinylQuery} onChange={(e) => setVinylQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchVinyl()} placeholder="Artist or album name..." style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(255,255,255,0.7)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none" }} />
                  <button onClick={searchVinyl} disabled={vinylSearching} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: vinylSearching ? "wait" : "pointer" }}>🔍</button>
                </div>
                {vinylSearchError && <div style={{ fontFamily: F, fontSize: 13, color: "#dc2626", marginBottom: 12 }}>{vinylSearchError}</div>}
                {vinylSearching && <div style={{ textAlign: "center", padding: 24, fontFamily: F, fontSize: 13, color: "#4f46e5" }}>Searching Discogs…</div>}
                {!vinylSearching && vinylResults.length > 0 && (
                  <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 16, border: "1px solid rgba(99,102,241,0.12)", borderRadius: 12 }}>
                    {vinylResults.map((v, i) => (
                      <button type="button" key={v.id ?? i} onClick={() => addFromVinylSearch(v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "none", borderBottom: i < vinylResults.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none", background: "none", cursor: "pointer", textAlign: "left", fontFamily: F }}>
                        {v.thumb && <img src={v.thumb} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.album_name}</div>
                          <div style={{ fontSize: 12, color: "rgba(55,48,107,0.6)" }}>{v.artist_name}{v.year ? ` · ${v.year}` : ""}</div>
                        </div>
                        <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600 }}>Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <Inp label="Artist *" value={artist} onChange={setArtist} placeholder="Fred Again" />
                <Inp label="Album Name *" value={albumName} onChange={setAlbumName} placeholder="Actual Life 3" />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <input type="checkbox" checked={isLimited} onChange={() => setIsLimited(!isLimited)} style={{ accentColor: "#6366f1" }} />
                  <span style={{ fontFamily: F, fontSize: 14, color: "#1e1b4b" }}>Limited Edition</span>
                </div>
                <Btn onClick={add} disabled={!artist || !albumName}>Add Record</Btn>
              </>
            )}
          </>
        ) : (
          <>
            <Inp label="Artist *" value={artist} onChange={setArtist} placeholder="Fred Again" />
            <Inp label="Item Name *" value={itemName} onChange={setItemName} placeholder="Actual Life Tour Tee" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#4f46e5", display: "block", marginBottom: 6 }}>Type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{types.map((t) => (<button key={t} onClick={() => setMerchType(t)} style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${merchType === t ? "#6366f1" : "rgba(99,102,241,0.15)"}`, background: merchType === t ? "rgba(99,102,241,0.1)" : "transparent", fontFamily: F, fontSize: 12, fontWeight: merchType === t ? 700 : 500, color: merchType === t ? "#4f46e5" : "rgba(55,48,107,0.5)", cursor: "pointer" }}>{t}</button>))}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <input type="checkbox" checked={isTour} onChange={() => setIsTour(!isTour)} style={{ accentColor: "#6366f1" }} />
              <span style={{ fontFamily: F, fontSize: 14, color: "#1e1b4b" }}>Tour Merch</span>
            </div>
            {isTour && <Inp label="Tour Name" value={tourName} onChange={setTourName} placeholder="Actual Life Tour" />}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><Inp label="Price ($)" type="number" value={price} onChange={setPrice} placeholder="45" /></div>
              <div style={{ flex: 1 }}><Inp label="Where Purchased" value={loc} onChange={setLoc} placeholder="MSG, Online..." /></div>
            </div>
          </>
        )}
        {type !== "vinyl" && <Btn onClick={add} disabled={!artist || !itemName}>Add Item</Btn>}
      </div>
    </div>
  );
}
