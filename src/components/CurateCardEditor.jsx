import { useState, useCallback, useEffect, useRef } from "react";
import { Card, F } from "./ui";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(13,148,136,0.25)",
  background: "rgba(255,255,255,0.9)",
  fontFamily: F,
  fontSize: 14,
  color: "#1e1b4b",
  outline: "none",
  boxSizing: "border-box",
};

export default function CurateCardEditor({
  cardIndex,
  categories,
  prompts,
  selectedPrompt,
  answer,
  concerts,
  vinyl,
  merch,
  streamingData,
  youtubeData,
  userBadges,
  badgeDefinitions,
  onSelectPrompt,
  onChangeAnswer,
  userId,
  supabase,
}) {
  const [localTexts, setLocalTexts] = useState(() => answer?.texts ?? []);
  const config = selectedPrompt?.answer_config ?? {};
  const allowed = config.allowed_answer_types ?? [];
  const dataSources = config.data_sources ?? [];
  const textCount = config.text_input_count ?? 1;
  const labels = config.text_input_labels ?? [];
  const maxChars = selectedPrompt?.max_characters ?? 200;

  const texts = answer?.texts ?? [];
  const dataRefs = answer?.data_refs ?? [];
  const badges = answer?.badges ?? [];
  const artists = answer?.artists ?? [];
  const images = answer?.images ?? [];
  const [badgePopupOpen, setBadgePopupOpen] = useState(false);
  const [artistPopupOpen, setArtistPopupOpen] = useState(false);
  const [dataRefPopupOpen, setDataRefPopupOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef(null);
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    if (selectedPrompt?.category_id) return selectedPrompt.category_id;
    if (categories?.length) return categories[0].id;
    return null;
  });

  const emitAnswer = useCallback(
    (update) => {
      onChangeAnswer({ ...(answer ?? {}), ...update });
    },
    [answer, onChangeAnswer],
  );

  const handleTextChange = (index, value) => {
    const next = [...(texts.length ? texts : Array(textCount).fill(""))];
    next[index] = value.slice(0, maxChars);
    setLocalTexts(next);
    emitAnswer({ texts: next });
  };

  const ensureTexts = () => {
    const base = texts.length >= textCount ? texts : [...texts, ...Array(Math.max(0, textCount - texts.length)).fill("")];
    return base.slice(0, textCount);
  };
  const currentTexts = ensureTexts();

  const promptsInCategory = (categoryId) => prompts.filter((p) => p.category_id === categoryId);

  useEffect(() => {
    if (selectedPrompt?.category_id) {
      setActiveCategoryId(selectedPrompt.category_id);
    } else if (!activeCategoryId && categories?.length) {
      setActiveCategoryId(categories[0].id);
    }
  }, [selectedPrompt?.category_id, categories, activeCategoryId]);

  const handleAddDataRef = (type, id, metadata) => {
    const next = [...dataRefs, { type, id, metadata: metadata ?? null }];
    emitAnswer({ data_refs: next });
  };
  const handleRemoveDataRef = (index) => {
    const next = dataRefs.filter((_, i) => i !== index);
    emitAnswer({ data_refs: next });
  };

  const handleToggleBadge = (badgeKey) => {
    const next = badges.includes(badgeKey) ? badges.filter((b) => b !== badgeKey) : [...badges, badgeKey];
    emitAnswer({ badges: next });
  };

  const handleAddArtist = (nameOrObj) => {
    const entry = typeof nameOrObj === "object" && nameOrObj?.name
      ? { name: nameOrObj.name.trim(), spotify_id: nameOrObj.spotify_id ?? null }
      : { name: (nameOrObj || "").trim(), spotify_id: null };
    if (!entry.name) return;
    emitAnswer({ artists: [...artists, entry] });
  };
  const handleRemoveArtist = (index) => {
    emitAnswer({ artists: artists.filter((_, i) => i !== index) });
  };

  const handleAddImage = useCallback(
    async (file) => {
      if (!supabase || !userId || !file?.type?.startsWith("image/")) return;
      setImageUploading(true);
      try {
        const rawExt = (file.name.split(".").pop() || "").toLowerCase();
        const ext = ["jpg", "jpeg", "png", "gif", "webp"].includes(rawExt) ? rawExt : "jpg";
        const path = `${userId}/${cardIndex}_${Date.now()}.${ext}`;
        const bucket = supabase.storage.from("curate-card-media");
        const { error: uploadError } = await bucket.upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicData } = bucket.getPublicUrl(path);
        const url = publicData?.publicUrl || null;
        if (url) emitAnswer({ images: [...images, { storage_path: path, url }] });
      } catch (err) {
        if (import.meta.env?.DEV) console.error("Curate card image upload error:", err);
      } finally {
        setImageUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [supabase, userId, cardIndex, images, emitAnswer],
  );

  const handleRemoveImage = (index) => {
    emitAnswer({ images: images.filter((_, i) => i !== index) });
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "rgba(13,148,136,0.9)", marginBottom: 8, textTransform: "uppercase" }}>
          Card {cardIndex}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", marginBottom: 6 }}>
            Prompt
          </div>
          <div style={{ display: "flex", overflowX: "auto", paddingBottom: 6, marginBottom: 8, gap: 8 }}>
            {categories.map((c) => {
              const isActive = c.id === activeCategoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(c.id);
                    const inCat = promptsInCategory(c.id);
                    if (!selectedPrompt || !inCat.some((p) => p.id === selectedPrompt.id)) {
                      const first = inCat[0];
                      if (first) onSelectPrompt(first.id);
                    }
                  }}
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: isActive ? "1px solid rgba(13,148,136,0.9)" : "1px solid rgba(148,163,184,0.6)",
                    background: isActive ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.9)",
                    fontFamily: F,
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#0f766e" : "rgba(55,48,107,0.8)",
                    cursor: "pointer",
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <div style={{ maxHeight: 160, overflow: "auto", borderRadius: 12, border: "1px solid rgba(226,232,240,0.9)", background: "rgba(248,250,252,0.9)" }}>
            {(activeCategoryId ? promptsInCategory(activeCategoryId) : prompts).map((p) => {
              const isSelected = selectedPrompt && selectedPrompt.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPrompt(p.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    border: "none",
                    borderBottom: "1px solid rgba(226,232,240,0.9)",
                    background: isSelected ? "rgba(13,148,136,0.08)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span style={{ fontFamily: F, fontSize: 13, color: "#1e1b4b" }}>
                    {p.prompt_text}
                  </span>
                  {isSelected && <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "#0d9488" }}>✓</span>}
                </button>
              );
            })}
            {(activeCategoryId ? promptsInCategory(activeCategoryId) : prompts).length === 0 && (
              <div style={{ padding: "10px 12px", fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)" }}>
                No prompts in this category yet.
              </div>
            )}
          </div>
          {selectedPrompt && (
            <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginTop: 12, marginBottom: 8, lineHeight: 1.4 }}>
              {selectedPrompt.prompt_text}
            </div>
          )}
        </div>

        {selectedPrompt && (
          <>
            {allowed.includes("text") && (
              <div style={{ marginBottom: 12 }}>
                {textCount === 1 ? (
                  <textarea
                    value={currentTexts[0] ?? ""}
                    onChange={(e) => handleTextChange(0, e.target.value)}
                    placeholder="Your answer…"
                    maxLength={maxChars}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                  />
                ) : (
                  Array.from({ length: textCount }, (_, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>
                        {labels[i] ?? `Part ${i + 1}`}
                      </label>
                      <input
                        type="text"
                        value={currentTexts[i] ?? ""}
                        onChange={(e) => handleTextChange(i, e.target.value)}
                        placeholder=""
                        maxLength={maxChars}
                        style={inputStyle}
                      />
                    </div>
                  ))
                )}
                <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)", marginTop: 4 }}>
                  {currentTexts.join("").length} / {maxChars} characters
                </div>
              </div>
            )}

            {allowed.includes("data_ref") && dataSources.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", marginBottom: 6 }}>
                  Attach from your profile
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {dataSources.includes("streaming") && (streamingData?.topArtists?.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setArtistPopupOpen(true)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(13,148,136,0.35)",
                        background: "rgba(13,148,136,0.08)",
                        fontFamily: F,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0f766e",
                        cursor: "pointer",
                      }}
                    >
                      Attach an artist?
                      {dataRefs.some((r) => r.type === "streaming") && <span style={{ marginLeft: 6, background: "rgba(13,148,136,0.2)", padding: "2px 6px", borderRadius: 6, fontSize: 11 }}>{dataRefs.filter((r) => r.type === "streaming").length} selected</span>}
                    </button>
                  )}
                  {(dataSources.includes("concerts") && concerts?.length > 0) || (dataSources.includes("vinyl") && vinyl?.length > 0) || (dataSources.includes("merch") && merch?.length > 0) || (dataSources.includes("youtube") && youtubeData?.featured_youtube_channels?.length > 0) ? (
                    <button
                      type="button"
                      onClick={() => setDataRefPopupOpen(true)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(13,148,136,0.35)",
                        background: "rgba(13,148,136,0.08)",
                        fontFamily: F,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0f766e",
                        cursor: "pointer",
                      }}
                    >
                      Attach from collection?
                      {dataRefs.filter((r) => r.type !== "streaming").length > 0 && <span style={{ marginLeft: 6, background: "rgba(13,148,136,0.2)", padding: "2px 6px", borderRadius: 6, fontSize: 11 }}>{dataRefs.filter((r) => r.type !== "streaming").length} selected</span>}
                    </button>
                  ) : null}
                </div>
                {artistPopupOpen && dataSources.includes("streaming") && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
                    onClick={(e) => e.target === e.currentTarget && setArtistPopupOpen(false)}
                  >
                    <div style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 52 }}>
                        <button type="button" onClick={() => setArtistPopupOpen(false)} style={{ padding: "8px 4px", minWidth: 80, background: "none", border: "none", fontSize: 16, color: "#0d9488", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", fontFamily: F }} aria-label="Back">← Back</button>
                        <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#1e1b4b", flex: 1, textAlign: "center" }}>Attach an artist?</span>
                        <button type="button" onClick={() => setArtistPopupOpen(false)} style={{ width: 40, height: 40, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(100,116,139,0.15)", border: "none", borderRadius: "50%", fontSize: 22, color: "#475569", cursor: "pointer", fontFamily: F }} aria-label="Close">×</button>
                      </div>
                      <div style={{ overflow: "auto", padding: "12px 18px", flex: 1 }}>
                        {(streamingData?.topArtists ?? []).slice(0, 20).map((a) => {
                          const isSelected = dataRefs.some((r) => r.type === "streaming" && r.metadata?.name === a.name);
                          return (
                            <button
                              key={a.name}
                              type="button"
                              onClick={() => (isSelected ? handleRemoveDataRef(dataRefs.findIndex((r) => r.type === "streaming" && r.metadata?.name === a.name)) : handleAddDataRef("streaming", null, { name: a.name, hours: a.hours }))}
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px 0",
                                border: "none",
                                borderBottom: "1px solid #f1f5f9",
                                background: "none",
                                cursor: "pointer",
                                fontFamily: F,
                                fontSize: 14,
                                color: "#1e1b4b",
                                textAlign: "left",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{a.name}</span>
                              {isSelected ? <span style={{ color: "#0d9488", fontWeight: 600 }}>✓ Selected</span> : <span style={{ color: "#0d9488", fontWeight: 600 }}>+ Add</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ padding: "14px 18px", borderTop: "1px solid #e5e7eb", background: "#f8fafc", display: "flex", gap: 10, flexShrink: 0 }}>
                        <button type="button" onClick={() => setArtistPopupOpen(false)} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid #94a3b8", background: "#fff", color: "#64748b", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>← Back</button>
                        <button type="button" onClick={() => setArtistPopupOpen(false)} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Done</button>
                      </div>
                    </div>
                  </div>
                )}
                {dataRefPopupOpen && (
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
                    onClick={(e) => e.target === e.currentTarget && setDataRefPopupOpen(false)}
                  >
                    <div style={{ width: "100%", maxWidth: 380, maxHeight: "80vh", background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ padding: "12px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <button type="button" onClick={() => setDataRefPopupOpen(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#0d9488", fontWeight: 700, cursor: "pointer" }} aria-label="Back">← Back</button>
                        <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#1e1b4b", flex: 1, textAlign: "center" }}>Attach from collection</span>
                        <button type="button" onClick={() => setDataRefPopupOpen(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#64748b", cursor: "pointer", padding: 0, lineHeight: 1 }} aria-label="Close">×</button>
                      </div>
                      <div style={{ overflow: "auto", padding: "12px 18px" }}>
                        {dataSources.includes("concerts") && concerts?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "rgba(55,48,107,0.6)", marginBottom: 6, textTransform: "uppercase" }}>Concerts</div>
                            {concerts.slice(0, 15).map((c) => {
                              const isSelected = dataRefs.some((r) => r.type === "concert" && r.id === c.id);
                              return (
                                <button key={c.id} type="button" onClick={() => (isSelected ? handleRemoveDataRef(dataRefs.findIndex((r) => r.type === "concert" && r.id === c.id)) : handleAddDataRef("concert", c.id, { artist: c.artist, date: c.date }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", border: "none", borderBottom: "1px solid #f1f5f9", background: "none", cursor: "pointer", fontFamily: F, fontSize: 13, color: "#1e1b4b", textAlign: "left" }}>
                                  <span>{c.artist} {c.date}</span>
                                  {isSelected ? <span style={{ color: "#0d9488", fontWeight: 600 }}>✓</span> : <span style={{ color: "#0d9488" }}>+ Add</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {dataSources.includes("vinyl") && vinyl?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "rgba(55,48,107,0.6)", marginBottom: 6, textTransform: "uppercase" }}>Vinyl</div>
                            {vinyl.slice(0, 15).map((v) => {
                              const isSelected = dataRefs.some((r) => r.type === "vinyl" && r.id === v.id);
                              return (
                                <button key={v.id} type="button" onClick={() => (isSelected ? handleRemoveDataRef(dataRefs.findIndex((r) => r.type === "vinyl" && r.id === v.id)) : handleAddDataRef("vinyl", v.id, { artist_name: v.artist_name, album_name: v.album_name }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", border: "none", borderBottom: "1px solid #f1f5f9", background: "none", cursor: "pointer", fontFamily: F, fontSize: 13, color: "#1e1b4b", textAlign: "left" }}>
                                  <span>{v.artist_name} – {v.album_name}</span>
                                  {isSelected ? <span style={{ color: "#0d9488", fontWeight: 600 }}>✓</span> : <span style={{ color: "#0d9488" }}>+ Add</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {dataSources.includes("merch") && merch?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "rgba(55,48,107,0.6)", marginBottom: 6, textTransform: "uppercase" }}>Merch</div>
                            {merch.slice(0, 15).map((m) => {
                              const isSelected = dataRefs.some((r) => r.type === "merch" && r.id === m.id);
                              return (
                                <button key={m.id} type="button" onClick={() => (isSelected ? handleRemoveDataRef(dataRefs.findIndex((r) => r.type === "merch" && r.id === m.id)) : handleAddDataRef("merch", m.id, { artist_name: m.artist_name, item_name: m.item_name }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", border: "none", borderBottom: "1px solid #f1f5f9", background: "none", cursor: "pointer", fontFamily: F, fontSize: 13, color: "#1e1b4b", textAlign: "left" }}>
                                  <span>{m.artist_name} – {m.item_name}</span>
                                  {isSelected ? <span style={{ color: "#0d9488", fontWeight: 600 }}>✓</span> : <span style={{ color: "#0d9488" }}>+ Add</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {dataSources.includes("youtube") && youtubeData?.featured_youtube_channels?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: "rgba(55,48,107,0.6)", marginBottom: 6, textTransform: "uppercase" }}>YouTube</div>
                            {(youtubeData.featured_youtube_channels ?? []).slice(0, 10).map((ch) => {
                              const key = ch.channelId || ch.channelTitle;
                              const isSelected = dataRefs.some((r) => r.type === "youtube" && (r.metadata?.channelTitle === ch.channelTitle || r.metadata?.channelId === ch.channelId));
                              return (
                                <button key={key} type="button" onClick={() => (isSelected ? handleRemoveDataRef(dataRefs.findIndex((r) => r.type === "youtube" && (r.metadata?.channelTitle === ch.channelTitle || r.metadata?.channelId === ch.channelId))) : handleAddDataRef("youtube", ch.channelId, { channelTitle: ch.channelTitle, channelId: ch.channelId }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", border: "none", borderBottom: "1px solid #f1f5f9", background: "none", cursor: "pointer", fontFamily: F, fontSize: 13, color: "#1e1b4b", textAlign: "left" }}>
                                  <span>{ch.channelTitle || ch.channelId}</span>
                                  {isSelected ? <span style={{ color: "#0d9488", fontWeight: 600 }}>✓</span> : <span style={{ color: "#0d9488" }}>+ Add</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => setDataRefPopupOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #94a3b8", background: "#fff", color: "#64748b", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back</button>
                        <button type="button" onClick={() => setDataRefPopupOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {allowed.includes("badges") && userBadges?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setBadgePopupOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(13,148,136,0.35)",
                    background: "rgba(13,148,136,0.08)",
                    fontFamily: F,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0f766e",
                    cursor: "pointer",
                  }}
                >
                  Attach badges
                  {badges.length > 0 && <span style={{ background: "rgba(13,148,136,0.2)", padding: "2px 6px", borderRadius: 6, fontSize: 11 }}>{badges.length} selected</span>}
                </button>
                {badgePopupOpen && (
                  <div
                    style={{
                      position: "fixed",
                      inset: 0,
                      zIndex: 120,
                      background: "rgba(15,23,42,0.6)",
                      backdropFilter: "blur(8px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 16,
                    }}
                    onClick={(e) => e.target === e.currentTarget && setBadgePopupOpen(false)}
                  >
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 380,
                        maxHeight: "80vh",
                        background: "#fff",
                        borderRadius: 16,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ padding: "12px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <button type="button" onClick={() => setBadgePopupOpen(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#0d9488", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center" }} aria-label="Back">← Back</button>
                        <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#1e1b4b", flex: 1, textAlign: "center" }}>Attach badges</span>
                        <button type="button" onClick={() => setBadgePopupOpen(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#64748b", cursor: "pointer", padding: 0, lineHeight: 1 }} aria-label="Close">×</button>
                      </div>
                      <div style={{ overflow: "auto", padding: "12px 18px 20px" }}>
                        {(() => {
                          const seen = new Set();
                          return (userBadges || []).filter((ub) => {
                            if (seen.has(ub.badge_key)) return false;
                            seen.add(ub.badge_key);
                            return true;
                          }).map((ub) => {
                          const def = badgeDefinitions.find((d) => d.key === ub.badge_key);
                          const isSelected = badges.includes(ub.badge_key) || badges.includes(ub.id);
                          return (
                            <label
                              key={ub.badge_key}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 0",
                                borderBottom: "1px solid #f1f5f9",
                                cursor: "pointer",
                                fontFamily: F,
                                fontSize: 14,
                              }}
                            >
                              <input type="checkbox" checked={!!isSelected} onChange={() => handleToggleBadge(ub.badge_key)} style={{ accentColor: "#0d9488" }} />
                              <span style={{ fontSize: 18 }}>{def?.icon ?? "🏅"}</span>
                              <span style={{ fontWeight: 600, color: "#1e1b4b" }}>{def?.name ?? ub.badge_key}</span>
                            </label>
                          );
                        });
                        })()}
                      </div>
                      <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => setBadgePopupOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #94a3b8", background: "#fff", color: "#64748b", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back</button>
                        <button type="button" onClick={() => setBadgePopupOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {allowed.includes("artist") && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", marginBottom: 6 }}>
                  Artist(s)
                </div>
                <ArtistInput
                  onAdd={handleAddArtist}
                  artists={artists}
                  onRemove={handleRemoveArtist}
                  supportsSpotifySearch={!!config.supports_spotify_search}
                  supportsManualEntry={config.supports_manual_artist_entry !== false}
                />
              </div>
            )}

            {allowed.includes("images") && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", marginBottom: 6 }}>
                  Photos
                </div>
                {supabase && userId ? (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAddImage(f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={imageUploading}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(13,148,136,0.35)",
                        background: imageUploading ? "rgba(13,148,136,0.2)" : "rgba(13,148,136,0.08)",
                        fontFamily: F,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#0f766e",
                        cursor: imageUploading ? "default" : "pointer",
                      }}
                    >
                      {imageUploading ? "Uploading…" : "+ Add photo"}
                    </button>
                    {images.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                        {images.map((img, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img src={img.url} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(13,148,136,0.3)" }} />
                            <button type="button" onClick={() => handleRemoveImage(i)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14, cursor: "pointer", lineHeight: 1 }} aria-label="Remove">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)" }}>Sign in to upload photos.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function ArtistInput({ onAdd, artists, onRemove, supportsSpotifySearch, supportsManualEntry }) {
  const [input, setInput] = useState("");
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState(null);

  const searchSpotify = useCallback(async (q) => {
    if (!q.trim() || !supportsSpotifySearch) return;
    setSpotifyLoading(true);
    setSpotifyError(null);
    setSpotifyResults([]);
    try {
      const res = await fetch(`/api/spotify/search-artists?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.details || res.statusText);
      setSpotifyResults(data.artists ?? []);
    } catch (err) {
      setSpotifyError(err.message || "Search failed");
      setSpotifyResults([]);
    } finally {
      setSpotifyLoading(false);
    }
  }, [supportsSpotifySearch]);

  useEffect(() => {
    if (!supportsSpotifySearch || input.trim().length < 2) {
      setSpotifyResults([]);
      setSpotifyError(null);
      return;
    }
    const t = setTimeout(() => searchSpotify(input), 350);
    return () => clearTimeout(t);
  }, [input, supportsSpotifySearch, searchSpotify]);

  const handleAddFromSpotify = (artist) => {
    onAdd({ name: artist.name, spotify_id: artist.id });
    setInput("");
    setSpotifyResults([]);
    setSpotifyError(null);
  };

  const handleAddManual = () => {
    const trimmed = (input || "").trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, spotify_id: null });
    setInput("");
    setSpotifyResults([]);
    setSpotifyError(null);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (spotifyResults.length === 1) handleAddFromSpotify(spotifyResults[0]);
              else if (supportsManualEntry) handleAddManual();
            }
          }}
          placeholder={supportsSpotifySearch ? "Search artist or type name" : "Type artist name"}
          style={inputStyle}
        />
        {supportsManualEntry && (
          <button
            type="button"
            onClick={handleAddManual}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #0d9488, #10b981)",
              color: "#fff",
              fontFamily: F,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        )}
      </div>
      {supportsSpotifySearch && (
        <>
          {spotifyLoading && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.6)", marginBottom: 4 }}>Searching Spotify…</div>}
          {spotifyError && <div style={{ fontFamily: F, fontSize: 11, color: "#b91c1c", marginBottom: 4 }}>{spotifyError}</div>}
          {!spotifyLoading && spotifyResults.length > 0 && (
            <div style={{ marginBottom: 8, maxHeight: 160, overflow: "auto", border: "1px solid rgba(13,148,136,0.2)", borderRadius: 10, padding: 6 }}>
              {spotifyResults.slice(0, 8).map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => handleAddFromSpotify(artist)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    border: "none",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    background: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: F,
                    fontSize: 13,
                    color: "#1e1b4b",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{artist.name}</span>
                  <span style={{ fontSize: 11, color: "#0d9488", fontWeight: 600 }}>+ Add</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {artists?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {artists.map((a, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 8,
                background: "rgba(13,148,136,0.1)",
                border: "1px solid rgba(13,148,136,0.3)",
                fontFamily: F,
                fontSize: 12,
              }}
            >
              {typeof a === "object" ? a.name : a}
              <button type="button" onClick={() => onRemove(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14, color: "#0d9488" }} aria-label="Remove">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
