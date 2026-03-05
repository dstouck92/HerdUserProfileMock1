import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Sec, Btn, Empty, F } from "../ui";
import CurateCardEditor from "../CurateCardEditor";
import PublicProfile from "../../PublicProfile";
import { supabase } from "../../lib/supabase";

export default function CurateTab({
  concerts,
  merch,
  vinyl,
  data,
  user,
  youtube,
  youtubeTakeout,
  onPreviewProfile,
  onOpenAvatarPicker,
  onSaveUserBio,
  badgeDefinitions = [],
  userBadges = [],
  onToggleBadgePublic,
  publicProfileTheme,
  onSaveProfileTheme,
}) {
  const [categories, setCategories] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [userCards, setUserCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [curateSaveStatus, setCurateSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'

  const [bioAge, setBioAge] = useState(user?.age != null ? String(user.age) : "");
  const [bioGender, setBioGender] = useState(user?.gender || "");
  const [bioCountry, setBioCountry] = useState(user?.country || "");
  const [bioRegion, setBioRegion] = useState(user?.region || "");
  const [showAge, setShowAge] = useState(!!user?.show_age_public);
  const [showGender, setShowGender] = useState(!!user?.show_gender_public);
  const [showLocation, setShowLocation] = useState(!!user?.show_location_public);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioError, setBioError] = useState("");
  const [bioMessage, setBioMessage] = useState("");
  const [badgesModalOpen, setBadgesModalOpen] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [curateMode, setCurateMode] = useState("edit"); // 'edit' | 'view'
  const touchStartXRef = useRef(null);

  const themeOptions = [
    { id: "default", label: "Default", bg: "linear-gradient(135deg, #e0f2fe, #ccfbf1)", border: "rgba(13,148,136,0.4)" },
    { id: "white_red", label: "White / Red", bg: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "rgba(185,28,28,0.4)" },
    { id: "orange_blue", label: "Orange / Blue", bg: "linear-gradient(135deg, #fff7ed, #dbeafe)", border: "rgba(234,88,12,0.4)" },
    { id: "black_purple", label: "Black / Purple", bg: "linear-gradient(135deg, #1e1b4b, #4c1d95)", border: "rgba(139,92,246,0.5)" },
    { id: "green_purple", label: "Green / Purple", bg: "linear-gradient(135deg, #dcfce7, #f3e8ff)", border: "rgba(34,197,94,0.4)" },
  ];
  const currentTheme = themeOptions.find((t) => t.id === (publicProfileTheme || "default")) ?? themeOptions[0];

  useEffect(() => {
    setBioAge(user?.age != null ? String(user.age) : "");
    setBioGender(user?.gender || "");
    setBioCountry(user?.country || "");
    setBioRegion(user?.region || "");
    setShowAge(!!user?.show_age_public);
    setShowGender(!!user?.show_gender_public);
    setShowLocation(!!user?.show_location_public);
  }, [user?.age, user?.gender, user?.country, user?.region, user?.show_age_public, user?.show_gender_public, user?.show_location_public]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [catRes, promRes, cardsRes] = await Promise.all([
        supabase.from("curate_prompt_categories").select("id, slug, name, sort_order").order("sort_order", { ascending: true }),
        supabase.from("curate_prompts").select("id, category_id, slug, prompt_text, max_characters, answer_config, sort_order").order("sort_order", { ascending: true }),
        user?.id ? supabase.from("user_curate_cards").select("id, user_id, card_index, prompt_id, answer, updated_at").eq("user_id", user.id).order("card_index", { ascending: true }) : { data: [] },
      ]);
      if (cancelled) return;
      if (catRes.data) setCategories(catRes.data);
      if (promRes.data) setPrompts(promRes.data);
      if (cardsRes.data) {
        const byIndex = {};
        (cardsRes.data || []).forEach((row) => {
          byIndex[row.card_index] = row;
        });
        setUserCards(byIndex);
      } else {
        setUserCards([]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const getCardState = useCallback(
    (cardIndex) => {
      const row = userCards[cardIndex];
      const promptId = row?.prompt_id ?? null;
        const prompt = promptId ? prompts.find((p) => p.id === promptId) : null;
      const answer = row?.answer ?? {};
      return { promptId, prompt, answer, row };
    },
    [userCards, prompts],
  );

  const handleSelectPrompt = useCallback((cardIndex, promptId) => {
    setUserCards((prev) => {
      const next = { ...prev };
      const existing = next[cardIndex];
      next[cardIndex] = { ...existing, prompt_id: promptId, answer: existing?.answer ?? {} };
      return next;
    });
  }, []);

  const handleChangeAnswer = useCallback((cardIndex, answerUpdate) => {
    setUserCards((prev) => {
      const next = { ...prev };
      const existing = next[cardIndex];
      const currentAnswer = existing?.answer ?? {};
      const newAnswer = { ...currentAnswer, ...answerUpdate };
      next[cardIndex] = { ...existing, answer: newAnswer };
      return next;
    });
  }, []);

  const handleSaveAllCurate = useCallback(async () => {
    if (!supabase || !user?.id) return;
    setCurateSaveStatus("saving");
    let hadError = false;
    try {
      for (let cardIndex = 1; cardIndex <= 5; cardIndex++) {
        const row = userCards[cardIndex];
        const promptId = row?.prompt_id ?? null;
        const answer = row?.answer ?? {};
        const payload = {
          user_id: user.id,
          card_index: cardIndex,
          prompt_id: promptId || null,
          answer: answer && Object.keys(answer).length ? answer : {},
          updated_at: new Date().toISOString(),
        };
        const { data: existing } = await supabase.from("user_curate_cards").select("id").eq("user_id", user.id).eq("card_index", cardIndex).maybeSingle();
        const { error } = existing
          ? await supabase.from("user_curate_cards").update({ prompt_id: payload.prompt_id, answer: payload.answer, updated_at: payload.updated_at }).eq("user_id", user.id).eq("card_index", cardIndex)
          : await supabase.from("user_curate_cards").insert(payload);
        if (error) {
          hadError = true;
          if (import.meta.env?.DEV) console.error("Curate card save error:", error);
        }
      }
      setCurateSaveStatus(hadError ? "error" : "saved");
    } catch (e) {
      setCurateSaveStatus("error");
      if (import.meta.env?.DEV) console.error("Curate save error:", e);
    }
    setTimeout(() => setCurateSaveStatus(null), 2500);
  }, [user?.id, userCards]);

  const formatBadgeTitle = (b) => {
    const meta = b.metadata || {};
    const artistName = meta.artistName || meta.artist || null;
    const trackName = meta.trackName || meta.songName || null;
    const channelName = meta.channelName || null;
    const videoTitle = meta.title || null;
    switch (b.badge_key) {
      case "fan_superfan_all_users_top_10":
        return artistName ? `Superfan of ${artistName} (all users)` : b.def.name;
      case "fan_superfan_fan_club_top_10":
        return artistName ? `Superfan of ${artistName} (fan club)` : b.def.name;
      case "streams_most_streamed_artist":
        return artistName ? `${artistName} – Most Streamed Artist` : b.def.name;
      case "streams_most_streamed_song":
        return trackName ? `${trackName} – Most Streamed Song` : b.def.name;
      case "yt_most_viewed_channel":
        return channelName ? `${channelName} – Most Viewed Channel` : b.def.name;
      case "yt_most_viewed_video":
        return videoTitle ? `${videoTitle} – Most Viewed Video` : b.def.name;
      case "tickets_groupie":
        return artistName ? `Groupie for ${artistName}` : b.def.name;
      case "merch_collector":
        return artistName ? `Collector of ${artistName}` : b.def.name;
      default:
        return b.def.name;
    }
  };

  const badgeKeysSeen = new Set();
  const earnedBadges = (userBadges || [])
    .map((b) => {
      const def = badgeDefinitions.find((d) => d.key === b.badge_key);
      return def ? { ...b, def } : null;
    })
    .filter(Boolean)
    .filter((b) => {
      if (badgeKeysSeen.has(b.badge_key)) return false;
      badgeKeysSeen.add(b.badge_key);
      return true;
    })
    .sort((a, b) => (a.def.sort_order ?? 0) - (b.def.sort_order ?? 0));
  const publicEarnedBadges = earnedBadges.filter((b) => b.is_public);

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current == null || !e.changedTouches || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const threshold = 40;
    if (deltaX <= -threshold) {
      setCurateMode("view");
    } else if (deltaX >= threshold) {
      setCurateMode("edit");
    }
    touchStartXRef.current = null;
  };

  const handleSaveBio = async () => {
    if (!onSaveUserBio) return false;
    setBioError("");
    setBioMessage("");
    const trimmedAge = (bioAge || "").trim();
    let ageNumber = null;
    if (trimmedAge) {
      const parsed = parseInt(trimmedAge, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setBioError("Please enter a valid age or leave it blank.");
        return false;
      }
      ageNumber = parsed;
    }
    setBioSaving(true);
    try {
      await onSaveUserBio({
        age: ageNumber,
        gender: bioGender.trim() || null,
        country: bioCountry.trim() || null,
        region: bioRegion.trim() || null,
        showAge,
        showGender,
        showLocation,
      });
      setBioMessage("Saved");
      setTimeout(() => setBioMessage(""), 2000);
      return true;
    } catch {
      setBioError("Could not save bio. Please try again.");
      return false;
    } finally {
      setBioSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.7)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div
        style={{
          margin: "4px 20px 16px",
          padding: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(148,163,184,0.4)",
          display: "flex",
        }}
      >
        {["edit", "view"].map((mode) => {
          const isActive = curateMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setCurateMode(mode)}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                padding: "8px 0",
                fontFamily: F,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                background: isActive ? "linear-gradient(135deg, #0d9488, #10b981)" : "transparent",
                color: isActive ? "#fff" : "rgba(55,48,107,0.7)",
                boxShadow: isActive ? "0 2px 8px rgba(13,148,136,0.4)" : "none",
                transition: "all 0.16s ease-out",
                textTransform: "capitalize",
              }}
            >
              {mode === "edit" ? "Edit" : "View"}
            </button>
          );
        })}
      </div>

      {curateMode === "view" && user?.username ? (
        <div style={{ marginTop: 4 }}>
          <PublicProfile username={user.username} embedded />
        </div>
      ) : (
        <>

      <Sec icon="🎨">Profile theme</Sec>
      <Card>
        <div style={{ padding: "12px 20px" }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.6)", marginBottom: 10 }}>Choose how your public profile looks</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {themeOptions.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSaveProfileTheme?.(t.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: (publicProfileTheme || "default") === t.id ? `2px solid ${t.border}` : "1px solid rgba(13,148,136,0.2)",
                  background: t.bg,
                  fontFamily: F,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: t.id === "black_purple" ? "#e9d5ff" : "#1e1b4b",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Sec icon="👤">User Bio</Sec>
      <Card
        style={{ cursor: "pointer" }}
        onClick={() => setBioModalOpen(true)}
      >
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.6)", marginBottom: 4 }}>Age, gender, location & visibility</div>
            <div style={{ fontFamily: F, fontSize: 13, color: "#1e1b4b" }}>
              {[bioAge && `Age ${bioAge}`, bioGender, (bioCountry || bioRegion) && [bioRegion, bioCountry].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "Tap to add your bio"}
            </div>
          </div>
          <span style={{ fontFamily: F, fontSize: 12, color: "#0d9488", fontWeight: 600 }}>Edit</span>
        </div>
      </Card>
      {bioModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && setBioModalOpen(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 400, maxHeight: "90vh", background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>User Bio</span>
              <button type="button" onClick={() => setBioModalOpen(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#64748b", cursor: "pointer" }} aria-label="Close">×</button>
            </div>
            <div style={{ overflow: "auto", padding: "16px 18px" }}>
              <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginBottom: 12 }}>Add basic bio and choose what appears on your public profile.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>Age</label>
                    <input type="number" value={bioAge} onChange={(e) => setBioAge(e.target.value)} placeholder="25" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.7)" }}>
                    <input type="checkbox" style={{ accentColor: "#0d9488" }} checked={showAge} onChange={(e) => setShowAge(e.target.checked)} />
                    <span>Show on public profile</span>
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>Gender</label>
                    <input type="text" value={bioGender} onChange={(e) => setBioGender(e.target.value)} placeholder="Female, Male, Non-binary, etc." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.7)" }}>
                    <input type="checkbox" style={{ accentColor: "#0d9488" }} checked={showGender} onChange={(e) => setShowGender(e.target.checked)} />
                    <span>Show on public profile</span>
                  </label>
                </div>
                <div>
                  <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>Country</label>
                  <input type="text" value={bioCountry} onChange={(e) => setBioCountry(e.target.value)} placeholder="United States" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box", marginBottom: 8 }} />
                </div>
                <div>
                  <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>Region / State</label>
                  <input type="text" value={bioRegion} onChange={(e) => setBioRegion(e.target.value)} placeholder="California" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.7)" }}>
                  <input type="checkbox" style={{ accentColor: "#0d9488" }} checked={showLocation} onChange={(e) => setShowLocation(e.target.checked)} />
                  <span>Show country & region on public profile</span>
                </label>
              </div>
              {(bioError || bioMessage) && <div style={{ fontFamily: F, fontSize: 11, color: bioError ? "#b91c1c" : "#15803d", marginTop: 10 }}>{bioError || bioMessage}</div>}
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setBioModalOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.3)", background: "#fff", color: "#0d9488", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await handleSaveBio();
                  if (ok) setBioModalOpen(false);
                }}
                disabled={bioSaving}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: bioSaving ? "default" : "pointer", opacity: bioSaving ? 0.75 : 1 }}
              >
                {bioSaving ? "Saving…" : "Save Bio"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sec icon="🏅" right="Manage" onRightClick={() => setBadgesModalOpen(true)}>Badges</Sec>
      <Card>
        <div style={{ padding: "12px 20px 10px" }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.6)", marginBottom: 8 }}>Choose which badges appear on your public profile. You can also attach them to prompt cards below.</div>
          {earnedBadges.length === 0 ? (
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.55)" }}>No badges yet. Add concerts, merch, connect streaming, and grow followers to unlock badges.</div>
          ) : publicEarnedBadges.length === 0 ? (
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.55)" }}>You&apos;ve earned {earnedBadges.length} badge{earnedBadges.length > 1 ? "s" : ""}. Tap <span style={{ fontWeight: 600 }}>Manage</span> to pick which to show.</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {publicEarnedBadges.slice(0, 6).map((b) => (
                <div key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.35)" }}>
                  <span style={{ fontSize: 14 }}>{b.def.icon || "🏅"}</span>
                  <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "#065f46" }}>{formatBadgeTitle(b)}</span>
                </div>
              ))}
              {publicEarnedBadges.length > 6 && <span style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.7)" }}>+{publicEarnedBadges.length - 6} more</span>}
            </div>
          )}
          {earnedBadges.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setBadgesModalOpen(true)} style={{ padding: "8px 14px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 10px rgba(13,148,136,0.3)" }}>
                Manage Badges
              </button>
            </div>
          )}
        </div>
      </Card>

      <Sec icon="📝">Your 5 profile cards</Sec>
      {[1, 2, 3, 4, 5].map((cardIndex) => {
        const { promptId, prompt, answer } = getCardState(cardIndex);
        return (
          <div key={cardIndex}>
            <CurateCardEditor
              cardIndex={cardIndex}
              categories={categories}
              prompts={prompts}
              selectedPrompt={prompt}
              answer={answer}
              concerts={concerts}
              vinyl={vinyl}
              merch={merch}
              streamingData={data}
              youtubeData={youtube}
              userBadges={userBadges}
              badgeDefinitions={badgeDefinitions}
              onSelectPrompt={(promptId) => handleSelectPrompt(cardIndex, promptId)}
              onChangeAnswer={(update) => handleChangeAnswer(cardIndex, update)}
              userId={user?.id}
              supabase={supabase}
            />
          </div>
        );
      })}

      <div style={{ margin: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          onClick={handleSaveAllCurate}
          disabled={curateSaveStatus === "saving"}
          style={{
            padding: "14px",
            borderRadius: 14,
            border: "none",
            background: curateSaveStatus === "saving" ? "rgba(13,148,136,0.5)" : "linear-gradient(135deg, #0d9488, #10b981)",
            color: "#fff",
            fontFamily: F,
            fontSize: 15,
            fontWeight: 700,
            cursor: curateSaveStatus === "saving" ? "default" : "pointer",
            boxShadow: curateSaveStatus === "saving" ? "none" : "0 4px 16px rgba(13,148,136,0.35)",
          }}
        >
          {curateSaveStatus === "saving" ? "Saving…" : "Save Changes"}
        </button>
        {curateSaveStatus === "saved" && <span style={{ fontFamily: F, fontSize: 13, color: "#15803d", fontWeight: 600, textAlign: "center" }}>Your curate section and public profile have been updated.</span>}
        {curateSaveStatus === "error" && <span style={{ fontFamily: F, fontSize: 13, color: "#b91c1c", fontWeight: 600, textAlign: "center" }}>Save failed. Try again.</span>}
      </div>

      {badgesModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setBadgesModalOpen(false); }}>
          <div style={{ width: "100%", maxWidth: 420, maxHeight: "80vh", background: "#f9fafb", borderRadius: 18, boxShadow: "0 18px 50px rgba(15,23,42,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(148,163,184,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <button type="button" onClick={() => setBadgesModalOpen(false)} style={{ border: "none", background: "none", fontSize: 18, color: "#0d9488", fontWeight: 700, cursor: "pointer" }} aria-label="Back">← Back</button>
              <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#0f172a", flex: 1, textAlign: "center" }}>Manage Badges</span>
              <button type="button" onClick={() => setBadgesModalOpen(false)} style={{ border: "none", background: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer", padding: 0, lineHeight: 1 }} aria-label="Close">×</button>
            </div>
            <div style={{ padding: "10px 18px 6px" }}>
              <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.7)", lineHeight: 1.5 }}>Toggle which earned badges are visible on your public profile.</div>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: "0 18px 14px" }}>
              {earnedBadges.length === 0 ? (
                <div style={{ padding: "12px 0 16px", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.7)" }}>No badges unlocked yet.</div>
              ) : (
                earnedBadges.map((b) => (
                  <div key={b.badge_key} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(226,232,240,0.9)", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #0f766e, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 18 }}>{b.def.icon || "🏅"}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{formatBadgeTitle(b)}</div>
                      <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.6)", marginTop: 2 }}>{b.def.category}{b.def.description ? ` · ${b.def.description}` : ""}</div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.8)", whiteSpace: "nowrap" }}>
                      <input type="checkbox" style={{ accentColor: "#0d9488" }} checked={!!b.is_public} onChange={(e) => onToggleBadgePublic?.(b.badge_key, e.target.checked)} />
                      Show
                    </label>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(148,163,184,0.4)", display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setBadgesModalOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #94a3b8", background: "#fff", color: "#64748b", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back</button>
              <button type="button" onClick={() => setBadgesModalOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
