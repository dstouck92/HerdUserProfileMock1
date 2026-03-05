import { useState, useEffect } from "react";
import { Card, F, AvatarSprite } from "./ui";
import { useTheme } from "../context/ThemeContext";
import { useDebounce } from "../hooks/useDebounce";

const fallbackArtists = [
  { id: 1, name: "Flume", subtitle: "2 concerts attended" },
  { id: 2, name: "Billie Eilish", subtitle: "1 concert attended" },
  { id: 3, name: "Tame Impala", subtitle: "1 concert attended" },
];

const demoHerds = [
  { id: 1, name: "Flume Herd", subtitle: "132 members" },
  { id: 2, name: "West Coast Ravers", subtitle: "87 members" },
  { id: 3, name: "Indie Night Owls", subtitle: "54 members" },
];

export default function SearchPage({
  recommendedFriends,
  followingIds = [],
  onToggleFollow,
  onOpenProfile,
  onOpenHerd,
  onFollowSpotifyArtist,
  onFollowRecommendedArtist,
  followedSpotifyArtistIds = [],
  recommendedArtists,
  recentActivity,
}) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState(null);
  const [artistImages, setArtistImages] = useState({});
  const [showAllActivityPopup, setShowAllActivityPopup] = useState(false);
  const friendsFromDb = Array.isArray(recommendedFriends)
    ? recommendedFriends.map((f) => ({
        id: f.id,
        name: f.displayName || f.username || "Friend",
        subtitle: f.username ? `@${f.username}` : "Herd user",
        username: f.username || "",
        avatarId: f.avatarId ?? 7,
        profileImageUrl: f.profileImageUrl || null,
      }))
    : [];
  const friends = friendsFromDb;

  const artists = Array.isArray(recommendedArtists) && recommendedArtists.length > 0
    ? recommendedArtists
    : fallbackArtists;

  const searchIndex = [
    ...artists.map((a) => ({
      id: `artist-${a.id}`,
      kind: "Artist",
      name: a.name,
      subtitle: a.subtitle,
      action: "Follow",
    })),
    ...friends.map((f) => ({
      id: `user-${f.id}`,
      kind: "User",
      name: f.name,
      subtitle: f.subtitle,
      action: "View",
      userId: f.id,
      username: f.username,
    })),
    ...demoHerds.map((h) => ({
      id: `herd-${h.id}`,
      kind: "Herd",
      name: h.name,
      subtitle: h.subtitle,
      action: "Follow",
    })),
  ];
  const trimmedQuery = query.trim().toLowerCase();
  const debouncedQuery = useDebounce(trimmedQuery, 350);
  const searchResults = trimmedQuery
    ? searchIndex.filter((e) => e.name.toLowerCase().includes(trimmedQuery)).slice(0, 8)
    : [];
  const localResults = searchResults.filter((e) => e.kind !== "Artist");
  const followedSpotifySet = new Set(followedSpotifyArtistIds || []);

  useEffect(() => {
    // Temporarily disable automatic Spotify artist image lookups to reduce API usage.
    // The UI will fall back to default avatars / letters for now.
  }, [artists]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSpotifyResults([]);
      setSpotifyLoading(false);
      setSpotifyError(null);
      return;
    }
    let cancelled = false;
    setSpotifyLoading(true);
    setSpotifyError(null);
    fetch(`/api/spotify/search-artists?q=${encodeURIComponent(debouncedQuery)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = [data?.error, data?.details].filter(Boolean).join(" — ") || res.statusText || "Spotify search failed";
          throw new Error(msg);
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.artists && Array.isArray(data.artists)) {
          setSpotifyResults(data.artists);
          setSpotifyError(null);
        } else {
          setSpotifyResults([]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err?.message || "Spotify search failed";
          setSpotifyError(message);
          setSpotifyResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSpotifyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const formatTimeAgo = (isoString) => {
    if (!isoString) return "";
    const now = Date.now();
    const then = new Date(isoString).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = now - then;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const ActivityItem = ({ item, isLast }) => {
    const isBadge = item.type === "badge_earned";
    return (
      <div
        key={item.id}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          paddingBottom: isLast ? 4 : 12,
          borderBottom: isLast ? "none" : "1px solid rgba(148,163,184,0.3)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: isBadge
              ? "radial-gradient(circle at 30% 0%, #fef9c3, #22c55e)"
              : "radial-gradient(circle at 30% 0%, #fee2e2, #0ea5e9)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isBadge ? <span style={{ fontSize: 18 }}>🏅</span> : null}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: F,
              fontSize: 13,
              fontWeight: 600,
              color: theme.text,
              marginBottom: 2,
            }}
          >
            <span style={{ fontWeight: 700 }}>{item.actorName}</span>{" "}
            <span style={{ fontWeight: 400 }}>{item.description}</span>
          </div>
          <div
            style={{
              fontFamily: F,
              fontSize: 11,
              color: "rgba(55,48,107,0.6)",
              marginBottom: 4,
            }}
          >
            {item.type}
          </div>
          <div
            style={{
              fontFamily: F,
              fontSize: 11,
              color: "rgba(148,163,184,0.9)",
              marginBottom: 6,
            }}
          >
            {item.actorUsername ? `@${item.actorUsername}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: F,
              fontSize: 11,
              color: "rgba(148,163,184,0.9)",
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <span>♡</span>
              <span>💬</span>
              <span>↗</span>
            </div>
            <span>{formatTimeAgo(item.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Search bar */}
      <div style={{ padding: "12px 20px 8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
            border: "1px solid rgba(148,163,184,0.3)",
          }}
        >
          <span style={{ fontSize: 18, color: "rgba(15,23,42,0.4)" }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists or fan clubs"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: F,
              fontSize: 14,
              color: theme.text,
            }}
          />
        </div>
      </div>

      {/* Search dropdown: Spotify artists + local demo results */}
      {trimmedQuery && (
        <div style={{ padding: "0 20px 8px" }}>
          <Card style={{ margin: 0, padding: "8px 0" }}>
            {spotifyLoading && (
              <div
                style={{
                  padding: "8px 12px",
                  fontFamily: F,
                  fontSize: 12,
                  color: "rgba(55,48,107,0.7)",
                }}
              >
                Searching Spotify…
              </div>
            )}
            {spotifyError && (
              <div
                style={{
                  padding: "8px 12px",
                  fontFamily: F,
                  fontSize: 12,
                  color: "#b91c1c",
                }}
              >
                {spotifyError}
              </div>
            )}
            {!spotifyLoading && !spotifyError && spotifyResults.length === 0 && localResults.length === 0 && (
              <div
                style={{
                  padding: "8px 12px",
                  fontFamily: F,
                  fontSize: 12,
                  color: "rgba(55,48,107,0.7)",
                }}
              >
                No matches yet. Try another name.
              </div>
            )}
            {!spotifyLoading && !spotifyError && spotifyResults.length > 0 && (
              <>
                <div
                  style={{
                    padding: "4px 12px 6px",
                    fontFamily: F,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    color: "rgba(55,48,107,0.7)",
                  }}
                >
                  Spotify artists
                </div>
                {spotifyResults.map((artist) => {
                  const isFollowingFanClub = followedSpotifySet.has(artist.id);
                  return (
                  <div
                    key={`spotify-${artist.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid rgba(148,163,184,0.25)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {artist.imageUrl && (
                        <img
                          src={artist.imageUrl}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                        />
                      )}
                      <div>
                        <div
                          style={{
                            fontFamily: F,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {artist.name}
                        </div>
                        <div
                          style={{
                            fontFamily: F,
                            fontSize: 11,
                            color: "rgba(55,48,107,0.6)",
                          }}
                        >
                          Spotify Artist
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontFamily: F,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: "rgba(148,163,184,0.12)",
                          color: "rgba(51,65,85,0.9)",
                        }}
                      >
                        Artist
                      </span>
                      <button
                        type="button"
                        onClick={
                          !isFollowingFanClub && onFollowSpotifyArtist
                            ? () => onFollowSpotifyArtist(artist)
                            : undefined
                        }
                        disabled={!onFollowSpotifyArtist || isFollowingFanClub}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "none",
                          fontFamily: F,
                          fontSize: 11,
                          fontWeight: 600,
                          background: isFollowingFanClub
                            ? "rgba(34,197,94,0.15)"
                            : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                          color: isFollowingFanClub ? "#16a34a" : "#fff",
                          cursor: onFollowSpotifyArtist && !isFollowingFanClub ? "pointer" : "default",
                          boxShadow: isFollowingFanClub ? "none" : "0 3px 10px rgba(37,99,235,0.4)",
                        }}
                      >
                        {isFollowingFanClub ? "Following Fan Club" : "Follow Fan Club"}
                      </button>
                    </div>
                  </div>
                );})}
              </>
            )}
            {!spotifyLoading && localResults.length > 0 && (
              <>
                <div
                  style={{
                    padding: "6px 12px 6px",
                    fontFamily: F,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    color: "rgba(55,48,107,0.7)",
                  }}
                >
                  People & fan clubs
                </div>
                {localResults.map((item) => {
                  const isUser = item.kind === "User" && item.userId;
                  const isFollowing = isUser && followingIds.includes(item.userId);
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderBottom: "1px solid rgba(148,163,184,0.25)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: F,
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontFamily: F,
                            fontSize: 11,
                            color: "rgba(55,48,107,0.6)",
                          }}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isUser && (
                          <button
                            type="button"
                            onClick={() => onOpenProfile?.(item.username)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: "1px solid rgba(148,163,184,0.6)",
                              background: "rgba(255,255,255,0.9)",
                              fontFamily: F,
                              fontSize: 10,
                              fontWeight: 600,
                              color: "#0f172a",
                              cursor: "pointer",
                            }}
                          >
                            View
                          </button>
                        )}
                        <span
                          style={{
                            fontFamily: F,
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            padding: "3px 8px",
                            borderRadius: 999,
                            background: "rgba(148,163,184,0.12)",
                            color: "rgba(51,65,85,0.9)",
                          }}
                        >
                          {item.kind}
                        </span>
                        <button
                          type="button"
                          onClick={
                            isUser && item.userId
                              ? () => onToggleFollow?.(item.userId, !isFollowing)
                              : undefined
                          }
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "none",
                            fontFamily: F,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isUser && isFollowing
                              ? "rgba(34,197,94,0.15)"
                              : "linear-gradient(135deg, #0ea5e9, #6366f1)",
                            color: isUser && isFollowing ? "#16a34a" : "#fff",
                            cursor: isUser ? "pointer" : "default",
                            boxShadow: "0 3px 10px rgba(37,99,235,0.4)",
                          }}
                        >
                          {isUser ? (isFollowing ? "Following" : "Follow +") : `${item.action} +`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Recommended Artists */}
      <SectionTitle>Recommended Artists</SectionTitle>
      <Card style={{ padding: "12px 0 8px", marginBottom: 10 }}>
        <HorizontalList>
          {artists.map((artist) => (
            <PersonCard
              key={artist.id}
              title={artist.name}
              subtitle={artist.subtitle}
              imageUrl={artistImages[artist.name]}
              primaryLabel="Follow +"
              onPrimaryClick={onFollowRecommendedArtist ? () => onFollowRecommendedArtist(artist.name) : undefined}
              onCardClick={onOpenHerd ? () => onOpenHerd(artist.name) : undefined}
            />
          ))}
        </HorizontalList>
        <div
          style={{
            padding: "0 16px 4px",
            fontFamily: F,
            fontSize: 11,
            color: "rgba(55,48,107,0.6)",
          }}
        >
          Tap Follow to add artists to track.
        </div>
      </Card>

      {/* Recommended Friends */}
      <SectionTitle>Recommended Friends</SectionTitle>
      <Card style={{ padding: "12px 0 8px", marginBottom: 16 }}>
        {friends.length > 0 ? (
          <HorizontalList>
            {friends.map((friend) => (
              <PersonCard
                key={friend.id}
                title={friend.name}
                subtitle={friend.subtitle}
                primaryLabel="Add +"
                imageUrl={friend.profileImageUrl}
                avatarId={friend.avatarId}
                isFollowing={followingIds.includes(friend.id)}
                onToggleFollow={onToggleFollow}
                onOpenProfile={onOpenProfile}
                userId={friend.id}
                username={friend.username}
              />
            ))}
          </HorizontalList>
        ) : (
          <div
            style={{
              padding: "8px 16px 10px",
              fontFamily: F,
              fontSize: 12,
              color: "rgba(55,48,107,0.7)",
            }}
          >
            No friends to recommend yet. Invite others to join Herd to see them here.
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <div
        style={{
          padding: "4px 20px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: F,
            fontSize: 14,
            fontWeight: 700,
            color: theme.text,
          }}
        >
          Your Recent Activity
        </span>
        {Array.isArray(recentActivity) && recentActivity.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAllActivityPopup(true)}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              fontFamily: F,
              fontSize: 12,
              fontWeight: 600,
              color: theme.accent,
              cursor: "pointer",
            }}
          >
            View All
          </button>
        )}
      </div>
      <Card style={{ padding: "12px 16px 8px", marginBottom: 12 }}>
        {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
          recentActivity.slice(0, 6).map((item, idx, arr) => (
            <ActivityItem key={item.id} item={item} isLast={idx === arr.length - 1} />
          ))
        ) : (
          <div
            style={{
              padding: "8px 4px 4px",
              fontFamily: F,
              fontSize: 12,
              color: "rgba(55,48,107,0.7)",
            }}
          >
            No recent activity yet. As you add concerts, merch, and follow fans, updates will appear here.
          </div>
        )}
      </Card>

      {showAllActivityPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAllActivityPopup(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              maxHeight: "85vh",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(13,148,136,0.12)",
              }}
            >
              <span
                style={{
                  fontFamily: F,
                  fontSize: 15,
                  fontWeight: 700,
                  color: theme.text,
                }}
              >
                All Recent Activity
              </span>
              <button
                type="button"
                onClick={() => setShowAllActivityPopup(false)}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 22,
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 4,
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "12px 16px 8px",
              }}
            >
              {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                recentActivity.map((item, idx, arr) => (
                  <ActivityItem key={item.id} item={item} isLast={idx === arr.length - 1} />
                ))
              ) : (
                <div
                  style={{
                    padding: "8px 4px 4px",
                    fontFamily: F,
                    fontSize: 12,
                    color: "rgba(55,48,107,0.7)",
                  }}
                >
                  No recent activity yet. As you add concerts, merch, and follow fans, updates will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Milestone placeholder (hidden for now) */}
      {/* We can show this when we define concrete milestone rules */}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        padding: "4px 20px 6px",
        fontFamily: F,
        fontSize: 14,
        fontWeight: 700,
        color: theme.text,
      }}
    >
      {children}
    </div>
  );
}

function HorizontalList({ children }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "4px 16px 8px",
        overflowX: "auto",
      }}
    >
      {children}
    </div>
  );
}

function PersonCard({
  title,
  subtitle,
  primaryLabel,
  imageUrl,
  avatarId,
  isFollowing,
  onToggleFollow,
  onOpenProfile,
  onCardClick,
  userId,
  username,
  onPrimaryClick,
}) {
  const cardContent = (
    <>
      <div
        style={{
          height: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: imageUrl
            ? "transparent"
            : "radial-gradient(circle at 10% 0%, #f97316, #0ea5e9 60%, #1d4ed8)",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 6px 18px rgba(15,23,42,0.35)",
            }}
          />
        ) : typeof avatarId === "number" ? (
          <AvatarSprite avatarId={avatarId} size={52} />
        ) : null}
      </div>
      <div style={{ padding: "10px 12px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <div
            style={{
              fontFamily: F,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {title}
          </div>
          {username && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenProfile?.(username); }}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                fontFamily: F,
                fontSize: 11,
                color: "rgba(191,219,254,0.9)",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              View
            </button>
          )}
        </div>
        <div
          style={{
            fontFamily: F,
            fontSize: 11,
            color: "rgba(226,232,240,0.85)",
            marginBottom: 10,
          }}
        >
          {subtitle}
        </div>
      </div>
    </>
  );

  return (
    <div
      style={{
        minWidth: 150,
        maxWidth: 180,
        background:
          "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,64,175,0.8))",
        borderRadius: 16,
        overflow: "hidden",
        color: "#fff",
        boxShadow: "0 10px 25px rgba(15,23,42,0.5)",
        position: "relative",
      }}
    >
      {onCardClick ? (
        <div
          role="button"
          tabIndex={0}
          onClick={onCardClick}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onCardClick(); }}
          style={{ cursor: "pointer" }}
        >
          {cardContent}
        </div>
      ) : (
        cardContent
      )}
      <div style={{ padding: "0 12px 12px" }}>
        <button
          type="button"
          onClick={
            userId && onToggleFollow
              ? () => onToggleFollow(userId, !isFollowing)
              : onPrimaryClick
          }
          style={{
            width: "100%",
            padding: "7px 0",
            borderRadius: 999,
            border: "none",
            fontFamily: F,
            fontSize: 12,
            fontWeight: 700,
            background: userId && isFollowing
              ? "rgba(34,197,94,0.15)"
              : "linear-gradient(135deg, #38bdf8, #6366f1, #a855f7)",
            color: userId && isFollowing ? "#4ade80" : "#fff",
            boxShadow: "0 4px 14px rgba(59,130,246,0.6)",
            cursor: userId || onPrimaryClick ? "pointer" : "default",
          }}
        >
          {userId && isFollowing ? "Following" : primaryLabel}
        </button>
      </div>
    </div>
  );
}

