/**
 * Parse Spotify Extended Streaming History JSON into aggregate stats.
 * Accepts: raw array of records, or object with a key containing the array.
 * Schema per record: ts, ms_played, master_metadata_track_name,
 * master_metadata_album_artist_name, master_metadata_album_album_name, etc.
 * Files: Streaming_History_Audio_YYYY-YYYY_N.json (or similar from export ZIP).
 */

function toRecordArray(fileData) {
  if (Array.isArray(fileData)) return fileData;
  if (fileData && typeof fileData === "object") {
    for (const key of Object.keys(fileData)) {
      const val = fileData[key];
      if (Array.isArray(val) && val.length > 0 && val[0] != null && typeof val[0] === "object") {
        const first = val[0];
        if ("ms_played" in first || "ts" in first || "master_metadata_track_name" in first) return val;
      }
    }
  }
  return [];
}

export function parseSpotifyFiles(filesContent) {
  const artistStats = {};
  const trackStats = {};
  let totalMs = 0;
  let totalRecords = 0;
  let firstTs = null;
  let lastTs = null;

  for (const fileData of filesContent) {
    const rows = toRecordArray(fileData);
    for (const r of rows) {
      if (r.ts) {
        const t = new Date(r.ts).getTime();
        if (firstTs == null || t < firstTs) firstTs = t;
        if (lastTs == null || t > lastTs) lastTs = t;
      }
      const artist = r.master_metadata_album_artist_name;
      const track = r.master_metadata_track_name;
      const album = r.master_metadata_album_album_name;
      const ms = typeof r.ms_played === "number" ? r.ms_played : 0;

      // Count every row toward total (music + podcast + audiobook + video) so totals match export
      totalMs += ms;
      totalRecords++;

      // Top artists/tracks: music only (rows with track + artist)
      if (!artist || !track) continue;

      const monthKey = r.ts ? (() => {
        const d = new Date(r.ts);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return `${y}-${String(m).padStart(2, "0")}`;
      })() : null;

      if (!artistStats[artist]) artistStats[artist] = { total_ms: 0, play_count: 0, byMonth: {} };
      artistStats[artist].total_ms += ms;
      artistStats[artist].play_count++;
      if (monthKey) {
        const min = ms / 60000;
        artistStats[artist].byMonth[monthKey] = (artistStats[artist].byMonth[monthKey] || 0) + min;
      }

      const tk = `${track}|||${artist}|||${album || ""}`;
      if (!trackStats[tk]) trackStats[tk] = { track, artist, album, total_ms: 0, play_count: 0, byMonth: {} };
      trackStats[tk].total_ms += ms;
      trackStats[tk].play_count++;
      if (monthKey) {
        const min = ms / 60000;
        trackStats[tk].byMonth[monthKey] = (trackStats[tk].byMonth[monthKey] || 0) + min;
      }
    }
  }

  const artistMinutesByMonth = {};
  for (const [name, s] of Object.entries(artistStats)) {
    if (s.byMonth && Object.keys(s.byMonth).length) artistMinutesByMonth[name] = s.byMonth;
  }
  const trackMinutesByMonth = {};
  for (const [tk, s] of Object.entries(trackStats)) {
    if (s.byMonth && Object.keys(s.byMonth).length) trackMinutesByMonth[tk] = s.byMonth;
  }

  return {
    totalHours: Math.round((totalMs / 3600000) * 10) / 10,
    totalRecords,
    uniqueArtists: Object.keys(artistStats).length,
    uniqueTracks: Object.keys(trackStats).length,
    startDate: firstTs != null ? new Date(firstTs).toISOString() : null,
    endDate: lastTs != null ? new Date(lastTs).toISOString() : null,
    artistMinutesByMonth,
    trackMinutesByMonth,
    topArtists: Object.entries(artistStats)
      .map(([name, s]) => ({
        name,
        hours: Math.round(s.total_ms / 3600000 * 10) / 10,
        plays: s.play_count,
      }))
      .sort((a, b) => b.hours - a.hours),
    // Top tracks ranked by total listening time (minutes), not just play count,
    // so the visual ranking matches the minutes column in the UI.
    topTracks: Object.values(trackStats)
      .sort((a, b) => {
        const byMs = b.total_ms - a.total_ms;
        if (byMs !== 0) return byMs;
        return b.play_count - a.play_count;
      })
      .map((t) => ({
        name: t.track,
        artist: t.artist,
        album: t.album,
        plays: t.play_count,
        hours: Math.round((t.total_ms / 3600000) * 10) / 10,
      })),
  };
}
