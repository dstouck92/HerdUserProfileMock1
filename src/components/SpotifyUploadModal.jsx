import { useState, useCallback } from "react";
import { parseSpotifyFiles } from "../lib/spotify-json-parser";
import { Btn } from "./ui";

const F = "'DM Sans', sans-serif";

export default function SpotifyUploadModal({ onClose, onComplete }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  const handle = useCallback(
    async (files) => {
      setProcessing(true);
      const audio = [];
      for (const f of files) {
        if (f.name.endsWith(".json")) {
          setProgress(`Reading ${f.name}...`);
          try {
            audio.push(JSON.parse(await f.text()));
          } catch (e) {}
        }
      }
      if (!audio.length) {
        setProgress("No JSON files found. Use Streaming_History_Audio_*.json from your export.");
        setProcessing(false);
        return;
      }
      setProgress(`Analyzing ${audio.length} files...`);
      await new Promise((r) => setTimeout(r, 500));
      const stats = parseSpotifyFiles(audio);
      setProgress(`Done! ${stats.totalHours.toLocaleString()} hours, ${stats.uniqueArtists.toLocaleString()} artists.`);
      await new Promise((r) => setTimeout(r, 800));
      onComplete(stats);
    },
    [onComplete]
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Upload Spotify History</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", marginBottom: 20, lineHeight: 1.6 }}>
          Upload your Spotify Extended Streaming History JSON files or ZIP.<br /><br />
          <strong style={{ color: "#4f46e5" }}>How:</strong> Spotify → Settings → Privacy → Request data → "Extended streaming history"
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handle(Array.from(e.dataTransfer.files)); }}
          style={{ border: `2px dashed ${dragging ? "#6366f1" : "rgba(99,102,241,0.25)"}`, borderRadius: 16, padding: "36px 20px", textAlign: "center", background: dragging ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.02)", marginBottom: 16 }}
        >
          {processing ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <div style={{ fontFamily: F, fontSize: 14, color: "#4f46e5", fontWeight: 600 }}>{progress}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b", marginBottom: 4 }}>Drag & drop files here</div>
              <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>Streaming_History_Audio_*.json (or any .json from the export)</div>
            </>
          )}
        </div>
        {!processing && (
          <label style={{ display: "block" }}>
            <input type="file" multiple accept=".json,.zip" onChange={(e) => handle(Array.from(e.target.files))} style={{ display: "none" }} />
            <Btn>Browse Files</Btn>
          </label>
        )}
      </div>
    </div>
  );
}
