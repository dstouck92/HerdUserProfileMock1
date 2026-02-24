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
      <Sec icon="▶️" onToggle={() => setYoutubeOpen((v) => !v)} isOpen={youtubeOpen}>YouTube</Sec>
      {youtubeOpen && (
        <>
          {!youtube ? (
            <Card style={{ padding: "20px" }}>
              <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.7)", marginBottom: 14 }}>Connect your YouTube account to see subscriptions, playlists, and liked videos. Data is cached and you can refresh anytime.</div>
              {onYoutubeConnect && <Btn onClick={onYoutubeConnect}>Connect YouTube</Btn>}
            </Card>
          ) : (
            <>
              <Card style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{youtube.youtube_channel_title || "YouTube"}</div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.55)" }}>Subscriptions: {youtube.subscription_count} · Playlists: {youtube.playlist_count} · Likes: {youtube.liked_count}</div>
                    {youtube.last_fetched_at && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)", marginTop: 4 }}>Last synced: {new Date(youtube.last_fetched_at).toLocaleDateString()}</div>}
                  </div>
                  {onYoutubeSync && <button type="button" onClick={handleRefresh} disabled={youtubeSyncing} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.1)", color: "#0d9488", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: youtubeSyncing ? "wait" : "pointer" }}>{youtubeSyncing ? "Refreshing…" : "Refresh"}</button>}
                </div>
              </Card>
              {rankedSubs.length > 0 && (
                <>
                  <Sec icon="📌">Subscriptions (ranked by your likes)</Sec>
                  <Card>{rankedSubs.slice(0, 10).map((s, i) => (
                    <div key={s.channelId || i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, rankedSubs.length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</div>
                        {s.likedCount != null && <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{s.likedCount} liked video{s.likedCount !== 1 ? "s" : ""}</div>}
                      </div>
                    </div>
                  ))}</Card>
                </>
              )}
              {likedVideos.length > 0 && (
                <>
                  <Sec icon="👍">Recent liked videos</Sec>
                  <Card>{likedVideos.slice(0, 8).map((v, i) => (
                    <div key={v.videoId || i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(7, likedVideos.length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{v.channelTitle}</div>
                      </div>
                    </div>
                  ))}</Card>
                </>
              )}
              {playlists.length > 0 && playlists.length <= 15 && (
                <>
                  <Sec icon="📁">Playlists</Sec>
                  <Card>{playlists.slice(0, 10).map((p, i) => (
                    <div key={p.id || i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, playlists.length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{p.itemCount ?? 0} items</div>
                      </div>
                    </div>
                  ))}</Card>
                </>
              )}
            </>
          )}

          {/* YouTube Takeout: watch history import */}
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

          {/* Takeout rankings and trend (after re-import, data comes from new columns) */}
          {(youtubeTakeout?.channel_rankings_json?.length > 0 || youtubeTakeout?.video_rankings_json?.length > 0 || youtubeTakeout?.watch_trend_json?.length > 0) && (
            <>
              {youtubeTakeout.channel_rankings_json?.length > 0 && (
                <>
                  <Sec icon="📺">Top channels (Takeout)</Sec>
                  <Card>{(youtubeTakeout.channel_rankings_json || []).slice(0, 10).map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, (youtubeTakeout.channel_rankings_json || []).length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${0 + i * 36},70%,55%), hsl(${20 + i * 36},60%,60%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "rgba(255,255,255,0.9)" }}>▶</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.channelName || "Unknown"}</div>
                        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{c.watchCount?.toLocaleString?.() ?? 0} video{c.watchCount !== 1 ? "s" : ""}</div>
                      </div>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(c.totalMinutes).toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
                    </div>
                  ))}</Card>
                </>
              )}
              {youtubeTakeout.video_rankings_json?.length > 0 && (
                <>
                  <Sec icon="🎬">Top videos (Takeout)</Sec>
                  <Card>{(youtubeTakeout.video_rankings_json || []).slice(0, 10).map((v, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 20px", gap: 12, borderBottom: i < Math.min(9, (youtubeTakeout.video_rankings_json || []).length - 1) ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "rgba(55,48,107,0.35)", width: 18, textAlign: "right" }}>{i + 1}</span>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, hsl(${260 + i * 8},65%,${50 + i * 4}%), hsl(${270 + i * 10},55%,${60 + i * 3}%))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "rgba(255,255,255,0.9)" }}>♪</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.title || "Unknown"}</div>
                        <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.45)" }}>{v.channelName || ""}{v.watchCount > 1 ? ` · ${v.watchCount} views` : ""}</div>
                      </div>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(v.totalMinutes).toLocaleString()} <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(55,48,107,0.45)" }}>min</span></span>
                    </div>
                  ))}</Card>
                </>
              )}
              {youtubeTakeout.watch_trend_json?.length > 0 && (
                <>
                  <Sec icon="📈">Watch time over time</Sec>
                  <Card>
                    {(youtubeTakeout.watch_trend_json || []).map((row, i) => {
                      const [y, m] = (row.month || "").split("-");
                      const monthLabel = y && m ? new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : row.month;
                      const maxMin = Math.max(1, ...(youtubeTakeout.watch_trend_json || []).map((r) => r.minutes || 0));
                      const pct = Math.min(100, ((row.minutes || 0) / maxMin) * 100);
                      return (
                        <div key={i} style={{ padding: "10px 20px", borderBottom: i < (youtubeTakeout.watch_trend_json || []).length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>{monthLabel}</span>
                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{Math.round(row.minutes || 0).toLocaleString()} min</span>
                          </div>
                          <div style={{ height: 8, borderRadius: 4, background: "rgba(13,148,136,0.12)", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #0d9488, #10b981)", transition: "width 0.2s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                </>
              )}
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
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Top artist</span><span style={{ fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.topArtists[0]?.name ?? "—"}</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Top track</span><span style={{ fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.topTracks[0]?.name ?? "—"}</span>
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
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total subscriptions</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtube.subscription_count ?? 0}</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total playlists</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtube.playlist_count ?? 0}</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Liked videos (cached)</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtube.liked_count ?? 0}</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Channel</span><span style={{ fontWeight: 600, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{youtube.youtube_channel_title ?? "—"}</span>
              {youtubeTakeout && youtubeTakeout.video_count > 0 && (
                <>
                  <span style={{ color: "rgba(55,48,107,0.55)" }}>Total watch time (Takeout)</span><span style={{ fontWeight: 600, textAlign: "right" }}>{Math.round(youtubeTakeout.total_watch_minutes).toLocaleString()} min</span>
                  <span style={{ color: "rgba(55,48,107,0.55)" }}>Videos in Takeout</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtubeTakeout.video_count.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          )}
          {youtubeTakeout && !youtube && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(13,148,136,0.12)" }}>
            <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginBottom: 8 }}>From Takeout import (no YouTube connected)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", fontFamily: F, fontSize: 13, color: "#1e1b4b" }}>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Total watch time (Takeout)</span><span style={{ fontWeight: 600, textAlign: "right" }}>{Math.round(youtubeTakeout.total_watch_minutes).toLocaleString()} min</span>
              <span style={{ color: "rgba(55,48,107,0.55)" }}>Videos in Takeout</span><span style={{ fontWeight: 600, textAlign: "right" }}>{youtubeTakeout.video_count.toLocaleString()}</span>
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
    </div>
  );
}

// --- Insights modal (View All): pie chart, averages, vibe, top 50 list ---
const PIE_COLORS = ["#0d9488", "#10b981", "#34d399", "#6ee7b7", "#14b8a6", "#0d9488", "#94a3b8"];
function InsightsModal({ mode, data, onClose }) {
  const totalMinutes = data.totalHours * 60;
  const musicMinutes = data.topArtists.reduce((s, a) => s + a.hours * 60, 0);
  const top50Artists = data.topArtists.slice(0, 50);
  const top50Tracks = data.topTracks.slice(0, 50);

  // Pie: top 6 artists or top 6 tracks by listen time (music only so % add up)
  const pieSlices = mode === "artists"
    ? top50Artists.slice(0, 6).map((a) => ({ label: a.name, value: a.hours * 60 }))
    : top50Tracks.slice(0, 6).map((t) => ({ label: t.name, value: t.hours * 60 }));
  const sliceSum = pieSlices.reduce((s, x) => s + x.value, 0);
  const otherMinutes = Math.max(0, musicMinutes - sliceSum);
  if (otherMinutes > 0) pieSlices.push({ label: "Other", value: otherMinutes });
  const totalPie = pieSlices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const conicParts = pieSlices.map((s, i) => {
    const pct = (s.value / totalPie) * 100;
    const start = acc;
    acc += pct;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${acc}%`;
  });
  const conicGradient = `conic-gradient(${conicParts.join(", ")})`;

  const avgMinPerArtist = data.topArtists.length ? totalMinutes / data.uniqueArtists : 0;
  const avgPlaysPerTrack = data.topTracks.length ? data.topTracks.reduce((s, t) => s + t.plays, 0) / data.uniqueTracks : 0;
  const topShare = data.topArtists[0] && musicMinutes > 0 ? (data.topArtists[0].hours * 60 / musicMinutes) * 100 : 0;
  const vibeText = topShare > 15 ? "You're loyal to a few favorites — when you love an artist, you really go deep." : data.uniqueArtists > 500 ? "Eclectic listener — you explore widely across many artists and sounds." : "Your taste spans a solid mix of go-tos and discovery.";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(30,27,75,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "90vh", background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(13,148,136,0.12)" }}>
          <span style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{mode === "artists" ? "Artist Insights" : "Song Insights"}</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#94a3b8", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflow: "auto", padding: "16px 20px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
            <div style={{ width: 140, height: 140, borderRadius: "50%", background: conicGradient, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {pieSlices.slice(0, 7).map((s, i) => (
                <div key={i} style={{ fontFamily: F, fontSize: 12, color: "#1e1b4b", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                  <span style={{ color: "rgba(55,48,107,0.5)", marginLeft: "auto" }}>{((s.value / totalPie) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(13,148,136,0.08)", borderRadius: 12, fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.8)" }}>
            <strong style={{ color: "#0f766e" }}>Averages:</strong> {Math.round(avgMinPerArtist)} min per artist · {avgPlaysPerTrack.toFixed(0)} plays per track (music). Based on your exported history (retroactive only).
          </div>
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(236,72,153,0.06)", borderRadius: 12, fontFamily: F, fontSize: 13, color: "#1e1b4b", fontStyle: "italic" }}>
            {vibeText}
          </div>
          <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>Top 50 {mode === "artists" ? "Artists" : "Songs"}</div>
          <div style={{ maxHeight: 280, overflow: "auto", border: "1px solid rgba(13,148,136,0.15)", borderRadius: 12 }}>
            {mode === "artists"
              ? top50Artists.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < top50Artists.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "rgba(55,48,107,0.4)", width: 24, textAlign: "right" }}>{i + 1}</span>
                    <span style={{ flex: 1, fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "#0f766e" }}>{Math.round(a.hours * 60)} min</span>
                  </div>
                ))
              : top50Tracks.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < top50Tracks.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: "rgba(55,48,107,0.4)", width: 24, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                      <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.5)" }}>{t.artist}</div>
                    </div>
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "#0f766e" }}>{Math.round(t.hours * 60)} min</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
