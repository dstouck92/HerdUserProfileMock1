import { useState, useRef } from "react";
import { Card, Stats, Sec, Empty, Btn } from "../ui";

const F = "'DM Sans', sans-serif";

export default function DigitalTab({ data, onUpload, youtube, youtubeTakeout, onYoutubeConnect, onYoutubeSync, onYoutubeTakeoutImport }) {
  const [insightsModal, setInsightsModal] = useState(null);
  const [youtubeSyncing, setYoutubeSyncing] = useState(false);
  const [takeoutImporting, setTakeoutImporting] = useState(false);
   const [spotifyOpen, setSpotifyOpen] = useState(true);
  const [youtubeOpen, setYoutubeOpen] = useState(true);
  const [usageOpen, setUsageOpen] = useState(true);
  const [watchTrendExpanded, setWatchTrendExpanded] = useState(false);
  const [youtubeViewAllOpen, setYoutubeViewAllOpen] = useState(false);
  const takeoutInputRef = useRef(null);

  const artistsToShow = data?.topArtists?.slice(0, 10) ?? [];
  const tracksToShow = data?.topTracks?.slice(0, 10) ?? [];
  const hasMoreArtists = (data?.topArtists?.length ?? 0) > 10;
  const hasMoreTracks = (data?.topTracks?.length ?? 0) > 10;
  const getTopTrackForArtist = (artistName) => {
    const byArtist = (data?.topTracks ?? []).filter((t) => t.artist === artistName);
    if (!byArtist.length) return null;
    return byArtist.reduce((best, t) => (t.plays > best.plays ? t : best), byArtist[0]);
  };

  const rankedSubs = youtube?.subscriptions_ranked_by_likes_json ?? [];
  const likedVideos = youtube?.liked_videos_json ?? [];
  const playlists = youtube?.playlists_json ?? [];

  const handleRefresh = async () => {
    if (!onYoutubeSync) return;
    setYoutubeSyncing(true);
    try {
      await onYoutubeSync();
    } finally {
      setYoutubeSyncing(false);
    }
  };

  const handleTakeoutFile = async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !onYoutubeTakeoutImport) return;
    setTakeoutImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : (parsed.records ?? parsed.watchHistory ?? parsed.watch_history ?? []);
      if (!Array.isArray(list)) throw new Error("Invalid format");
      await onYoutubeTakeoutImport(list);
    } catch (err) {
      console.error(err);
    } finally {
      setTakeoutImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      {/* Spotify section */}
      <Sec icon="🎧" onToggle={() => setSpotifyOpen((v) => !v)} isOpen={spotifyOpen}>Spotify</Sec>
      {spotifyOpen && (
        data ? (
          <>
            <Stats stats={[{ value: Math.round(data.totalHours * 60).toLocaleString(), label: "Total Minutes" }, { value: data.uniqueArtists.toLocaleString(), label: "Artists" }, { value: data.uniqueTracks.toLocaleString(), label: "Tracks" }]} />
            <div style={{ margin: "0 20px 12px", display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={onUpload} style={{ border: "none", background: "none", padding: 0, fontFamily: F, fontSize: 12, fontWeight: 600, color: "#0d9488", cursor: "pointer", textDecoration: "underline" }}>Re-upload Spotify history</button>
            </div>
            <Sec icon="🎵" right={hasMoreArtists ? "View All ›" : undefined} onRightClick={hasMoreArtists ? () => setInsightsModal("artists") : undefined}>Top Artists</Sec>
            <Card>{artistsToShow.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}>
                <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${240 + i * 10},70%,${55 + i * 4}%), hsl(${250 + i * 12},60%,${65 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "rgba(255,255,255,0.8)" }}>♫</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                  <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{getTopTrackForArtist(a.name) ? `Top Track: ${getTopTrackForArtist(a.name).name}` : `${a.plays.toLocaleString()} plays`}</div>
                </div>
                <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(a.hours * 60)} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
              </div>
            ))}</Card>
            <Sec icon="🎶" right={hasMoreTracks ? "View All ›" : undefined} onRightClick={hasMoreTracks ? () => setInsightsModal("tracks") : undefined}>Top Songs</Sec>
            <Card>{tracksToShow.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12 }}>
                <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${260 + i * 8},65%,${50 + i * 4}%), hsl(${270 + i * 10},55%,${60 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>♪</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                  <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{t.artist}</div>
                </div>
                <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(t.hours * 60)} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
              </div>
            ))}</Card>
          </>
        ) : (
          <Empty icon="🎵" title="No Streaming Data Yet" desc="Upload your Spotify Extended Streaming History to see top artists, songs, and stats." btn="Upload Spotify History" onAction={onUpload} />
        )
      )}

      {/* YouTube section (includes Takeout) */}
      <Sec icon="▶️" onToggle={() => setYoutubeOpen((v) => !v)} isOpen={youtubeOpen} right={youtube ? "View All ›" : undefined} onRightClick={youtube ? () => setYoutubeViewAllOpen(true) : undefined}>YouTube</Sec>
      {youtubeOpen && (
        <>
          {!youtube ? (
            <>
              <Card style={{ padding: "20px" }}>
                <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.7)", marginBottom: 14 }}>Connect your YouTube account to see subscriptions, playlists, and liked videos. Data is cached and you can refresh anytime.</div>
                {onYoutubeConnect && <Btn onClick={onYoutubeConnect}>Connect YouTube</Btn>}
              </Card>
              <Sec icon="📥">Watch history (Takeout)</Sec>
              <Card style={{ padding: "16px 20px" }}>
                <input ref={takeoutInputRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={handleTakeoutFile} />
                {!youtubeTakeout ? (
                  <>
                    <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.7)", marginBottom: 14 }}>Import your YouTube watch history from Google Takeout (takeout.google.com → YouTube → History, JSON). Adds total watch time to your stats.</div>
                    {onYoutubeTakeoutImport && <Btn onClick={() => takeoutInputRef.current?.click()} disabled={takeoutImporting}>{takeoutImporting ? "Importing…" : "Import from Takeout"}</Btn>}
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{youtubeTakeout.video_count.toLocaleString()} videos · {Math.round(youtubeTakeout.total_watch_minutes).toLocaleString()} min total watch time</div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.55)", marginTop: 4 }}>Imported {youtubeTakeout.imported_at ? new Date(youtubeTakeout.imported_at).toLocaleDateString() : ""}</div>
                    {onYoutubeTakeoutImport && <button type="button" onClick={() => takeoutInputRef.current?.click()} disabled={takeoutImporting} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.1)", color: "#0d9488", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: takeoutImporting ? "wait" : "pointer" }}>{takeoutImporting ? "Importing…" : "Re-import Takeout"}</button>}
                  </>
                )}
              </Card>
            </>
          ) : (
            <>
              {/* YouTube header: Stats bar (like Spotify) + Refresh */}
              <Stats stats={[
                { value: youtubeTakeout?.video_count > 0 ? Math.round(youtubeTakeout.total_watch_minutes).toLocaleString() : "0", label: "Total Watch Time (min)" },
                { value: youtubeTakeout?.video_count > 0 ? youtubeTakeout.video_count.toLocaleString() : "0", label: "Total Videos Watched" },
                { value: (youtube.subscription_count ?? 0).toLocaleString(), label: "Subscriptions" },
              ]} />
              <div style={{ margin: "0 20px 12px", display: "flex", justifyContent: "flex-end" }}>
                {onYoutubeSync && <button type="button" onClick={handleRefresh} disabled={youtubeSyncing} style={{ border: "none", background: "none", padding: 0, fontFamily: F, fontSize: 12, fontWeight: 600, color: "#0d9488", cursor: youtubeSyncing ? "wait" : "pointer", textDecoration: "underline" }}>{youtubeSyncing ? "Refreshing…" : "Refresh YouTube data"}</button>}
              </div>

              {/* 1. Top channels (Takeout) - hide "Unknown" row */}
              {(youtubeTakeout?.channel_rankings_json?.length > 0) && (
                <>
                  <Sec icon="📺">Top channels (Takeout)</Sec>
                  <Card>{(youtubeTakeout.channel_rankings_json || []).filter((c) => (c.channelName || "").trim().toLowerCase() !== "unknown").slice(0, 10).map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, (youtubeTakeout.channel_rankings_json || []).filter((c) => (c.channelName || "").trim().toLowerCase() !== "unknown").length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${0 + i * 36},70%,55%), hsl(${20 + i * 36},60%,60%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.9)" }}>▶</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.channelName || "—"}</div>
                        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{c.watchCount?.toLocaleString?.() ?? 0} video{c.watchCount !== 1 ? "s" : ""}</div>
                      </div>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(c.totalMinutes).toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
                    </div>
                  ))}</Card>
                </>
              )}

              {/* 2. Top videos (Takeout) - strip leading "Watched " from title */}
              {(youtubeTakeout?.video_rankings_json?.length > 0) && (
                <>
                  <Sec icon="🎬">Top videos (Takeout)</Sec>
                  <Card>{(youtubeTakeout.video_rankings_json || []).slice(0, 10).map((v, i) => {
                    const displayTitle = (v.title || "").replace(/^Watched\s+/i, "").trim() || "Unknown";
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, (youtubeTakeout.video_rankings_json || []).length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                        <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${260 + i * 8},65%,${50 + i * 4}%), hsl(${270 + i * 10},55%,${60 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "rgba(255,255,255,0.9)" }}>♪</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayTitle}</div>
                          <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{v.channelName || ""}{v.watchCount > 1 ? ` · ${v.watchCount} views` : ""}</div>
                        </div>
                        <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(v.totalMinutes).toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
                      </div>
                    );
                  })}</Card>
                </>
              )}

              {/* 3. Watch time over time - by year first, "See more" for months */}
              {youtubeTakeout?.watch_trend_json?.length > 0 && (() => {
                const trend = youtubeTakeout.watch_trend_json || [];
                const byYear = trend.reduce((acc, row) => {
                  const y = (row.month || "").split("-")[0];
                  if (!y) return acc;
                  acc[y] = (acc[y] || 0) + (row.minutes || 0);
                  return acc;
                }, {});
                const yearRows = Object.entries(byYear).sort((a, b) => a[0].localeCompare(b[0])).map(([year, minutes]) => ({ year, minutes: Math.round(minutes * 10) / 10 }));
                return (
                  <>
                    <Sec icon="📈">Watch time over time</Sec>
                    <Card>
                      {yearRows.map((row, i) => {
                        const maxMin = Math.max(1, ...yearRows.map((r) => r.minutes));
                        const pct = Math.min(100, ((row.minutes || 0) / maxMin) * 100);
                        return (
                          <div key={row.year} style={{ padding: "10px 20px", borderBottom: i < yearRows.length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>{row.year}</span>
                              <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(row.minutes || 0).toLocaleString()} min</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 4, background: "rgba(13,148,136,0.12)", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #0d9488, #10b981)", transition: "width 0.2s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                      {trend.length > 0 && (
                        <div style={{ padding: "12px 20px" }}>
                          <button type="button" onClick={() => setWatchTrendExpanded((e) => !e)} style={{ border: "none", background: "none", padding: 0, fontFamily: F, fontSize: 13, fontWeight: 600, color: "#0d9488", cursor: "pointer", textDecoration: "underline" }}>{watchTrendExpanded ? "See less" : "See more"}</button>
                          {watchTrendExpanded && trend.map((row, i) => {
                            const [y, m] = (row.month || "").split("-");
                            const monthLabel = y && m ? new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : row.month;
                            const maxMin = Math.max(1, ...trend.map((r) => r.minutes || 0));
                            const pct = Math.min(100, ((row.minutes || 0) / maxMin) * 100);
                            return (
                              <div key={i} style={{ padding: "8px 0", borderTop: "1px solid rgba(13,148,136,0.08)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                  <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "#1e1b4b" }}>{monthLabel}</span>
                                  <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#0f766e" }}>{Math.round(row.minutes || 0).toLocaleString()} min</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 3, background: "rgba(13,148,136,0.1)", overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #0d9488, #10b981)" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </>
                );
              })()}
            </>
          )}

          {/* When YouTube not connected: still show Takeout import and any Takeout rankings if present */}
          {!youtube && youtubeTakeout && (youtubeTakeout?.channel_rankings_json?.length > 0 || youtubeTakeout?.video_rankings_json?.length > 0 || youtubeTakeout?.watch_trend_json?.length > 0) && (
            <>
              <Sec icon="📺">Top channels (Takeout)</Sec>
              <Card>{(youtubeTakeout.channel_rankings_json || []).filter((c) => (c.channelName || "").trim().toLowerCase() !== "unknown").slice(0, 10).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, (youtubeTakeout.channel_rankings_json || []).filter((x) => (x.channelName || "").trim().toLowerCase() !== "unknown").length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                  <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${0 + i * 36},70%,55%), hsl(${20 + i * 36},60%,60%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.9)" }}>▶</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.channelName || "—"}</div>
                    <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{c.watchCount?.toLocaleString?.() ?? 0} video{c.watchCount !== 1 ? "s" : ""}</div>
                  </div>
                  <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(c.totalMinutes).toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
                </div>
              ))}</Card>
              <Sec icon="🎬">Top videos (Takeout)</Sec>
              <Card>{(youtubeTakeout.video_rankings_json || []).slice(0, 10).map((v, i) => {
                const displayTitle = (v.title || "").replace(/^Watched\s+/i, "").trim() || "Unknown";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, (youtubeTakeout.video_rankings_json || []).length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                    <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${260 + i * 8},65%,${50 + i * 4}%), hsl(${270 + i * 10},55%,${60 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "rgba(255,255,255,0.9)" }}>♪</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayTitle}</div>
                      <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{v.channelName || ""}{v.watchCount > 1 ? ` · ${v.watchCount} views` : ""}</div>
                    </div>
                    <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(v.totalMinutes).toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
                  </div>
                );
              })}</Card>
            </>
          )}
        </>
      )}

      {/* Platform usage */}
      <Sec icon="📊" onToggle={() => setUsageOpen((v) => !v)} isOpen={usageOpen}>Platform Usage</Sec>
      {usageOpen && (
        <Card>
          {data && (
          <div style={{ padding: "16px 20px", borderBottom: youtube ? "1px solid rgba(13,148,136,0.12)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14, gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1DB954", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>♫</div>
              <span style={{ flex: 1, fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>Spotify</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginBottom: 12 }}>Retroactive only (from your export). No live tracking.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontFamily: F, fontSize: 13, color: "#1e1b4b" }}>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total hours</span><span style={{ fontWeight: 600, textAlign: "right" }}>{data.totalHours.toLocaleString()}</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total minutes</span><span style={{ fontWeight: 600, textAlign: "right" }}>{Math.round(data.totalHours * 60).toLocaleString()}</span>
              {data.startDate && data.endDate && <><span style={{ color: "rgba(55,48,107,0.55)" }}>Years in data</span><span style={{ fontWeight: 600, textAlign: "right" }}>{(Math.round((new Date(data.endDate) - new Date(data.startDate)) / (365.25 * 24 * 3600 * 1000) * 10) / 10)}</span></>}
            </div>
            {data.startDate && data.endDate && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(13,148,136,0.12)", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.55)" }}>
                <span>Average minutes per day </span>
                <strong style={{ color: "#1e1b4b", fontSize: 15 }}>{Math.round((data.totalHours * 60) / Math.max(1, (new Date(data.endDate) - new Date(data.startDate)) / (24 * 3600 * 1000)))}</strong>
              </div>
            )}
          </div>
          )}
          {youtube && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: youtube && data ? 14 : 0, gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>▶</div>
              <span style={{ flex: 1, fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>YouTube</span>
            </div>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginBottom: 12 }}>From your connected account (subscriptions, playlists, likes). Refresh to update.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontFamily: F, fontSize: 13, color: "#1e1b4b" }}>
              {youtubeTakeout && youtubeTakeout.video_count > 0 && (
                <>
                  <span style={{ color: "rgba(55,48,107,0.55)" }}>Total watch time</span><span style={{ fontWeight: 600, textAlign: "right" }}>{Math.round(youtubeTakeout.total_watch_minutes).toLocaleString()} min</span>
                  <span style={{ color: "rgba(55,48,107,0.55)" }}>Total videos watched</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtubeTakeout.video_count.toLocaleString()}</span>
                </>
              )}
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total subscriptions</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtube.subscription_count ?? 0}</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total playlists</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtube.playlist_count ?? 0}</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Liked videos (cached)</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtube.liked_count ?? 0}</span>
            </div>
          </div>
          )}
          {youtubeTakeout && !youtube && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(13,148,136,0.12)" }}>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginBottom: 8 }}>From Takeout import (no YouTube connected)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontFamily: F, fontSize: 13, color: "#1e1b4b" }}>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total watch time</span><span style={{ fontWeight: 600, textAlign: "right" }}>{Math.round(youtubeTakeout.total_watch_minutes).toLocaleString()} min</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total videos watched</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtubeTakeout.video_count.toLocaleString()}</span>
            </div>
          </div>
          )}
          {!data && !youtube && (
          <div style={{ padding: "16px 20px", fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.55)" }}>Connect Spotify (upload) or YouTube above to see platform stats here.</div>
          )}
        </Card>
      )}

      {data && insightsModal && (
        <InsightsModal mode={insightsModal} data={data} onClose={() => setInsightsModal(null)} />
      )}

      {youtube && youtubeViewAllOpen && (
        <YouTubeViewAllModal
          onClose={() => setYoutubeViewAllOpen(false)}
          rankedSubs={rankedSubs}
          playlists={playlists}
          likedVideos={likedVideos}
          youtubeTakeout={youtubeTakeout}
          takeoutInputRef={takeoutInputRef}
          onYoutubeTakeoutImport={onYoutubeTakeoutImport}
          onTakeoutFileChange={handleTakeoutFile}
          takeoutImporting={takeoutImporting}
        />
      )}
    </div>
  );
}

