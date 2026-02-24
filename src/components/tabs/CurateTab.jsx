import { useState } from "react";
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
}) {
  const [artistSearch, setArtistSearch] = useState("");
  const [youtubeChannelSearch, setYoutubeChannelSearch] = useState("");
  const hasData = concerts.length > 0 || merch.length > 0 || vinyl.length > 0 || data || youtube || youtubeTakeout;
  const avatarId = user?.avatar_id ?? 7;
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

  return (
    <div>
      {/* Profile avatar - always visible on Curate */}
      <Sec icon="👤">Profile avatar</Sec>
      <Card style={{ margin: "0 16px 16px", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <AvatarSprite avatarId={avatarId} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>Your profile picture</div>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginTop: 2 }}>Shown next to your name and on your public profile.</div>
          </div>
          {onOpenAvatarPicker && (
            <button type="button" onClick={onOpenAvatarPicker} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.1)", color: "#0d9488", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Change</button>
          )}
        </div>
      </Card>

      {!hasData ? (
        <Empty icon="✨" title="Nothing to Curate Yet" desc="Add concerts, merch, vinyl, or upload Spotify history first." />
      ) : (
      <>
      <div style={{ margin: "0 20px 16px", padding: "14px 16px", background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(52,211,153,0.06))", borderRadius: 14, border: "1px solid rgba(13,148,136,0.2)" }}>
        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e", marginBottom: 4 }}>✨ Curate Your Public Profile</div>
        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", lineHeight: 1.5 }}>Select items from Digital, Physical, and Live tabs to feature publicly. Tap your avatar circle above to choose a different profile avatar.</div>
      </div>
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
                    featuredYoutubeChannels.map((fc, i) => (
                      <div key={(fc.channelId || fc.channelTitle) || i} style={{ display: "flex", alignItems: "center", padding: "8px 0", gap: 12, borderBottom: i < featuredYoutubeChannels.length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                        <input type="checkbox" style={{ accentColor: "#0d9488" }} checked onChange={(e) => onToggleYoutubeChannelFeatured?.(fc.channelId, fc.channelTitle, e.target.checked)} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{fc.channelTitle || fc.channelId || "—"}</div>
                        </div>
                        <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: "#FF0000", background: "rgba(255,0,0,0.08)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase" }}>YouTube</span>
                      </div>
                    ))
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
      </>
      )}
    </div>
  );
}
