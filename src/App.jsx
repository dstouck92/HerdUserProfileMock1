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

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [activeTab, setActiveTab] = useState("Digital");
  const [streamingData, setStreamingData] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [vinyl, setVinyl] = useState([]);
  const [merch, setMerch] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showConcert, setShowConcert] = useState(false);
  const [editingConcert, setEditingConcert] = useState(null);
  const [showVinyl, setShowVinyl] = useState(false);
  const [showMerch, setShowMerch] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    let cancelled = false;
    const loadSession = async () => {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
        const { data: { session } } = await Promise.race([supabase.auth.getSession(), timeout]);
        if (cancelled) return;
        if (session?.user) {
          try {
            const { data: profile } = await supabase.from("profiles").select("id, display_name, username").eq("id", session.user.id).single();
            if (!cancelled) setUser(profile || { id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user" });
          } catch (_) {
            if (!cancelled) setUser({ id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user" });
          }
        }
      } catch (_) {
        // timeout or network error: show login so user isn't stuck
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
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
      const { data: profile } = await supabase.from("profiles").select("id, display_name, username").eq("id", session.user.id).single();
      setUser(profile || { id: session.user.id, display_name: session.user.email?.split("@")[0] || "User", username: session.user.email?.split("@")[0] || "user" });
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
      const [cRes, vRes, mRes, sRes] = await Promise.all([
        supabase.from("concerts").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("vinyl").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("merch").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("user_streaming_stats").select("*").eq("user_id", uid).single(),
      ]);
      if (cRes.data) setConcerts(cRes.data.map((r) => ({ id: r.id, artist: r.artist, tour: r.tour, date: r.date, venue: r.venue, city: r.city, ticket_type: r.ticket_type, ticket_price: r.ticket_price, source: r.source })));
      if (vRes.data) setVinyl(vRes.data.map((r) => ({ id: r.id, artist_name: r.artist_name, album_name: r.album_name, is_limited_edition: r.is_limited_edition })));
      if (mRes.data) setMerch(mRes.data.map((r) => ({ id: r.id, artist_name: r.artist_name, item_name: r.item_name, merch_type: r.merch_type, is_tour_merch: r.is_tour_merch, tour_name: r.tour_name, purchase_price: r.purchase_price, purchase_location: r.purchase_location })));
      if (sRes.data?.user_id) {
        const s = sRes.data;
        setStreamingData({
          totalHours: s.total_hours ?? 0,
          totalRecords: s.total_records ?? 0,
          uniqueArtists: s.unique_artists ?? 0,
          uniqueTracks: s.unique_tracks ?? 0,
          topArtists: s.top_artists ?? [],
          topTracks: s.top_tracks ?? [],
        });
      }
    })();
  }, [user?.id]);

  const handleLogout = () => {
    if (supabase) supabase.auth.signOut();
    setUser(null);
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
        setConcerts((prev) => [{ id: data.id, artist: data.artist, tour: data.tour, date: data.date, venue: data.venue, city: data.city, ticket_type: data.ticket_type, ticket_price: data.ticket_price, source: data.source }, ...prev]);
        return;
      }
    }
    setConcerts((prev) => [{ ...c, id: c.id || crypto.randomUUID() }, ...prev]);
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
        setVinyl((prev) => [{ id: data.id, artist_name: data.artist_name, album_name: data.album_name, is_limited_edition: data.is_limited_edition }, ...prev]);
        return;
      }
    }
    setVinyl((prev) => [{ ...v, id: v.id || crypto.randomUUID() }, ...prev]);
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
        setMerch((prev) => [{ id: data.id, artist_name: data.artist_name, item_name: data.item_name, merch_type: data.merch_type, is_tour_merch: data.is_tour_merch, tour_name: data.tour_name, purchase_price: data.purchase_price, purchase_location: data.purchase_location }, ...prev]);
        return;
      }
    }
    setMerch((prev) => [{ ...m, id: m.id || crypto.randomUUID() }, ...prev]);
  };

  const handleStreamingComplete = async (d) => {
    if (supabase && user?.id) {
      await supabase.from("user_streaming_stats").upsert({
        user_id: user.id,
        total_hours: d.totalHours,
        total_records: d.totalRecords,
        unique_artists: d.uniqueArtists,
        unique_tracks: d.uniqueTracks,
        top_artists: d.topArtists,
        top_tracks: d.topTracks,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
    setStreamingData(d);
    setShowUpload(false);
  };

  if (authLoading) {
    return (
      <GradientBg>
        <div style={{ padding: "80px 24px", textAlign: "center", fontFamily: F, fontSize: 15, color: "#4f46e5" }}>Loading…</div>
      </GradientBg>
    );
  }
  if (!user) return <AuthScreen onAuth={(u) => setUser(u)} />;

  return (
    <GradientBg>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 0" }}>
        <span style={{ fontSize: 22, color: "#6366f1", fontWeight: 700 }}>‹</span>
        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{activeTab}</span>
        <button onClick={handleLogout} style={{ background: "none", border: "none", fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.4)", cursor: "pointer" }}>Log out</button>
      </div>
      <ProfileHeader user={user} />
      <div style={{ padding: "8px 20px 0" }}>
        <TabBar active={activeTab} onSelect={setActiveTab} />
      </div>
      <div style={{ paddingBottom: 40 }}>
        {activeTab === "Live" && <LiveTab concerts={concerts} onAdd={() => setShowConcert(true)} onEdit={(c) => setEditingConcert(c)} />}
        {activeTab === "Digital" && <DigitalTab data={streamingData} onUpload={() => setShowUpload(true)} />}
        {activeTab === "Physical" && <PhysicalTab vinyl={vinyl} merch={merch} onAddVinyl={() => setShowVinyl(true)} onAddMerch={() => setShowMerch(true)} />}
        {activeTab === "Curate" && <CurateTab concerts={concerts} merch={merch} vinyl={vinyl} data={streamingData} />}
      </div>
      {showUpload && <SpotifyUploadModal onClose={() => setShowUpload(false)} onComplete={handleStreamingComplete} />}
      {showConcert && <AddConcertModal onClose={() => setShowConcert(false)} onAdd={handleAddConcert} />}
      {editingConcert && <EditConcertModal concert={editingConcert} onClose={() => setEditingConcert(null)} onSave={handleUpdateConcert} />}
      {showVinyl && <AddItemModal type="vinyl" onClose={() => setShowVinyl(false)} onAdd={handleAddVinyl} />}
      {showMerch && <AddItemModal type="merch" onClose={() => setShowMerch(false)} onAdd={handleAddMerch} />}
    </GradientBg>
  );
}
