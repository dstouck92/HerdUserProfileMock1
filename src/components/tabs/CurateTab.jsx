import { useState, useEffect } from "react";
import { Card, Sec, Btn, Btn2, Empty, AvatarSprite } from "../ui";

const F = "'DM Sans', sans-serif";

export default function CurateTab({
  concerts,
  merch,
  vinyl,
  data,
  user,
  youtube,
  youtubeTakeout,
  onToggleConcertFeatured,
  onToggleVinylFeatured,
  onToggleMerchFeatured,
  onToggleArtistFeatured,
  onToggleYoutubeChannelFeatured,
  onPreviewProfile,
  onOpenAvatarPicker,
  onSaveUserBio,
  badgeDefinitions = [],
  userBadges = [],
  onToggleBadgePublic,
}) {
  const [artistSearch, setArtistSearch] = useState("");
  const [youtubeChannelSearch, setYoutubeChannelSearch] = useState("");
  const hasData = concerts.length > 0 || merch.length > 0 || vinyl.length > 0 || data || youtube || youtubeTakeout;
  const featuredArtists = data?.featuredArtists ?? [];
  const topArtists = data?.topArtists ?? [];
  const searchTrim = artistSearch.trim().toLowerCase();
  const searchResults = searchTrim
    ? topArtists.filter((a) => a.name.toLowerCase().includes(searchTrim))
    : [];
  const searchResultsNotFeatured = searchResults.filter((a) => !featuredArtists.some((fa) => fa.name === a.name));

  const featuredYoutubeChannels = youtube?.featured_youtube_channels ?? [];
  const subscriptionsForSearch = youtube?.subscriptions_ranked_by_likes_json ?? youtube?.subscriptions_json ?? [];
  const takeoutChannels = (youtubeTakeout?.watch_history_json ?? []).map((r) => r.channelName || r.channelTitle).filter(Boolean);
  const uniqueTakeoutChannels = [...new Set(takeoutChannels)];
  const youtubeSearchTrim = youtubeChannelSearch.trim().toLowerCase();
  const youtubeSearchPool = [...subscriptionsForSearch.map((s) => ({ channelId: s.channelId, channelTitle: s.title })), ...uniqueTakeoutChannels.map((t) => ({ channelId: null, channelTitle: t }))];
  const seenKey = new Set();
  const youtubeSearchPoolDeduped = youtubeSearchPool.filter((c) => { const k = c.channelId || c.channelTitle; if (seenKey.has(k)) return false; seenKey.add(k); return true; });
  const youtubeSearchResults = youtubeSearchTrim ? youtubeSearchPoolDeduped.filter((c) => (c.channelTitle || "").toLowerCase().includes(youtubeSearchTrim)) : [];
  const youtubeSearchNotFeatured = youtubeSearchResults.filter((c) => !featuredYoutubeChannels.some((f) => (f.channelId || f.channelTitle) === (c.channelId || c.channelTitle)));

  const channelRankings = youtubeTakeout?.channel_rankings_json ?? [];
  const channelMinutesMap = {};
  channelRankings.forEach((c) => {
    const name = (c.channelName || "").trim();
    if (name) channelMinutesMap[name.toLowerCase()] = c.totalMinutes ?? 0;
  });
  const getMinutesForChannel = (channelTitle) => {
    const key = (channelTitle || "").trim().toLowerCase();
    return channelMinutesMap[key] != null ? channelMinutesMap[key] : null;
  };

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

  const earnedBadges = (userBadges || [])
    .map((b) => {
      const def = badgeDefinitions.find((d) => d.key === b.badge_key);
      return def ? { ...b, def } : null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      const sa = a.def.sort_order ?? 0;
      const sb = b.def.sort_order ?? 0;
      return sa - sb;
    });

  const publicEarnedBadges = earnedBadges.filter((b) => b.is_public);

  useEffect(() => {
    setBioAge(user?.age != null ? String(user.age) : "");
    setBioGender(user?.gender || "");
    setBioCountry(user?.country || "");
    setBioRegion(user?.region || "");
    setShowAge(!!user?.show_age_public);
    setShowGender(!!user?.show_gender_public);
    setShowLocation(!!user?.show_location_public);
  }, [user?.age, user?.gender, user?.country, user?.region, user?.show_age_public, user?.show_gender_public, user?.show_location_public]);

  const handleSaveBio = async () => {
    if (!onSaveUserBio) return;
    setBioError("");
    setBioMessage("");
    const trimmedAge = (bioAge || "").trim();
    let ageNumber = null;
    if (trimmedAge) {
      const parsed = parseInt(trimmedAge, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setBioError("Please enter a valid age or leave it blank.");
        return;
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
    } catch {
      setBioError("Could not save bio. Please try again.");
    } finally {
      setBioSaving(false);
    }
  };

  return (
    <div>
      {!hasData ? (
        <Empty icon="✨" title="Nothing to Curate Yet" desc="Add concerts, merch, vinyl, or upload Spotify history first." />
      ) : (
      <>
      <div style={{ margin: "0 20px 16px", padding: "14px 16px", background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(52,211,153,0.06))", borderRadius: 14, border: "1px solid rgba(13,148,136,0.2)" }}>
        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e", marginBottom: 4 }}>✨ Curate Your Public Profile</div>
        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", lineHeight: 1.5 }}>Select items from Digital, Physical, and Live tabs to feature publicly. Tap your avatar circle above to choose a different profile avatar or upload your own profile picture.</div>
      </div>
      <Sec icon="👤">User Bio</Sec>
      <Card>
        <div style={{ padding: "12px 20px 4px", borderBottom: "1px solid rgba(13,148,136,0.08)" }}>
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.6)", marginBottom: 8 }}>
            Add basic bio details and choose what appears on your public profile.
          </div>
        </div>
        <div style={{ padding: "10px 20px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>
                Age
              </label>
              <input
                type="number"
                value={bioAge}
                onChange={(e) => setBioAge(e.target.value)}
                placeholder="25"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.7)" }}>
              <input
                type="checkbox"
                style={{ accentColor: "#0d9488" }}
                checked={showAge}
                onChange={(e) => setShowAge(e.target.checked)}
              />
              <span>Show on public profile</span>
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>
                Gender
              </label>
              <input
                type="text"
                value={bioGender}
                onChange={(e) => setBioGender(e.target.value)}
                placeholder="Female, Male, Non-binary, etc."
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box" }}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.7)" }}>
              <input
                type="checkbox"
                style={{ accentColor: "#0d9488" }}
                checked={showGender}
                onChange={(e) => setShowGender(e.target.checked)}
              />
              <span>Show on public profile</span>
            </label>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>
                  Country
                </label>
                <input
                  type="text"
                  value={bioCountry}
                  onChange={(e) => setBioCountry(e.target.value)}
                  placeholder="United States"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 4 }}>
                  Region / State
                </label>
                <input
                  type="text"
                  value={bioRegion}
                  onChange={(e) => setBioRegion(e.target.value)}
                  placeholder="California"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.7)" }}>
              <input
                type="checkbox"
                style={{ accentColor: "#0d9488" }}
                checked={showLocation}
                onChange={(e) => setShowLocation(e.target.checked)}
              />
              <span>Show country & region on public profile</span>
            </label>
          </div>
          {(bioError || bioMessage) && (
            <div style={{ fontFamily: F, fontSize: 11, color: bioError ? "#b91c1c" : "#15803d" }}>
              {bioError || bioMessage}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={handleSaveBio}
              disabled={bioSaving}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #0d9488, #10b981)",
                color: "#fff",
                fontFamily: F,
                fontSize: 13,
                fontWeight: 600,
                cursor: bioSaving ? "default" : "pointer",
                opacity: bioSaving ? 0.75 : 1,
              }}
            >
              {bioSaving ? "Saving…" : "Save Bio"}
            </button>
          </div>
        </div>
      </Card>
      <Sec icon="🏅" right="Manage" onRightClick={() => setBadgesModalOpen(true)}>
        Badges
      </Sec>
      <Card>
        <div style={{ padding: "12px 20px 10px" }}>
          <div
            style={{
              fontFamily: F,
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(55,48,107,0.6)",
              marginBottom: 8,
            }}
          >
            Choose which badges appear on your public profile. You can always change these later.
          </div>
          {earnedBadges.length === 0 ? (
            <div
              style={{
                fontFamily: F,
                fontSize: 13,
                color: "rgba(55,48,107,0.55)",
              }}
            >
              No badges yet. As you add concerts, merch, connect streaming, and grow your followers, badges will unlock here.
            </div>
          ) : publicEarnedBadges.length === 0 ? (
            <div
              style={{
                fontFamily: F,
                fontSize: 13,
                color: "rgba(55,48,107,0.55)",
              }}
            >
              You&apos;ve earned {earnedBadges.length} badge{earnedBadges.length > 1 ? "s" : ""}. Tap <span style={{ fontWeight: 600 }}>Manage</span> to pick which to show.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {publicEarnedBadges.slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.35)",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{b.def.icon || "🏅"}</span>
                  <span
                    style={{
                      fontFamily: F,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#065f46",
                    }}
                  >
                    {b.def.name}
                  </span>
                </div>
              ))}
              {publicEarnedBadges.length > 6 && (
                <span
                  style={{
                    fontFamily: F,
                    fontSize: 12,
                    color: "rgba(55,48,107,0.7)",
                  }}
                >
                  +{publicEarnedBadges.length - 6} more
                </span>
              )}
            </div>
          )}
          {earnedBadges.length > 0 && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setBadgesModalOpen(true)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "linear-gradient(135deg, #0d9488, #10b981)",
                  color: "#fff",
                  fontFamily: F,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(13,148,136,0.3)",
                }}
              >
                Manage Badges
              </button>
            </div>
          )}
        </div>
      </Card>
      {data && data.topArtists.length > 0 && (
        <>
          <Sec icon="🎵">From Your Streaming</Sec>
          <Card>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(13,148,136,0.1)" }}>
              <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.6)", marginBottom: 8 }}>Featured artists (checked = shown on public profile)</div>
              {featuredArtists.length === 0 ? (
                <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.5)" }}>None yet. Your top artist is added by default when you have streaming data.</div>
              ) : (
                featuredArtists.map((fa, i) => (
                  <div key={fa.name ?? i} style={{ display: "flex", alignItems: "center", padding: "8px 0", gap: 12, borderBottom: i < featuredArtists.length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                    <input
                      type="checkbox"
                      style={{ accentColor: "#0d9488" }}
                      checked
                      onChange={(e) => onToggleArtistFeatured?.(fa.name, e.target.checked)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{fa.name}</div>
                      {fa.hours != null && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{fa.hours} hours</div>}
                    </div>
                    <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#059669", background: "rgba(16,185,129,0.08)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>streaming</span>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: "12px 20px" }}>
              <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 6 }}>Search your listening history to add an artist</label>
              <input
                type="text"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
                placeholder="Type artist name..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.25)", background: "rgba(255,255,255,0.8)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }}
              />
              {searchResultsNotFeatured.length > 0 && (
                <div style={{ marginTop: 10, maxHeight: 200, overflow: "auto" }}>
                  {searchResultsNotFeatured.slice(0, 20).map((a, i) => (
                    <button
                      type="button"
                      key={a.name}
                      onClick={() => { onToggleArtistFeatured?.(a.name, true); setArtistSearch(""); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", border: "none", borderBottom: i < Math.min(19, searchResultsNotFeatured.length - 1) ? "1px solid rgba(0,0,0,0.06)" : "none", background: "none", cursor: "pointer", textAlign: "left", fontFamily: F, fontSize: 14, color: "#1e1b4b" }}
                    >
                      <span style={{ fontWeight: 600 }}>{a.name}</span>
                      <span style={{ fontSize: 12, color: "#0d9488", fontWeight: 600 }}>+ Add</span>
                    </button>
                  ))}
                </div>
              )}
              {searchTrim && searchResultsNotFeatured.length === 0 && searchResults.length > 0 && (
                <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginTop: 8 }}>All matching artists are already featured.</div>
              )}
            </div>
          </Card>
        </>
      )}
      {(youtube || youtubeTakeout) && (
        <>
          <Sec icon="▶️">From Your YouTube</Sec>
          <Card>
            {youtube ? (
              <>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(13,148,136,0.1)" }}>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.6)", marginBottom: 8 }}>Featured channels (checked = shown on public profile)</div>
                  {featuredYoutubeChannels.length === 0 ? (
                    <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.5)" }}>None yet. Search below to add channels you’re subscribed to or have watched (Takeout).</div>
                  ) : (
                    featuredYoutubeChannels.map((fc, i) => {
                      const mins = fc.totalMinutes != null ? fc.totalMinutes : getMinutesForChannel(fc.channelTitle);
                      return (
                        <div key={(fc.channelId || fc.channelTitle) || i} style={{ display: "flex", alignItems: "center", padding: "8px 0", gap: 12, borderBottom: i < featuredYoutubeChannels.length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                          <input type="checkbox" style={{ accentColor: "#0d9488" }} checked onChange={(e) => onToggleYoutubeChannelFeatured?.(fc.channelId, fc.channelTitle, e.target.checked)} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{fc.channelTitle || fc.channelId || "—"}</div>
                            {mins != null && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)", marginTop: 2 }}>{Math.round(mins).toLocaleString()} min watched</div>}
                          </div>
                          <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#FF0000", background: "rgba(255,0,0,0.08)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>YouTube</span>
                        </div>
                      );
                    })
                  )}
                </div>
                <div style={{ padding: "12px 20px" }}>
                  <label style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "rgba(55,48,107,0.7)", display: "block", marginBottom: 6 }}>Search subscriptions or channels you’ve watched (Takeout)</label>
                  <input
                    type="text"
                    value={youtubeChannelSearch}
                    onChange={(e) => setYoutubeChannelSearch(e.target.value)}
                    placeholder="Type channel name..."
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.25)", background: "rgba(255,255,255,0.8)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }}
                  />
                  {youtubeSearchNotFeatured.length > 0 && (
                    <div style={{ marginTop: 10, maxHeight: 200, overflow: "auto" }}>
                      {youtubeSearchNotFeatured.slice(0, 20).map((c, i) => (
                        <button
                          type="button"
                          key={(c.channelId || c.channelTitle) || i}
                          onClick={() => { onToggleYoutubeChannelFeatured?.(c.channelId, c.channelTitle, true); setYoutubeChannelSearch(""); }}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", border: "none", borderBottom: i < Math.min(19, youtubeSearchNotFeatured.length - 1) ? "1px solid rgba(0,0,0,0.06)" : "none", background: "none", cursor: "pointer", textAlign: "left", fontFamily: F, fontSize: 14, color: "#1e1b4b" }}
                        >
                          <span style={{ fontWeight: 600 }}>{c.channelTitle || c.channelId || "—"}</span>
                          <span style={{ fontSize: 12, color: "#0d9488", fontWeight: 600 }}>+ Add</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {youtubeSearchTrim && youtubeSearchNotFeatured.length === 0 && youtubeSearchPoolDeduped.length > 0 && (
                    <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.5)", marginTop: 8 }}>All matching channels are already featured.</div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: "16px 20px", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.7)" }}>Connect YouTube on the Digital tab to feature channels. You can then add channels from your Takeout watch history here.</div>
            )}
          </Card>
        </>
      )}
      {concerts.length > 0 && (
        <>
          <Sec icon="🎫">From Your Concerts</Sec>
          <Card>{concerts.slice(0, 3).map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i < Math.min(concerts.length, 3) - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
              <input
                type="checkbox"
                style={{ accentColor: "#0d9488" }}
                checked={!!c.is_featured}
                onChange={(e) => onToggleConcertFeatured?.(c.id, e.target.checked)}
              />
              <div style={{ flex: 1 }}><div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{c.artist}{c.tour ? ` - ${c.tour}` : ""}</div><div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{c.date} · {c.venue}</div></div>
              <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#0f766e", background: "rgba(13,148,136,0.1)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>concert</span>
            </div>
          ))}</Card>
        </>
      )}
      {vinyl.length > 0 && (
        <>
          <Sec icon="💿">From Your Vinyl</Sec>
          <Card>{vinyl.slice(0, 3).map((v, i) => (
            <div key={v.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i < Math.min(vinyl.length, 3) - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
              <input
                type="checkbox"
                style={{ accentColor: "#0d9488" }}
                checked={!!v.is_featured}
                onChange={(e) => onToggleVinylFeatured?.(v.id, e.target.checked)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{v.artist_name}</div>
                <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{v.album_name}{v.is_limited_edition && <span style={{ color: "#0d9488", fontWeight: 600 }}> · Limited</span>}</div>
              </div>
              <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#0f766e", background: "rgba(13,148,136,0.1)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>vinyl</span>
            </div>
          ))}</Card>
        </>
      )}
      {merch.length > 0 && (
        <>
          <Sec icon="👕">From Your Merch</Sec>
          <Card>{merch.slice(0, 3).map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, borderBottom: i < Math.min(merch.length, 3) - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
              <input
                type="checkbox"
                style={{ accentColor: "#0d9488" }}
                checked={!!m.is_featured}
                onChange={(e) => onToggleMerchFeatured?.(m.id, e.target.checked)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{m.artist_name}</div>
                <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{m.item_name} · {m.merch_type}</div>
              </div>
              <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#0f766e", background: "rgba(13,148,136,0.1)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>merch</span>
            </div>
          ))}</Card>
        </>
      )}
      <div style={{ margin: "8px 20px 20px", display: "flex", gap: 10 }}>
        <Btn2 style={{ flex: 1 }}>+ Add Item</Btn2>
        <Btn style={{ flex: 1 }} onClick={onPreviewProfile}>
          Preview Profile
        </Btn>
      </div>
      {badgesModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setBadgesModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: "80vh",
              background: "#f9fafb",
              borderRadius: 18,
              boxShadow: "0 18px 50px rgba(15,23,42,0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 18px",
                borderBottom: "1px solid rgba(148,163,184,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontFamily: F,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Manage Badges
              </div>
              <button
                type="button"
                onClick={() => setBadgesModalOpen(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 20,
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
                aria-label="Close badges manager"
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "10px 18px 6px" }}>
              <div
                style={{
                  fontFamily: F,
                  fontSize: 12,
                  color: "rgba(55,48,107,0.7)",
                  lineHeight: 1.5,
                }}
              >
                Toggle which earned badges are visible on your public profile. Turning a badge off keeps it saved but hides it from others.
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "0 18px 14px",
              }}
            >
              {earnedBadges.length === 0 ? (
                <div
                  style={{
                    padding: "12px 0 16px",
                    fontFamily: F,
                    fontSize: 13,
                    color: "rgba(55,48,107,0.7)",
                  }}
                >
                  No badges unlocked yet. Come back after you add concerts, merch, connect Spotify/YouTube, or gain followers.
                </div>
              ) : (
                earnedBadges.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(226,232,240,0.9)",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #0f766e, #22c55e)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{b.def.icon || "🏅"}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: F,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {b.def.name}
                      </div>
                      <div
                        style={{
                          fontFamily: F,
                          fontSize: 11,
                          color: "rgba(55,48,107,0.6)",
                          marginTop: 2,
                        }}
                      >
                        {b.def.category}
                        {b.def.description ? ` · ${b.def.description}` : ""}
                      </div>
                    </div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: F,
                        fontSize: 11,
                        color: "rgba(55,48,107,0.8)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ accentColor: "#0d9488" }}
                        checked={!!b.is_public}
                        onChange={(e) =>
                          onToggleBadgePublic?.(b.badge_key, e.target.checked)
                        }
                      />
                      Show
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
