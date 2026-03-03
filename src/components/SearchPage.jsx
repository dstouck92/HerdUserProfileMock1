import { useState } from "react";
import { Card, F, AvatarSprite } from "./ui";

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

export default function SearchPage({ recommendedFriends, followingIds = [], onToggleFollow, onOpenProfile, onOpenHerd, recommendedArtists, recentActivity }) {
  const [query, setQuery] = useState("");
  const friendsFromDb = Array.isArray(recommendedFriends)
    ? recommendedFriends.map((f) => ({
        id: f.id,
        name: f.displayName || f.username || "Friend",
        subtitle: f.username ? `@${f.username}` : "Herd user",
        username: f.username || "",
        avatarId: f.avatarId ?? 7,
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
  const searchResults = trimmedQuery
    ? searchIndex.filter((e) => e.name.toLowerCase().includes(trimmedQuery)).slice(0, 8)
    : [];

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
              color: "#1e1b4b",
            }}
          />
        </div>
      </div>

      {/* Search dropdown (local demo only) */}
      {trimmedQuery && (
        <div style={{ padding: "0 20px 8px" }}>
          <Card style={{ margin: 0, padding: "8px 0" }}>
            {searchResults.length > 0 ? (
              searchResults.map((item) => {
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
              );})
            ) : (
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
              primaryLabel="Follow +"
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
      <SectionTitle>Your Recent Activity</SectionTitle>
      <Card style={{ padding: "12px 16px 8px", marginBottom: 12 }}>
        {Array.isArray(recentActivity) && recentActivity.length > 0 ? recentActivity.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              paddingBottom: idx < recentActivity.length - 1 ? 12 : 4,
              borderBottom:
                idx < recentActivity.length - 1
                  ? "1px solid rgba(148,163,184,0.3)"
                  : "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 0%, #fee2e2, #0ea5e9)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: F,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1e293b",
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
        )) : (
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
        color: "#1e1b4b",
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

function PersonCard({ title, subtitle, primaryLabel, avatarId, isFollowing, onToggleFollow, onOpenProfile, onCardClick, userId, username }) {
  const cardContent = (
    <>
      <div
        style={{
          height: 90,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 10% 0%, #f97316, #0ea5e9 60%, #1d4ed8)",
        }}
      >
        {typeof avatarId === "number" ? (
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
          onClick={userId ? () => onToggleFollow?.(userId, !isFollowing) : undefined}
          style={{
            width: "100%",
            padding: "7px 0",
            borderRadius: 999,
            border: "none",
            fontFamily: F,
            fontSize: 12,
            fontWeight: 700,
            background: isFollowing
              ? "rgba(34,197,94,0.15)"
              : "linear-gradient(135deg, #38bdf8, #6366f1, #a855f7)",
            color: isFollowing ? "#4ade80" : "#fff",
            boxShadow: "0 4px 14px rgba(59,130,246,0.6)",
            cursor: userId ? "pointer" : "default",
          }}
        >
          {isFollowing ? "Following" : primaryLabel}
        </button>
      </div>
    </div>
  );
}

