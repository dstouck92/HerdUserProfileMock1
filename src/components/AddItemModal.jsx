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
        <Inp label="Artist *" value={artist} onChange={setArtist} placeholder="Fred Again" />
        {type === "vinyl" ? (
          <>
            <Inp label="Album Name *" value={albumName} onChange={setAlbumName} placeholder="Actual Life 3" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <input type="checkbox" checked={isLimited} onChange={() => setIsLimited(!isLimited)} style={{ accentColor: "#6366f1" }} />
              <span style={{ fontFamily: F, fontSize: 14, color: "#1e1b4b" }}>Limited Edition</span>
            </div>
          </>
        ) : (
          <>
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
        <Btn onClick={add} disabled={!artist || (type === "vinyl" ? !albumName : !itemName)}>Add {type === "vinyl" ? "Record" : "Item"}</Btn>
      </div>
    </div>
  );
}
