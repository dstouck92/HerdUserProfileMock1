import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { GradientBg } from "./components/ui";
import AuthScreen from "./components/AuthScreen";
import SpotifyUploadModal from "./components/SpotifyUploadModal";
import AddConcertModal from "./components/AddConcertModal";
import EditConcertModal from "./components/EditConcertModal";
import AddItemModal from "./components/AddItemModal";
import LiveTab from "./components/tabs/LiveTab";
import DigitalTab from "./components/tabs/DigitalTab";
import PhysicalTab from "./components/tabs/PhysicalTab";
import CurateTab from "./components/tabs/CurateTab";
import { TabBar, ProfileHeader, F } from "./components/ui";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [activeTab, setActiveTab] = useState("Curate");
  const [streamingData, setStreamingData] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [vinyl, setVinyl] = useState([]);
  const [merch, setMerch] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showConcert, setShowConcert] = useState(false);
  const [editingConcert, setEditingConcert] = useState(null);
  const [showVinyl, setShowVinyl] = useState(false);
  const [showMerch, setShowMerch] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [youtubeData, setYoutubeData] = useState(null);
  const [youtubeTakeout, setYoutubeTakeout] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let cancelled = false;
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          try {
            const { data: profile } = await supabase.from("profiles").select("id, display_name, username, avatar_id").eq("id", session.user.id).single();
            if (!cancelled) setUser(profile ? { ...profile, avatar_id: profile.avatar_id ?? 7 } : { id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user", avatar_id: 7 });
          } catch (_) {
            if (!cancelled) setUser({ id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user", avatar_id: 7 });
          }
        }
      } catch (_) {
        // network error: user stays on login
      }
      if (!cancelled) setAuthLoading(false);
    };
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        setUser(null);
        setConcerts([]);
        setVinyl([]);
        setMerch([]);
        setStreamingData(null);
        return;
      }
      const fallback = { id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user", avatar_id: 7 };
      const { data: profile } = await supabase.from("profiles").select("id, display_name, username, avatar_id").eq("id", session.user.id).single();
      setUser(profile && profile.id ? { ...profile, avatar_id: profile.avatar_id ?? 7 } : fallback);
    });
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const uid = user.id;
    (async () => {
      const [cRes, vRes, mRes, sRes, yRes, takeoutRes] = await Promise.all([
        supabase.from("concerts").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("vinyl").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("merch").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("user_streaming_stats").select("*").eq("user_id", uid).single(),
        supabase.from("user_youtube").select("user_id, youtube_channel_id, youtube_channel_title, herd_display_name, herd_email, herd_phone, subscription_count, playlist_count, liked_count, subscriptions_json, playlists_json, liked_videos_json, subscriptions_ranked_by_likes_json, featured_youtube_channels, last_fetched_at").eq("user_id", uid).maybeSingle(),
        supabase.from("user_youtube_takeout").select("user_id, watch_history_json, video_count, total_watch_minutes, imported_at, channel_rankings_json, video_rankings_json, watch_trend_json").eq("user_id", uid).maybeSingle(),
      ]);
      if (cRes.data) {
        setConcerts(
          cRes.data.map((r) => ({
            id: r.id,
            artist: r.artist,
            tour: r.tour,
            date: r.date,
            venue: r.venue,
            city: r.city,
            ticket_type: r.ticket_type,
            ticket_price: r.ticket_price,
            source: r.source,
            is_featured: r.is_featured ?? false,
          })),
        );
      }
      if (vRes.data) {
        setVinyl(
          vRes.data.map((r) => ({
            id: r.id,
            artist_name: r.artist_name,
            album_name: r.album_name,
            is_limited_edition: r.is_limited_edition,
            is_featured: r.is_featured ?? false,
          })),
        );
      }
      if (mRes.data) {
        setMerch(
          mRes.data.map((r) => ({
            id: r.id,
            artist_name: r.artist_name,
            item_name: r.item_name,
            merch_type: r.merch_type,
            is_tour_merch: r.is_tour_merch,
            tour_name: r.tour_name,
            purchase_price: r.purchase_price,
            purchase_location: r.purchase_location,
            is_featured: r.is_featured ?? false,
          })),
        );
      }
      if (yRes.data?.user_id) setYoutubeData(yRes.data);
      else setYoutubeData(null);
      if (takeoutRes.data?.user_id) setYoutubeTakeout(takeoutRes.data);
      else setYoutubeTakeout(null);
      if (sRes.data?.user_id) {
        const s = sRes.data;
        let featuredArtists = s.featured_artists ?? [];
        if (featuredArtists.length === 0 && (s.top_artists ?? []).length > 0) {
          featuredArtists = [s.top_artists[0]];
          await supabase.from("user_streaming_stats").update({ featured_artists: featuredArtists }).eq("user_id", uid);
        }
        setStreamingData({
          totalHours: s.total_hours ?? 0,
          totalRecords: s.total_records ?? 0,
          uniqueArtists: s.unique_artists ?? 0,
          uniqueTracks: s.unique_tracks ?? 0,
          topArtists: s.top_artists ?? [],
          topTracks: s.top_tracks ?? [],
          featuredArtists,
          featuredTracks: s.featured_tracks ?? [],
          startDate: s.start_date ?? null,
          endDate: s.end_date ?? null,
        });
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    const youtube = searchParams.get("youtube");
    if (youtube === "connected") {
      setActiveTab("Digital");
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete("youtube"); next.delete("tab"); return next; }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleYoutubeConnect = async () => {
    const { data: { session } } = await supabase?.auth.getSession() ?? {};
    if (!session?.access_token) return;
    const res = await fetch("/api/auth/youtube", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: session.access_token }) });
    if (!res.ok) return;
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  const handleYoutubeSync = async () => {
    const { data: { session } } = await supabase?.auth.getSession() ?? {};
    if (!session?.access_token || !user?.id) return;
    const res = await fetch("/api/youtube/sync", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!res.ok) return;
    const { data } = await supabase.from("user_youtube").select("user_id, youtube_channel_id, youtube_channel_title, herd_display_name, herd_email, herd_phone, subscription_count, playlist_count, liked_count, subscriptions_json, playlists_json, liked_videos_json, subscriptions_ranked_by_likes_json, last_fetched_at").eq("user_id", user.id).single();
    if (data) setYoutubeData(data);
  };

  const handleYoutubeTakeoutImport = async (watchHistory) => {
    if (!supabase || !user?.id) return;
    try {
      const ESTIMATE_MIN_PER_VIDEO = 8;
      const records = (Array.isArray(watchHistory) ? watchHistory : []).map((r) => ({
        title: r.title ?? r.name ?? "",
        titleUrl: r.titleUrl ?? r.url ?? r.title_url ?? "",
        channelName: (r.subtitles && r.subtitles[0]?.name) ? r.subtitles[0].name : (r.channelTitle ?? r.channel ?? ""),
        channelUrl: (r.subtitles && r.subtitles[0]?.url) ? r.subtitles[0].url : (r.channelUrl ?? ""),
        time: r.time ?? r.timestamp ?? null,
        durationMinutes: typeof r.durationMinutes === "number" ? r.durationMinutes : null,
      })).filter((r) => r.title || r.titleUrl);

      const videoCount = records.length;
      const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes ?? ESTIMATE_MIN_PER_VIDEO), 0);
      const roundedMinutes = Math.round(totalMinutes * 10) / 10;

      // Top channels by watch time (sum minutes per channel)
      const channelByKey = new Map();
      for (const r of records) {
        const key = (r.channelName || r.channelUrl || "Unknown").trim() || "Unknown";
        const mins = r.durationMinutes ?? ESTIMATE_MIN_PER_VIDEO;
        const cur = channelByKey.get(key) || { channelName: r.channelName || key, channelUrl: r.channelUrl || "", totalMinutes: 0, watchCount: 0 };
        cur.totalMinutes += mins;
        cur.watchCount += 1;
        channelByKey.set(key, cur);
      }
      const channelRankings = Array.from(channelByKey.values())
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, 10)
        .map((c) => ({ channelName: c.channelName, channelUrl: c.channelUrl, totalMinutes: Math.round(c.totalMinutes * 10) / 10, watchCount: c.watchCount }));

      // Top videos by watch time (same video can be watched multiple times)
      const videoByKey = new Map();
      for (const r of records) {
        const key = (r.titleUrl || (r.title + "|" + (r.channelName || ""))).trim() || "unknown";
        const mins = r.durationMinutes ?? ESTIMATE_MIN_PER_VIDEO;
        const cur = videoByKey.get(key) || { title: r.title, titleUrl: r.titleUrl || "", channelName: r.channelName || "", totalMinutes: 0, watchCount: 0 };
        cur.totalMinutes += mins;
        cur.watchCount += 1;
        videoByKey.set(key, cur);
      }
      const videoRankings = Array.from(videoByKey.values())
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, 10)
        .map((v) => ({ title: v.title, titleUrl: v.titleUrl, channelName: v.channelName, totalMinutes: Math.round(v.totalMinutes * 10) / 10, watchCount: v.watchCount }));

      // Watch trend by month (parse time, group by YYYY-MM)
      const monthByKey = new Map();
      for (const r of records) {
        const t = r.time ? new Date(r.time) : null;
        if (!t || Number.isNaN(t.getTime())) continue;
        const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
        const mins = r.durationMinutes ?? ESTIMATE_MIN_PER_VIDEO;
        monthByKey.set(key, (monthByKey.get(key) || 0) + mins);
      }
      const watchTrend = Array.from(monthByKey.entries())
        .map(([month, minutes]) => ({ month, minutes: Math.round(minutes * 10) / 10 }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const { error } = await supabase.from("user_youtube_takeout").upsert({
        user_id: user.id,
        watch_history_json: records,
        video_count: videoCount,
        total_watch_minutes: roundedMinutes,
        channel_rankings_json: channelRankings,
        video_rankings_json: videoRankings,
        watch_trend_json: watchTrend,
        imported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error("Takeout upsert error:", error);
        return;
      }
      const { data } = await supabase.from("user_youtube_takeout").select("user_id, watch_history_json, video_count, total_watch_minutes, imported_at, channel_rankings_json, video_rankings_json, watch_trend_json").eq("user_id", user.id).maybeSingle();
      if (data) setYoutubeTakeout(data);
    } catch (e) {
      console.error("Takeout import error (client-side):", e);
    }
  };

  const handleLogout = () => {
    if (supabase) supabase.auth.signOut();
    setUser(null);
    setYoutubeData(null);
    setYoutubeTakeout(null);
  };

  const handleViewPublicProfile = () => {
    if (!user?.username) return;
    navigate(`/u/${user.username}`);
  };

  const handleAddConcert = async (c) => {
    if (supabase && user?.id) {
      const { data, error } = await supabase.from("concerts").insert({
        user_id: user.id,
        artist: c.artist,
        tour: c.tour || null,
        date: c.date,
        venue: c.venue || null,
        city: c.city || null,
        ticket_type: c.ticket_type || null,
        ticket_price: c.ticket_price ?? null,
        source: c.source || "manual",
      }).select().single();
      if (!error && data) {
        setConcerts((prev) => [
          {
            id: data.id,
            artist: data.artist,
            tour: data.tour,
            date: data.date,
            venue: data.venue,
            city: data.city,
            ticket_type: data.ticket_type,
            ticket_price: data.ticket_price,
            source: data.source,
            is_featured: data.is_featured ?? false,
          },
          ...prev,
        ]);
        return;
      }
    }
    setConcerts((prev) => [{ ...c, id: c.id || crypto.randomUUID(), is_featured: false }, ...prev]);
  };

  const handleUpdateConcert = async (updated) => {
    if (supabase && user?.id) {
      const { error } = await supabase
        .from("concerts")
        .update({
          artist: updated.artist,
          tour: updated.tour ?? null,
          date: updated.date,
          venue: updated.venue ?? null,
          city: updated.city ?? null,
          ticket_type: updated.ticket_type ?? null,
          ticket_price: updated.ticket_price ?? null,
          source: updated.source ?? "manual",
        })
        .eq("id", updated.id)
        .eq("user_id", user.id);
      if (!error) {
        setConcerts((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        setEditingConcert(null);
      }
    } else {
      setConcerts((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setEditingConcert(null);
    }
  };

  const handleAddVinyl = async (v) => {
    if (supabase && user?.id) {
      const { data, error } = await supabase.from("vinyl").insert({
        user_id: user.id,
        artist_name: v.artist_name,
        album_name: v.album_name,
        is_limited_edition: v.is_limited_edition ?? false,
      }).select().single();
      if (!error && data) {
        setVinyl((prev) => [
          {
            id: data.id,
            artist_name: data.artist_name,
            album_name: data.album_name,
            is_limited_edition: data.is_limited_edition,
            is_featured: data.is_featured ?? false,
          },
          ...prev,
        ]);
        return;
      }
    }
    setVinyl((prev) => [{ ...v, id: v.id || crypto.randomUUID(), is_featured: false }, ...prev]);
  };

  const handleAddMerch = async (m) => {
    if (supabase && user?.id) {
      const { data, error } = await supabase.from("merch").insert({
        user_id: user.id,
        artist_name: m.artist_name,
        item_name: m.item_name,
        merch_type: m.merch_type,
        is_tour_merch: m.is_tour_merch ?? false,
        tour_name: m.tour_name || null,
        purchase_price: m.purchase_price ?? null,
        purchase_location: m.purchase_location || null,
      }).select().single();
      if (!error && data) {
        setMerch((prev) => [
          {
            id: data.id,
            artist_name: data.artist_name,
            item_name: data.item_name,
            merch_type: data.merch_type,
            is_tour_merch: data.is_tour_merch,
            tour_name: data.tour_name,
            purchase_price: data.purchase_price,
            purchase_location: data.purchase_location,
            is_featured: data.is_featured ?? false,
          },
          ...prev,
        ]);
        return;
      }
    }
    setMerch((prev) => [{ ...m, id: m.id || crypto.randomUUID(), is_featured: false }, ...prev]);
  };

  const handleStreamingComplete = async (d) => {
    const defaultFeatured = (d.topArtists?.length && !d.featuredArtists?.length) ? [d.topArtists[0]] : (d.featuredArtists ?? []);
    const payload = { ...d, featuredArtists: defaultFeatured };
    if (supabase && user?.id) {
      await supabase.from("user_streaming_stats").upsert(
        {
          user_id: user.id,
          total_hours: Math.round(d.totalHours),
          total_records: d.totalRecords,
          unique_artists: d.uniqueArtists,
          unique_tracks: d.uniqueTracks,
          top_artists: d.topArtists,
          top_tracks: d.topTracks,
          featured_artists: defaultFeatured,
          start_date: d.startDate || null,
          end_date: d.endDate || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
    setStreamingData(payload);
    setShowUpload(false);
  };

  const handleToggleConcertFeatured = async (concertId, isFeatured) => {
    setConcerts((prev) => prev.map((c) => (c.id === concertId ? { ...c, is_featured: isFeatured } : c)));
    if (supabase && user?.id) {
      await supabase
        .from("concerts")
        .update({ is_featured: isFeatured })
        .eq("id", concertId)
        .eq("user_id", user.id);
    }
  };

  const handleToggleVinylFeatured = async (vinylId, isFeatured) => {
    setVinyl((prev) => prev.map((v) => (v.id === vinylId ? { ...v, is_featured: isFeatured } : v)));
    if (supabase && user?.id) {
      await supabase
        .from("vinyl")
        .update({ is_featured: isFeatured })
        .eq("id", vinylId)
        .eq("user_id", user.id);
    }
  };

  const handleToggleMerchFeatured = async (merchId, isFeatured) => {
    setMerch((prev) => prev.map((m) => (m.id === merchId ? { ...m, is_featured: isFeatured } : m)));
    if (supabase && user?.id) {
      await supabase
        .from("merch")
        .update({ is_featured: isFeatured })
        .eq("id", merchId)
        .eq("user_id", user.id);
    }
  };

  const handleAvatarChange = async (avatarId) => {
    if (!user?.id || !supabase) return;
    const { error } = await supabase.from("profiles").update({ avatar_id: avatarId }).eq("id", user.id);
    if (!error) setUser((prev) => (prev ? { ...prev, avatar_id: avatarId } : prev));
  };

  const handleToggleArtistFeatured = async (artistName, isFeatured) => {
    if (!streamingData) return;
    let nextFeatured = streamingData.featuredArtists || [];
    if (isFeatured) {
      const artistObj = streamingData.topArtists?.find((a) => a.name === artistName);
      if (!artistObj) return;
      nextFeatured = [...nextFeatured.filter((a) => a.name !== artistName), artistObj];
    } else {
      nextFeatured = nextFeatured.filter((a) => a.name !== artistName);
    }
    setStreamingData((prev) => (prev ? { ...prev, featuredArtists: nextFeatured } : prev));
    if (supabase && user?.id) {
      await supabase
        .from("user_streaming_stats")
        .update({ featured_artists: nextFeatured })
        .eq("user_id", user.id);
    }
  };

  const handleToggleYoutubeChannelFeatured = async (channelId, channelTitle, isFeatured) => {
    const current = youtubeData?.featured_youtube_channels ?? [];
    let next = current;
    if (isFeatured) {
      next = [...next.filter((c) => (c.channelId || c.channelTitle) !== (channelId || channelTitle)), { channelId: channelId || null, channelTitle: channelTitle || "" }];
    } else {
      next = next.filter((c) => (c.channelId || c.channelTitle) !== (channelId || channelTitle));
    }
    setYoutubeData((prev) => (prev ? { ...prev, featured_youtube_channels: next } : prev));
    if (supabase && user?.id) {
      await supabase.from("user_youtube").update({ featured_youtube_channels: next }).eq("user_id", user.id);
    }
  };

  if (authLoading) {
    return (
      <GradientBg>
        <div style={{ padding: "80px 24px", textAlign: "center", fontFamily: F, fontSize: 15, color: "#0f766e" }}>Loading…</div>
      </GradientBg>
    );
  }
  if (!user) return <AuthScreen onAuth={(u) => setUser(u)} />;

  return (
    <GradientBg>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 0" }}>
        <span style={{ fontSize: 22, color: "#0d9488", fontWeight: 700 }}>‹</span>
        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{activeTab}</span>
        <button onClick={handleLogout} style={{ background: "none", border: "none", fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.4)", cursor: "pointer" }}>Log out</button>
      </div>
      <ProfileHeader user={user} onViewPublicProfile={handleViewPublicProfile} onAvatarChange={handleAvatarChange} supabase={supabase} showAvatarPicker={showAvatarPicker} onCloseAvatarPicker={() => setShowAvatarPicker(false)} onOpenAvatarPicker={() => setShowAvatarPicker(true)} />
      <div style={{ padding: "8px 20px 0" }}>
        <TabBar active={activeTab} onSelect={setActiveTab} />
      </div>
      <div style={{ paddingBottom: 40 }}>
        {activeTab === "Live" && <LiveTab concerts={concerts} onAdd={() => setShowConcert(true)} onEdit={(c) => setEditingConcert(c)} />}
        {activeTab === "Digital" && <DigitalTab data={streamingData} onUpload={() => setShowUpload(true)} youtube={youtubeData} youtubeTakeout={youtubeTakeout} onYoutubeConnect={handleYoutubeConnect} onYoutubeSync={handleYoutubeSync} onYoutubeTakeoutImport={handleYoutubeTakeoutImport} />}
        {activeTab === "Physical" && <PhysicalTab vinyl={vinyl} merch={merch} onAddVinyl={() => setShowVinyl(true)} onAddMerch={() => setShowMerch(true)} />}
        {activeTab === "Curate" && (
          <CurateTab
            concerts={concerts}
            merch={merch}
            vinyl={vinyl}
            data={streamingData}
            user={user}
            onToggleConcertFeatured={handleToggleConcertFeatured}
            onToggleVinylFeatured={handleToggleVinylFeatured}
            onToggleMerchFeatured={handleToggleMerchFeatured}
            onToggleArtistFeatured={handleToggleArtistFeatured}
            youtube={youtubeData}
            youtubeTakeout={youtubeTakeout}
            onToggleYoutubeChannelFeatured={handleToggleYoutubeChannelFeatured}
            onPreviewProfile={handleViewPublicProfile}
            onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          />
        )}
      </div>
      {showUpload && <SpotifyUploadModal onClose={() => setShowUpload(false)} onComplete={handleStreamingComplete} />}
      {showConcert && <AddConcertModal onClose={() => setShowConcert(false)} onAdd={handleAddConcert} />}
      {editingConcert && <EditConcertModal concert={editingConcert} onClose={() => setEditingConcert(null)} onSave={handleUpdateConcert} />}
      {showVinyl && <AddItemModal type="vinyl" onClose={() => setShowVinyl(false)} onAdd={handleAddVinyl} />}
      {showMerch && <AddItemModal type="merch" onClose={() => setShowMerch(false)} onAdd={handleAddMerch} />}
    </GradientBg>
  );
}
