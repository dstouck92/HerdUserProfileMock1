import { useState } from "react";
import { Card, F, AvatarSprite } from "./ui";

const HERD_TABS = ["Topics", "Leaderboards", "Connect", "About"];

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
}) {
  const [herdTab, setHerdTab] = useState("Topics");

  const followingHerdIds = userHerds.map((h) => h.id);
  const isFollowingSelected =
    selectedHerdId && followingHerdIds.includes(selectedHerdId);

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
            {herdDetails.image_url ? (
              <img
                src={herdDetails.image_url}
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
                fontFamily: F,
                fontSize: 20,
                fontWeight: 800,
                color: "#1e1b4b",
                marginBottom: 8,
              }}
            >
              {herdDetails.name}
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
            <div
              style={{
                fontFamily: F,
                fontSize: 14,
                color: "rgba(55,48,107,0.7)",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              Topics (posts, likes, comments) — coming in next step.
            </div>
          )}
          {herdTab === "Leaderboards" && (
            <div
              style={{
                fontFamily: F,
                fontSize: 14,
                color: "rgba(55,48,107,0.7)",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              Leaderboards (top listeners) — coming soon.
            </div>
          )}
          {herdTab === "Connect" && (
            <div
              style={{
                fontFamily: F,
                fontSize: 14,
                color: "rgba(55,48,107,0.7)",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              Connect (fans who follow this herd) — coming soon.
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
                {herd.image_url ? (
                  <img
                    src={herd.image_url}
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
                {herd.image_url ? (
                  <img
                    src={herd.image_url}
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
