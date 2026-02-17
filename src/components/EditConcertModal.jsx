import { useState, useEffect } from "react";
import { Inp, Btn } from "./ui";

const F = "'DM Sans', sans-serif";

export default function EditConcertModal({ concert, onClose, onSave }) {
  const [artist, setArtist] = useState("");
  const [tour, setTour] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!concert) return;
    setArtist(concert.artist ?? "");
    setTour(concert.tour ?? "");
    setDate(concert.date ?? "");
    setVenue(concert.venue ?? "");
    setCity(concert.city ?? "");
    setTicketType(concert.ticket_type ?? "");
    setTicketPrice(concert.ticket_price != null ? String(concert.ticket_price) : "");
  }, [concert]);

  const save = async () => {
    if (!artist || !date || !venue) return;
    setSaving(true);
    await onSave({
      id: concert.id,
      artist,
      tour: tour || null,
      date,
      venue,
      city: city || null,
      ticket_type: ticketType || null,
      ticket_price: ticketPrice ? parseFloat(ticketPrice) : null,
      source: concert.source ?? "manual",
    });
    setSaving(false);
    onClose();
  };

  if (!concert) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: 20, padding: "24px 20px 36px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Edit Concert</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        <Inp label="Artist *" value={artist} onChange={setArtist} placeholder="Fred Again" />
        <Inp label="Tour Name" value={tour} onChange={setTour} placeholder="Actual Life Tour" />
        <Inp label="Date *" type="date" value={date} onChange={setDate} />
        <Inp label="Venue *" value={venue} onChange={setVenue} placeholder="Hollywood Palladium" />
        <Inp label="City" value={city} onChange={setCity} placeholder="Los Angeles, CA" />
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}><Inp label="Ticket Type" value={ticketType} onChange={setTicketType} placeholder="GA, VIP..." /></div>
          <div style={{ flex: 1 }}><Inp label="Price ($)" type="number" value={ticketPrice} onChange={setTicketPrice} placeholder="150" /></div>
        </div>
        <Btn onClick={save} disabled={!artist || !date || !venue || saving}>{saving ? "Saving…" : "Save changes"}</Btn>
      </div>
    </div>
  );
}