// --- YouTube View All modal: subscriptions, playlists, watch history, liked videos, watch time by month (no pie chart) ---
function YouTubeViewAllModal({ onClose, rankedSubs, playlists, likedVideos, youtubeTakeout, takeoutInputRef, onYoutubeTakeoutImport, onTakeoutFileChange, takeoutImporting }) {
  const trend = youtubeTakeout?.watch_trend_json || [];
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "90vh", background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(13,148,136,0.12)" }}>
          <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>YouTube — View All</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflow: "auto", padding: "16px 20px", flex: 1 }}>
          {/* Subscriptions (ranked by your likes) */}
          {rankedSubs?.length > 0 && (
            <>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>📌 Subscriptions (ranked by your likes)</div>
              <div style={{ marginBottom: 20, border: "1px solid rgba(13,148,136,0.15)", borderRadius: 12, overflow: "hidden" }}>
                {rankedSubs.map((s, i) => (
                  <div key={s.channelId || i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < rankedSubs.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "rgba(55,48,107,0.4)", width: 24, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                      {s.likedCount != null && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{s.likedCount} liked video{s.likedCount !== 1 ? "s" : ""}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Playlists */}
          {playlists?.length > 0 && (
            <>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>📁 Playlists</div>
              <div style={{ marginBottom: 20, border: "1px solid rgba(13,148,136,0.15)", borderRadius: 12, overflow: "hidden" }}>
                {playlists.map((p, i) => (
                  <div key={p.id || i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < playlists.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{p.itemCount ?? 0} items</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Watch history (Takeout) */}
          <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>📥 Watch history (Takeout)</div>
          <div style={{ marginBottom: 20, padding: "14px 16px", background: "rgba(13,148,136,0.06)", borderRadius: 12, border: "1px solid rgba(13,148,136,0.15)" }}>
            <input ref={takeoutInputRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={onTakeoutFileChange || (() => {})} />
            {!youtubeTakeout ? (
              <>
                <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.7)", marginBottom: 12 }}>Import your YouTube watch history from Google Takeout (JSON).</div>
                {onYoutubeTakeoutImport && <button type="button" onClick={() => takeoutInputRef.current?.click()} disabled={takeoutImporting} style={{ width: "100%", padding: "10px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: takeoutImporting ? "wait" : "pointer" }}>{takeoutImporting ? "Importing…" : "Import from Takeout"}</button>}
              </>
            ) : (
              <>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{youtubeTakeout.video_count.toLocaleString()} videos · {Math.round(youtubeTakeout.total_watch_minutes).toLocaleString()} min</div>
                <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.55)", marginTop: 4 }}>Imported {youtubeTakeout.imported_at ? new Date(youtubeTakeout.imported_at).toLocaleDateString() : ""}</div>
                {onYoutubeTakeoutImport && <button type="button" onClick={() => takeoutInputRef.current?.click()} disabled={takeoutImporting} style={{ marginTop: 10, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.1)", color: "#0d9488", fontFamily: F, fontSize: 12, fontWeight: 600, cursor: takeoutImporting ? "wait" : "pointer" }}>{takeoutImporting ? "Importing…" : "Re-import Takeout"}</button>}
              </>
            )}
          </div>

          {/* Recent liked videos */}
          {likedVideos?.length > 0 && (
            <>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>👍 Recent liked videos</div>
              <div style={{ marginBottom: 20, border: "1px solid rgba(13,148,136,0.15)", borderRadius: 12, overflow: "hidden" }}>
                {likedVideos.map((v, i) => (
                  <div key={v.videoId || i} style={{ padding: "10px 14px", borderBottom: i < likedVideos.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                    <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{v.channelTitle}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Watch time by month */}
          {trend.length > 0 && (
            <>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>📈 Watch time by month</div>
              <div style={{ border: "1px solid rgba(13,148,136,0.15)", borderRadius: 12, overflow: "hidden" }}>
                {trend.map((row, i) => {
                  const [y, m] = (row.month || "").split("-");
                  const monthLabel = y && m ? new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : row.month;
                  const maxMin = Math.max(1, ...trend.map((r) => r.minutes || 0));
                  const pct = Math.min(100, ((row.minutes || 0) / maxMin) * 100);
                  return (
                    <div key={i} style={{ padding: "10px 14px", borderBottom: i < trend.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: "#1e1b4b" }}>{monthLabel}</span>
                        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#0f766e" }}>{Math.round(row.minutes || 0).toLocaleString()} min</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(13,148,136,0.12)", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #0d9488, #10b981)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!rankedSubs?.length && !playlists?.length && !likedVideos?.length && !youtubeTakeout && trend.length === 0 && (
            <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>Connect YouTube and import Takeout to see data here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Insights modal (View All): line graphs + time/top-N filters + tables (no pie, no bio) ---
const LINE_COLORS = ["#0d9488", "#10b981", "#059669", "#0f766e", "#134e4a", "#34d399", "#6ee7b7", "#14b8a6", "#5eead4", "#99f6e4", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b"];

function getAllMonthsFromData(minutesByMonth) {
  const set = new Set();
  for (const obj of Object.values(minutesByMonth || {})) {
    if (obj && typeof obj === "object") Object.keys(obj).forEach((m) => set.add(m));
  }
  return Array.from(set).sort();
}

function getMonthsInRange(allMonths, timePeriod) {
  if (!timePeriod || timePeriod === "all") return allMonths;
  return allMonths.filter((m) => m.startsWith(String(timePeriod)));
}

function sumMinutesInMonths(byMonth, monthsInRange) {
  if (!byMonth || !monthsInRange.length) return 0;
  return monthsInRange.reduce((s, m) => s + (byMonth[m] || 0), 0);
}

function SpotifyLineBlock({ title, topItems, minutesByMonth, getKey, getLabel, getSublabel, timePeriod, setTimePeriod, topN, setTopN }) {
  const allMonths = getAllMonthsFromData(minutesByMonth);
  const years = [...new Set(allMonths.map((m) => m.split("-")[0]))].sort((a, b) => Number(b) - Number(a));
  const periodOptions = [{ value: "all", label: "All time" }, ...years.map((y) => ({ value: y, label: y }))];
  const monthsInRange = getMonthsInRange(allMonths, timePeriod);
  const topNVal = topN || 10;
  const topNOptions = [10, 20, 30, 40, 50];

  const hasMonthlyData = allMonths.length > 0;
  const tableItems = (topItems || []).slice(0, 50).map((item) => {
    const key = getKey(item);
    const byMonth = (minutesByMonth || {})[key] || {};
    const minutesInPeriod = hasMonthlyData ? sumMinutesInMonths(byMonth, monthsInRange) : (item.hours != null ? item.hours * 60 : 0);
    return { ...item, key, minutesInPeriod };
  });

  const maxY = Math.max(1, ...tableItems.slice(0, topNVal).flatMap((item) => {
    const byMonth = (minutesByMonth || {})[item.key] || {};
    return monthsInRange.map((m) => byMonth[m] || 0);
  }));

  const chartW = 360;
  const chartH = 180;
  const pad = { left: 32, right: 12, top: 8, bottom: 28 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  const linesToShow = tableItems.slice(0, topNVal);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>{title}</div>
      {!hasMonthlyData && (
        <div style={{ padding: "12px 14px", background: "rgba(13,148,136,0.06)", borderRadius: 12, fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.7)", marginBottom: 12 }}>
          Re-upload your Spotify history to see the line graph and filter by time period.
        </div>
      )}
      {(hasMonthlyData ? (
        <>
          <div style={{ width: "100%", maxWidth: chartW, height: chartH, marginBottom: 12 }}>
            <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
              {/* Y axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                const y = pad.top + innerH * (1 - p);
                const val = Math.round(maxY * p);
                return (
                  <text key={p} x={pad.left - 6} y={y + 4} textAnchor="end" fontFamily={F} fontSize={10} fill="rgba(55,48,107,0.5)">{val}</text>
                );
              })}
              {/* X axis labels (months) */}
              {monthsInRange.length > 0 && monthsInRange.map((m, i) => {
                const x = pad.left + (innerW * (i + 0.5)) / monthsInRange.length;
                const [, monthNum] = m.split("-");
                const short = new Date(2000, Number(monthNum) - 1, 1).toLocaleDateString("en-US", { month: "short" });
                return (
                  <text key={m} x={x} y={chartH - 6} textAnchor="middle" fontFamily={F} fontSize={9} fill="rgba(55,48,107,0.5)">{short}</text>
                );
              })}
              {/* Lines */}
              {linesToShow.map((item, idx) => {
                const byMonth = (minutesByMonth || {})[item.key] || {};
                const points = monthsInRange.map((m, i) => {
                  const x = pad.left + (innerW * (i + 0.5)) / monthsInRange.length;
                  const v = byMonth[m] || 0;
                  const y = maxY > 0 ? pad.top + innerH * (1 - v / maxY) : pad.top + innerH;
                  return `${x},${y}`;
                });
                if (points.length < 2) return null;
                return (
                  <polyline
                    key={item.key}
                    points={points.join(" ")}
                    fill="none"
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}
            </svg>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.7)" }}>Time period:</span>
              <select
                value={timePeriod || "all"}
                onChange={(e) => setTimePeriod(e.target.value)}
                style={{ fontFamily: F, fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.3)", background: "#fff", color: "#1e1b4b" }}
              >
                {periodOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.7)" }}>Top:</span>
              <select
                value={topNVal}
                onChange={(e) => setTopN(Number(e.target.value))}
                style={{ fontFamily: F, fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(13,148,136,0.3)", background: "#fff", color: "#1e1b4b" }}
              >
                {topNOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      ) : null)}
      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>{hasMonthlyData ? "Top 50 (minutes in selected period)" : "Top 50 (all-time minutes)"}</div>
      <div style={{ maxHeight: 240, overflow: "auto", border: "1px solid rgba(13,148,136,0.15)", borderRadius: 12 }}>
        {tableItems.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < tableItems.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "rgba(55,48,107,0.4)", width: 24, textAlign: "right" }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getLabel(item)}</div>
              {getSublabel && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{getSublabel(item)}</div>}
            </div>
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "#0f766e" }}>{Math.round(item.minutesInPeriod)} min</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsModal({ mode, data, onClose }) {
  const [artistTimePeriod, setArtistTimePeriod] = useState("all");
  const [artistTopN, setArtistTopN] = useState(10);
  const [trackTimePeriod, setTrackTimePeriod] = useState("all");
  const [trackTopN, setTrackTopN] = useState(10);

  const top50Artists = (data?.topArtists ?? []).slice(0, 50);
  const top50Tracks = (data?.topTracks ?? []).slice(0, 50);
  const artistMinutesByMonth = data?.artistMinutesByMonth ?? {};
  const trackMinutesByMonth = data?.trackMinutesByMonth ?? {};
  const trackKey = (t) => `${t.name}|||${t.artist}|||${t.album || ""}`;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "90vh", background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(13,148,136,0.12)" }}>
          <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>Spotify — View All</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflow: "auto", padding: "16px 20px", flex: 1 }}>
          <SpotifyLineBlock
            title="Listening over time — Top Artists"
            topItems={top50Artists}
            minutesByMonth={artistMinutesByMonth}
            getKey={(a) => a.name}
            getLabel={(a) => a.name}
            timePeriod={artistTimePeriod}
            setTimePeriod={setArtistTimePeriod}
            topN={artistTopN}
            setTopN={setArtistTopN}
          />
          <SpotifyLineBlock
            title="Listening over time — Top Songs"
            topItems={top50Tracks}
            minutesByMonth={trackMinutesByMonth}
            getKey={trackKey}
            getLabel={(t) => t.name}
            getSublabel={(t) => t.artist}
            timePeriod={trackTimePeriod}
            setTimePeriod={setTrackTimePeriod}
            topN={trackTopN}
            setTopN={setTrackTopN}
          />
        </div>
      </div>
    </div>
  );
}
