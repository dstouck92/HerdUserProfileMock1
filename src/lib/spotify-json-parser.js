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

  for (const fileData of filesContent) {
    const rows = toRecordArray(fileData);
    for (const r of rows) {
      const artist = r.master_metadata_album_artist_name;
      const track = r.master_metadata_track_name;
      const album = r.master_metadata_album_album_name;
      const ms = typeof r.ms_played === "number" ? r.ms_played : 0;
      // Only skip rows that don't have a track + artist; count all listening time
      if (!artist || !track) continue;

      totalMs += ms;
      totalRecords++;

      if (!artistStats[artist]) artistStats[artist] = { total_ms: 0, play_count: 0 };
      artistStats[artist].total_ms += ms;
      artistStats[artist].play_count++;

      const tk = `${track}|||${artist}|||${album || ""}`;
      if (!trackStats[tk]) trackStats[tk] = { track, artist, album, total_ms: 0, play_count: 0 };
      trackStats[tk].total_ms += ms;
      trackStats[tk].play_count++;
    }
  }

  return {
    totalHours: Math.round((totalMs / 3600000) * 10) / 10,
    totalRecords,
    uniqueArtists: Object.keys(artistStats).length,
    uniqueTracks: Object.keys(trackStats).length,
    topArtists: Object.entries(artistStats)
      .map(([name, s]) => ({
        name,
        hours: Math.round(s.total_ms / 3600000 * 10) / 10,
        plays: s.play_count,
      }))
      .sort((a, b) => b.hours - a.hours),
    topTracks: Object.values(trackStats)
      .sort((a, b) => b.play_count - a.play_count)
      .map((t) => ({
        name: t.track,
        artist: t.artist,
        album: t.album,
        plays: t.play_count,
        hours: Math.round(t.total_ms / 3600000 * 10) / 10,
      })),
  };
}
