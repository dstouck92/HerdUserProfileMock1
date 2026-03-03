import { useState, useEffect } from "react";
import { Card, F, AvatarSprite } from "./ui";

const HERD_TABS = ["Topics", "Leaderboards", "Connect", "About"];
const TOPIC_CATEGORIES = ["General", "New Music", "Fashion", "Gossip", "Tour", "Random", "Events"];

export default function HerdsPage({
  userHerds = [],
  discoverHerds = [],
  selectedHerdId,
  herdDetails,
  onSelectHerd,
  onBackToList,
  onFollowHerd,
  onOpenProfile,
  user,
  supabase,
}) {
  const [herdTab, setHerdTab] = useState("Topics");
  const [topicsPosts, setTopicsPosts] = useState([]);
  const [topicsAuthors, setTopicsAuthors] = useState({});
  const [topicsLikeCount, setTopicsLikeCount] = useState({});
  const [topicsUserLiked, setTopicsUserLiked] = useState({});
  const [topicsCommentCount, setTopicsCommentCount] = useState({});
  const [topicsModalPostId, setTopicsModalPostId] = useState(null);
  const [topicsComments, setTopicsComments] = useState({});
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("General");
  const [newPostImageUrl, setNewPostImageUrl] = useState("");
  const [newPostCaption, setNewPostCaption] = useState("");
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [connectFollowers, setConnectFollowers] = useState([]);
  const [connectLoading, setConnectLoading] = useState(false);
  const [herdSpotifyImageUrl, setHerdSpotifyImageUrl] = useState(null);
  const [spotifyImageByArtistId, setSpotifyImageByArtistId] = useState({});
  const [herdFollowerCount, setHerdFollowerCount] = useState(null);

  const followingHerdIds = userHerds.map((h) => h.id);
  const isFollowingSelected =
    selectedHerdId && followingHerdIds.includes(selectedHerdId);

  useEffect(() => {
    if (!supabase || !selectedHerdId || herdTab !== "Topics") return;
    let cancelled = false;
    setTopicsLoading(true);
    (async () => {
      try {
        const { data: posts, error: postsErr } = await supabase
          .from("herd_posts")
          .select("id, herd_id, user_id, title, category, image_url, caption, created_at")
          .eq("herd_id", selectedHerdId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (cancelled || postsErr || !posts) {
          setTopicsPosts([]);
          setTopicsAuthors({});
          setTopicsLikeCount({});
          setTopicsUserLiked({});
          setTopicsCommentCount({});
          return;
        }
        setTopicsPosts(posts);
        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username")
          .in("id", userIds);
        const authorMap = {};
        if (profiles) profiles.forEach((p) => { authorMap[p.id] = p.display_name || p.username || "Fan"; });
        setTopicsAuthors(authorMap);
        const postIds = posts.map((p) => p.id);
        const { data: likes } = await supabase
          .from("herd_post_likes")
          .select("post_id, user_id")
          .in("post_id", postIds);
        const likeCount = {};
        const userLiked = {};
        if (likes) {
          likes.forEach((l) => {
            likeCount[l.post_id] = (likeCount[l.post_id] || 0) + 1;
            if (user?.id && l.user_id === user.id) userLiked[l.post_id] = true;
          });
        }
        postIds.forEach((id) => { if (!likeCount[id]) likeCount[id] = 0; });
        setTopicsLikeCount(likeCount);
        setTopicsUserLiked(userLiked);
        const { data: commentRows } = await supabase
          .from("herd_post_comments")
          .select("post_id")
          .in("post_id", postIds);
        const commentCount = {};
        if (commentRows) commentRows.forEach((r) => { commentCount[r.post_id] = (commentCount[r.post_id] || 0) + 1; });
        postIds.forEach((id) => { if (!commentCount[id]) commentCount[id] = 0; });
        setTopicsCommentCount(commentCount);
      } finally {
        if (!cancelled) setTopicsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, selectedHerdId, herdTab, user?.id]);

  useEffect(() => {
    if (!supabase || !topicsModalPostId) return;
    (async () => {
      const { data: comments, error } = await supabase
        .from("herd_post_comments")
        .select("id, post_id, user_id, body, created_at")
        .eq("post_id", topicsModalPostId)
        .order("created_at", { ascending: true });
      if (error) return;
      const userIds = [...new Set((comments || []).map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", userIds);
      const nameMap = {};
      if (profiles) profiles.forEach((p) => { nameMap[p.id] = p.display_name || p.username || "Fan"; });
      setTopicsComments((prev) => ({
        ...prev,
        [topicsModalPostId]: (comments || []).map((c) => ({ ...c, author_name: nameMap[c.user_id] || "Fan" })),
      }));
    })();
  }, [supabase, topicsModalPostId]);

  useEffect(() => {
    if (!supabase || !selectedHerdId || !herdDetails || herdTab !== "Leaderboards") return;
    const artistName = (herdDetails.name || "").trim().toLowerCase();
    if (!artistName) {
      setLeaderboardRows([]);
      return;
    }
    let cancelled = false;
    setLeaderboardLoading(true);
    (async () => {
      try {
        const { data: statsRows, error: statsErr } = await supabase
          .from("user_streaming_stats")
          .select("user_id, top_artists");
        if (cancelled || statsErr || !statsRows) {
          setLeaderboardRows([]);
          return;
        }
        const withMinutes = statsRows
          .map((row) => {
            const topArtists = row.top_artists || [];
            const match = topArtists.find(
              (a) => (a.name || "").trim().toLowerCase() === artistName
            );
            const minutes = match ? (match.hours || 0) * 60 : 0;
            return { user_id: row.user_id, minutes };
          })
          .filter((r) => r.minutes > 0)
          .sort((a, b) => b.minutes - a.minutes);
        const userIds = [...new Set(withMinutes.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_id, profile_image_url")
          .in("id", userIds);
        const nameBy = {};
        const avatarBy = {};
        const imageBy = {};
        if (profiles) {
          profiles.forEach((p) => {
            nameBy[p.id] = p.display_name || p.username || "Fan";
            avatarBy[p.id] = p.avatar_id ?? 7;
            imageBy[p.id] = p.profile_image_url || null;
          });
        }
        const rows = withMinutes.map((r, i) => ({
          rank: i + 1,
          user_id: r.user_id,
          minutes: Math.round(r.minutes * 10) / 10,
          display_name: nameBy[r.user_id] || "Fan",
          avatar_id: avatarBy[r.user_id] ?? 7,
          profile_image_url: imageBy[r.user_id] || null,
        }));
        if (!cancelled) setLeaderboardRows(rows);
      } catch (_) {
        if (!cancelled) setLeaderboardRows([]);
      } finally {
        if (!cancelled) setLeaderboardLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, selectedHerdId, herdDetails, herdTab]);

  useEffect(() => {
    if (!supabase || !selectedHerdId || herdTab !== "Connect") return;
    let cancelled = false;
    setConnectLoading(true);
    (async () => {
      try {
        const { data: followRows, error: followErr } = await supabase
          .from("herd_follows")
          .select("user_id")
          .eq("herd_id", selectedHerdId);
        if (cancelled || followErr || !followRows?.length) {
          setConnectFollowers([]);
          return;
        }
        const userIds = [...new Set(followRows.map((r) => r.user_id))];
        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_id, profile_image_url")
          .in("id", userIds);
        if (cancelled || profErr) {
          setConnectFollowers([]);
          return;
        }
        const list = (profiles || []).map((p) => ({
          user_id: p.id,
          display_name: p.display_name || p.username || "Fan",
          username: p.username || "",
          avatar_id: p.avatar_id ?? 7,
          profile_image_url: p.profile_image_url || null,
        })).sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));
        if (!cancelled) setConnectFollowers(list);
      } catch {
        if (!cancelled) setConnectFollowers([]);
      } finally {
        if (!cancelled) setConnectLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, selectedHerdId, herdTab]);

  useEffect(() => {
    if (!herdDetails?.spotify_artist_id || herdDetails?.image_url) {
      setHerdSpotifyImageUrl(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/spotify/artist-image?artist_id=${encodeURIComponent(herdDetails.spotify_artist_id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.imageUrl) setHerdSpotifyImageUrl(data.imageUrl);
      })
      .catch(() => { if (!cancelled) setHerdSpotifyImageUrl(null); });
    return () => { cancelled = true; };
  }, [herdDetails?.id, herdDetails?.spotify_artist_id, herdDetails?.image_url]);

  useEffect(() => {
    const herds = [...(userHerds || []), ...(discoverHerds || [])];
    const needFetch = herds.filter(
      (h) => h.spotify_artist_id && !h.image_url && !spotifyImageByArtistId[h.spotify_artist_id]
    );
    if (needFetch.length === 0) return;
    let cancelled = false;
    needFetch.forEach((herd) => {
      fetch(`/api/spotify/artist-image?artist_id=${encodeURIComponent(herd.spotify_artist_id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data?.imageUrl) {
            setSpotifyImageByArtistId((prev) => ({ ...prev, [herd.spotify_artist_id]: data.imageUrl }));
          }
        })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, [userHerds, discoverHerds, spotifyImageByArtistId]);

  useEffect(() => {
    if (!supabase || !selectedHerdId) {
      setHerdFollowerCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { count, error } = await supabase
        .from("herd_follows")
        .select("*", { count: "exact", head: true })
        .eq("herd_id", selectedHerdId);
      if (!cancelled) {
        setHerdFollowerCount(!error && typeof count === "number" ? count : null);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase, selectedHerdId, userHerds]);

  const handleCreatePost = async () => {
    if (!supabase || !user?.id || !selectedHerdId || !newPostTitle.trim()) return;
    const title = newPostTitle.trim();
    const { error } = await supabase.from("herd_posts").insert({
      herd_id: selectedHerdId,
      user_id: user.id,
      title,
      category: newPostCategory,
      image_url: newPostImageUrl.trim() || null,
      caption: newPostCaption.trim() || null,
    });
    if (!error) {
      setNewPostTitle("");
      setNewPostCategory("General");
      setNewPostImageUrl("");
      setNewPostCaption("");
      setShowNewPostForm(false);
      const { data: posts } = await supabase.from("herd_posts").select("id, herd_id, user_id, title, category, image_url, caption, created_at").eq("herd_id", selectedHerdId).order("created_at", { ascending: false }).limit(50);
      if (posts) setTopicsPosts(posts);
      const postIds = (posts || []).map((p) => p.id);
      const { data: likes } = await supabase.from("herd_post_likes").select("post_id, user_id").in("post_id", postIds);
      const likeCount = {};
      const userLiked = {};
      if (likes) likes.forEach((l) => { likeCount[l.post_id] = (likeCount[l.post_id] || 0) + 1; if (user?.id && l.user_id === user.id) userLiked[l.post_id] = true; });
      postIds.forEach((id) => { if (!likeCount[id]) likeCount[id] = 0; });
      setTopicsLikeCount(likeCount);
      setTopicsUserLiked(userLiked);
      const { data: commentRows } = await supabase.from("herd_post_comments").select("post_id").in("post_id", postIds);
      const commentCount = {};
      if (commentRows) commentRows.forEach((r) => { commentCount[r.post_id] = (commentCount[r.post_id] || 0) + 1; });
      postIds.forEach((id) => { if (!commentCount[id]) commentCount[id] = 0; });
      setTopicsCommentCount(commentCount);
      const userIds = [...new Set((posts || []).map((p) => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", userIds);
      const authorMap = {};
      if (profiles) profiles.forEach((p) => { authorMap[p.id] = p.display_name || p.username || "Fan"; });
      setTopicsAuthors(authorMap);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!supabase || !user?.id) return;
    const liked = topicsUserLiked[postId];
    if (liked) {
      await supabase.from("herd_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      setTopicsUserLiked((prev) => ({ ...prev, [postId]: false }));
      setTopicsLikeCount((prev) => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) - 1) }));
    } else {
      await supabase.from("herd_post_likes").insert({ post_id: postId, user_id: user.id });
      setTopicsUserLiked((prev) => ({ ...prev, [postId]: true }));
      setTopicsLikeCount((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  const handleAddComment = async (postId, body) => {
    if (!supabase || !user?.id || !body?.trim()) return;
    const { data: comment, error } = await supabase.from("herd_post_comments").insert({ post_id: postId, user_id: user.id, body: body.trim() }).select("id, post_id, user_id, body, created_at").single();
    if (!error && comment) {
      setTopicsComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { ...comment, author_name: user.display_name || user.username || "You" }],
      }));
      setTopicsCommentCount((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  if (selectedHerdId && herdDetails) {
    return (
      <div style={{ paddingBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px 8px",
          }}
        >
          <button
            type="button"
            onClick={onBackToList}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              color: "#0d9488",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Back"
          >
            ‹
          </button>
          <span
            style={{
              fontFamily: F,
              fontSize: 16,
              fontWeight: 700,
              color: "#1e1b4b",
            }}
          >
            Fan Club
          </span>
        </div>
        <Card style={{ margin: "0 16px 16px", padding: 0, overflow: "hidden" }}>
          <div
            style={{
              height: 120,
              background:
                "linear-gradient(135deg, #0d9488 0%, #10b981 50%, #34d399 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {(herdDetails.image_url || herdSpotifyImageUrl) ? (
              <img
                src={herdDetails.image_url || herdSpotifyImageUrl}
                alt=""
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: F,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                {herdDetails.name?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <div style={{ padding: "12px 16px 16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ fontFamily: F, fontSize: 20, fontWeight: 800, color: "#1e1b4b" }}>
                {herdDetails.name}
              </div>
              {herdFollowerCount != null && (
                <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.7)", fontWeight: 600 }}>
                  {herdFollowerCount.toLocaleString()} {herdFollowerCount === 1 ? "follower" : "followers"}
                </div>
              )}
            </div>
            {user && (
              <button
                type="button"
                onClick={() => onFollowHerd?.(herdDetails.id, !isFollowingSelected)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "none",
                  fontFamily: F,
                  fontSize: 13,
                  fontWeight: 700,
                  background: isFollowingSelected
                    ? "rgba(34,197,94,0.2)"
                    : "linear-gradient(135deg, #0d9488, #10b981)",
                  color: isFollowingSelected ? "#16a34a" : "#fff",
                  cursor: "pointer",
                  boxShadow: isFollowingSelected ? "none" : "0 4px 12px rgba(13,148,136,0.35)",
                }}
              >
                {isFollowingSelected ? "Following" : "Follow +"}
              </button>
            )}
          </div>
        </Card>
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            marginBottom: 12,
          }}
        >
          {HERD_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setHerdTab(t)}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "none",
                border: "none",
                color: herdTab === t ? "#0f766e" : "rgba(55,48,107,0.55)",
                fontFamily: F,
                fontSize: 13,
                fontWeight: herdTab === t ? 700 : 500,
                cursor: "pointer",
                position: "relative",
              }}
            >
              {t}
              {herdTab === t && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -1,
                    left: "20%",
                    right: "20%",
                    height: 3,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, #0d9488, #10b981)",
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <div style={{ padding: "0 20px 24px" }}>
          {herdTab === "Topics" && (
            <div>
              {user && (
                <div style={{ marginBottom: 12 }}>
                  {!showNewPostForm ? (
                    <button
                      type="button"
                      onClick={() => setShowNewPostForm(true)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 12,
                        border: "1px solid rgba(13,148,136,0.4)",
                        background: "rgba(13,148,136,0.1)",
                        color: "#0d9488",
                        fontFamily: F,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + New post
                    </button>
                  ) : (
                    <Card style={{ padding: 16 }}>
                      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 10 }}>New post</div>
                      <input
                        type="text"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        placeholder="Title"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.25)", marginBottom: 10, fontFamily: F, fontSize: 14, boxSizing: "border-box" }}
                      />
                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.25)", marginBottom: 10, fontFamily: F, fontSize: 14, boxSizing: "border-box" }}
                      >
                        {TOPIC_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newPostImageUrl}
                        onChange={(e) => setNewPostImageUrl(e.target.value)}
                        placeholder="Image URL (optional)"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.25)", marginBottom: 10, fontFamily: F, fontSize: 14, boxSizing: "border-box" }}
                      />
                      <textarea
                        value={newPostCaption}
                        onChange={(e) => setNewPostCaption(e.target.value)}
                        placeholder="Caption (optional)"
                        rows={3}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.25)", marginBottom: 10, fontFamily: F, fontSize: 14, boxSizing: "border-box", resize: "vertical" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={() => setShowNewPostForm(false)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.3)", background: "#fff", fontFamily: F, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                        <button type="button" onClick={handleCreatePost} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Post</button>
                      </div>
                    </Card>
                  )}
                </div>
              )}
              {topicsLoading ? (
                <div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>Loading…</div>
              ) : topicsPosts.length === 0 ? (
                <div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>No posts yet. Be the first to post.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topicsPosts.map((post) => (
                    <Card
                      key={post.id}
                      style={{ padding: 14, cursor: "pointer" }}
                      onClick={() => setTopicsModalPostId(post.id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{post.title}</div>
                          <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)" }}>
                            {topicsAuthors[post.user_id] || "Fan"} · {post.category}
                          </div>
                        </div>
                        <span style={{ fontFamily: F, fontSize: 11, color: "rgba(148,163,184,0.9)" }}>
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                      {post.caption && <div style={{ fontFamily: F, fontSize: 13, color: "#374151", marginBottom: 8 }}>{post.caption}</div>}
                      {post.image_url && (
                        <img src={post.image_url} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10, marginBottom: 10 }} onError={(e) => { e.target.style.display = "none"; }} />
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.id)}
                          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F, fontSize: 13, color: topicsUserLiked[post.id] ? "#dc2626" : "rgba(55,48,107,0.7)" }}
                        >
                          ♡ {topicsLikeCount[post.id] || 0}
                        </button>
                        <span style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.7)" }}>
                          💬 {topicsCommentCount[post.id] || 0}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          {herdTab === "Leaderboards" && (
            <div>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>
                Top listeners
              </div>
              {leaderboardLoading ? (
                <div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>Loading…</div>
              ) : leaderboardRows.length === 0 ? (
                <div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>
                  No listening data yet. Upload Spotify history to appear here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {leaderboardRows.map((row) => (
                    <div
                      key={row.user_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.6)",
                        borderRadius: 12,
                        border: "1px solid rgba(13,148,136,0.1)",
                      }}
                    >
                      <span style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: "rgba(55,48,107,0.5)", minWidth: 28 }}>#{row.rank}</span>
                      <AvatarSprite avatarId={row.avatar_id} imageUrl={row.profile_image_url} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>{row.display_name}</div>
                        <div style={{ fontFamily: F, fontSize: 12, color: "#0d9488", fontWeight: 600 }}>
                          {row.minutes >= 60 ? `${(row.minutes / 60).toFixed(1)} hrs` : `${row.minutes} min`} listened
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {herdTab === "Connect" && (
            <div>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>
                Fans in this herd
              </div>
              {connectLoading ? (
                <div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>Loading…</div>
              ) : connectFollowers.length === 0 ? (
                <div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>
                  No followers yet. Be the first to follow this herd.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {connectFollowers.map((f) => (
                    <button
                      key={f.user_id}
                      type="button"
                      onClick={() => f.username && onOpenProfile?.(f.username)}
                      disabled={!f.username}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(13,148,136,0.1)",
                        borderRadius: 12,
                        cursor: f.username ? "pointer" : "default",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <AvatarSprite avatarId={f.avatar_id} imageUrl={f.profile_image_url} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>
                          {f.display_name}
                          {user?.id === f.user_id && (
                            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: "rgba(55,48,107,0.5)", marginLeft: 6 }}>(You)</span>
                          )}
                        </div>
                        {f.username && (
                          <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.55)" }}>@{f.username}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {herdTab === "About" && (
            <div
              style={{
                fontFamily: F,
                fontSize: 14,
                color: "rgba(55,48,107,0.7)",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              About this artist — coming soon.
            </div>
          )}
        </div>
      {topicsModalPostId && (() => {
        const modalPost = topicsPosts.find((p) => p.id === topicsModalPostId);
        return (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "24px 16px",
              overflow: "auto",
            }}
            onClick={() => setTopicsModalPostId(null)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                maxWidth: 480,
                width: "100%",
                maxHeight: "calc(100vh - 48px)",
                overflow: "auto",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setTopicsModalPostId(null)}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.08)",
                  fontFamily: F,
                  fontSize: 18,
                  cursor: "pointer",
                  lineHeight: 1,
                  zIndex: 1,
                }}
              >
                ×
              </button>
              <div style={{ padding: 20, paddingTop: 44 }}>
                {modalPost ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{modalPost.title}</div>
                        <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)" }}>
                          {topicsAuthors[modalPost.user_id] || "Fan"} · {modalPost.category}
                        </div>
                      </div>
                      <span style={{ fontFamily: F, fontSize: 12, color: "rgba(148,163,184,0.9)" }}>
                        {modalPost.created_at ? new Date(modalPost.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    {modalPost.caption && <div style={{ fontFamily: F, fontSize: 14, color: "#374151", marginBottom: 12 }}>{modalPost.caption}</div>}
                    {modalPost.image_url && (
                      <img src={modalPost.image_url} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} onError={(e) => { e.target.style.display = "none"; }} />
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleLike(modalPost.id)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F, fontSize: 14, color: topicsUserLiked[modalPost.id] ? "#dc2626" : "rgba(55,48,107,0.7)" }}
                      >
                        ♡ {topicsLikeCount[modalPost.id] || 0}
                      </button>
                      <span style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.7)" }}>💬 {topicsCommentCount[modalPost.id] || 0}</span>
                    </div>
                    <div style={{ borderTop: "1px solid rgba(13,148,136,0.15)", paddingTop: 16 }}>
                      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 12 }}>Comments</div>
                      <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12 }}>
                        {(topicsComments[topicsModalPostId] || []).map((c) => (
                          <div key={c.id} style={{ marginBottom: 10 }}>
                            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: "#1e1b4b" }}>{c.author_name}</span>
                            <span style={{ fontFamily: F, fontSize: 12, color: "#374151", marginLeft: 6 }}>{c.body}</span>
                          </div>
                        ))}
                        {(topicsComments[topicsModalPostId] || []).length === 0 && (
                          <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.5)" }}>No comments yet.</div>
                        )}
                      </div>
                      {user && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = e.target.querySelector("input");
                            if (input?.value) {
                              handleAddComment(modalPost.id, input.value);
                              input.value = "";
                            }
                          }}
                          style={{ display: "flex", gap: 8 }}
                        >
                          <input type="text" placeholder="Add a comment…" style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(13,148,136,0.25)", fontFamily: F, fontSize: 13 }} />
                          <button type="submit" style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Post</button>
                        </form>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.6)" }}>Post not found.</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    );
  }

  const discoverFiltered = discoverHerds.filter(
    (h) => !userHerds.some((u) => u.id === h.id)
  );

  return (
    <div style={{ paddingBottom: 16 }}>
      <div
        style={{
          padding: "12px 20px 8px",
          fontFamily: F,
          fontSize: 18,
          fontWeight: 800,
          color: "#1e1b4b",
        }}
      >
        Herds
      </div>
      <div style={{ padding: "8px 20px 12px" }}>
        <div
          style={{
            fontFamily: F,
            fontSize: 14,
            fontWeight: 700,
            color: "#1e1b4b",
            marginBottom: 8,
          }}
        >
          Herds you follow
        </div>
        {userHerds.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {userHerds.map((herd) => (
              <button
                key={herd.id}
                type="button"
                onClick={() => onSelectHerd?.(herd.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "none",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.7)",
                  boxShadow: "0 2px 12px rgba(13,148,136,0.1)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {(herd.image_url || spotifyImageByArtistId[herd.spotify_artist_id]) ? (
                  <img
                    src={herd.image_url || spotifyImageByArtistId[herd.spotify_artist_id]}
                    alt=""
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0d9488, #10b981)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: F,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {herd.name?.charAt(0) || "?"}
                  </div>
                )}
                <span
                  style={{
                    fontFamily: F,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1e1b4b",
                  }}
                >
                  {herd.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div
            style={{
              fontFamily: F,
              fontSize: 13,
              color: "rgba(55,48,107,0.6)",
              padding: "12px 0",
            }}
          >
            Follow artists from Search to see their herds here.
          </div>
        )}
      </div>
      {discoverFiltered.length > 0 && (
        <div style={{ padding: "8px 20px 12px" }}>
          <div
            style={{
              fontFamily: F,
              fontSize: 14,
              fontWeight: 700,
              color: "#1e1b4b",
              marginBottom: 8,
            }}
          >
            Discover
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {discoverFiltered.map((herd) => (
              <button
                key={herd.id}
                type="button"
                onClick={() => onSelectHerd?.(herd.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  border: "none",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.7)",
                  boxShadow: "0 2px 12px rgba(13,148,136,0.1)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                {(herd.image_url || spotifyImageByArtistId[herd.spotify_artist_id]) ? (
                  <img
                    src={herd.image_url || spotifyImageByArtistId[herd.spotify_artist_id]}
                    alt=""
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0d9488, #10b981)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: F,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {herd.name?.charAt(0) || "?"}
                  </div>
                )}
                <span
                  style={{
                    fontFamily: F,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1e1b4b",
                  }}
                >
                  {herd.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
