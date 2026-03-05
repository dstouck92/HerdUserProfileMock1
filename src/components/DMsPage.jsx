import React, { useEffect, useState, useRef } from "react";
import { Card, F, AvatarSprite } from "./ui";
import { supabase } from "../lib/supabase";
import { useDebounce } from "../hooks/useDebounce";

export default function DMsPage({ user, supabase: supabaseClient }) {
  const sb = supabaseClient || supabase;
  const [searchQ, setSearchQ] = useState("");
  const debouncedQ = useDebounce(searchQ, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequestToIds, setSentRequestToIds] = useState(new Set());
  const [requestProfiles, setRequestProfiles] = useState({});
  const [conversations, setConversations] = useState([]);
  const [convProfiles, setConvProfiles] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);

  const [openConversationId, setOpenConversationId] = useState(null);
  const [openOtherUser, setOpenOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  const me = user?.id;

  // User search
  useEffect(() => {
    if (!sb || !me || !debouncedQ.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    (async () => {
      const q = `%${debouncedQ.trim().toLowerCase()}%`;
      const { data, error } = await sb
        .from("profiles")
        .select("id, display_name, username, avatar_id")
        .neq("id", me)
        .or(`username.ilike.${q},display_name.ilike.${q}`)
        .limit(20);
      if (cancelled) return;
      setSearchResults(error ? [] : (data || []));
      setSearching(false);
    })();
    return () => { cancelled = true; };
  }, [sb, me, debouncedQ]);

  // Incoming requests (to_user_id = me, status = pending) and sent requests (from_user_id = me, status = pending)
  useEffect(() => {
    if (!sb || !me) return;
    let cancelled = false;
    (async () => {
      const [incomingRes, sentRes] = await Promise.all([
        sb.from("dm_conversation_requests").select("id, from_user_id, to_user_id, status, created_at").eq("to_user_id", me).eq("status", "pending"),
        sb.from("dm_conversation_requests").select("to_user_id").eq("from_user_id", me).eq("status", "pending"),
      ]);
      if (cancelled) return;
      const list = incomingRes.error ? [] : (incomingRes.data || []);
      setIncomingRequests(list);
      const sentTo = new Set((sentRes.data || []).map((r) => r.to_user_id));
      if (!cancelled) setSentRequestToIds(sentTo);
      const fromIds = [...new Set(list.map((r) => r.from_user_id))];
      if (fromIds.length > 0) {
        const { data: profs } = await sb.from("profiles").select("id, display_name, username, avatar_id").in("id", fromIds);
        const map = {};
        (profs || []).forEach((p) => { map[p.id] = p; });
        if (!cancelled) setRequestProfiles(map);
      } else if (!cancelled) setRequestProfiles({});
    })();
    return () => { cancelled = true; };
  }, [sb, me]);

  // Accepted conversations list
  useEffect(() => {
    if (!sb || !me) {
      setLoadingConvs(false);
      return;
    }
    let cancelled = false;
    setLoadingConvs(true);
    (async () => {
      const { data: convs, error } = await sb
        .from("dm_conversations")
        .select("id, user_a_id, user_b_id, updated_at")
        .or(`user_a_id.eq.${me},user_b_id.eq.${me}`)
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      const list = error ? [] : (convs || []);
      setConversations(list);
      const otherIds = list.map((c) => (c.user_a_id === me ? c.user_b_id : c.user_a_id));
      const uniq = [...new Set(otherIds)];
      if (uniq.length > 0) {
        const { data: profs } = await sb
          .from("profiles")
          .select("id, display_name, username, avatar_id")
          .in("id", uniq);
        const map = {};
        (profs || []).forEach((p) => { map[p.id] = p; });
        if (!cancelled) setConvProfiles(map);
      } else if (!cancelled) setConvProfiles({});
      const convIds = list.map((c) => c.id);
      if (convIds.length > 0) {
        const { data: msgs } = await sb
          .from("dm_messages")
          .select("id, conversation_id, sender_id, body, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false });
        const byConv = {};
        (msgs || []).forEach((m) => {
          if (!byConv[m.conversation_id]) byConv[m.conversation_id] = m;
        });
        if (!cancelled) setLastMessages(byConv);
      } else if (!cancelled) setLastMessages({});
      setLoadingConvs(false);
    })();
    return () => { cancelled = true; };
  }, [sb, me, openConversationId]);

  const handleAcceptRequest = async (requestId) => {
    if (!sb || !me) return;
    const req = incomingRequests.find((r) => r.id === requestId);
    if (!req || req.status !== "pending") return;
    setAcceptingId(requestId);
    try {
      const a = req.from_user_id < req.to_user_id ? req.from_user_id : req.to_user_id;
      const b = req.from_user_id < req.to_user_id ? req.to_user_id : req.from_user_id;
      await sb.from("dm_conversations").insert({ user_a_id: a, user_b_id: b, updated_at: new Date().toISOString() });
      await sb.from("dm_conversation_requests").update({ status: "accepted" }).eq("id", requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setRequestProfiles((prev) => {
        const next = { ...prev };
        delete next[req.from_user_id];
        return next;
      });
      setConversations((prev) => {
        const added = { id: crypto.randomUUID(), user_a_id: a, user_b_id: b, updated_at: new Date().toISOString() };
        return [added, ...prev];
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    if (!sb || !me) return;
    setDecliningId(requestId);
    try {
      await sb.from("dm_conversation_requests").update({ status: "declined" }).eq("id", requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setDecliningId(null);
    }
  };

  const handleRequestConversation = async (otherUserId) => {
    if (!sb || !me) return;
    try {
      await sb.from("dm_conversation_requests").upsert(
        { from_user_id: me, to_user_id: otherUserId, status: "pending" },
        { onConflict: "from_user_id,to_user_id" }
      );
      setSentRequestToIds((prev) => new Set([...prev, otherUserId]));
      setSearchQ("");
      setSearchResults([]);
    } catch (_) {}
  };

  const handleOpenConversation = (conv, otherUser) => {
    setOpenConversationId(conv.id);
    setOpenOtherUser(otherUser);
    setMessages([]);
    setNewBody("");
  };

  const loadMessages = async (convId) => {
    if (!sb) return;
    setMessagesLoading(true);
    const { data, error } = await sb
      .from("dm_messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(error ? [] : (data || []));
    setMessagesLoading(false);
  };

  useEffect(() => {
    if (!openConversationId) return;
    loadMessages(openConversationId);
  }, [openConversationId]);

  useEffect(() => {
    if (!openConversationId || !sb) return;
    const channel = sb
      .channel(`dm:${openConversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${openConversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      channel?.unsubscribe();
      channelRef.current = null;
    };
  }, [openConversationId, sb]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const body = (newBody || "").trim();
    if (!body || !sb || !me || !openConversationId) return;
    setSending(true);
    try {
      const { error } = await sb.from("dm_messages").insert({
        conversation_id: openConversationId,
        sender_id: me,
        body,
      });
      if (!error) {
        setNewBody("");
        await sb
          .from("dm_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", openConversationId);
      }
    } finally {
      setSending(false);
    }
  };

  const hasExistingConversation = (otherId) =>
    conversations.some(
      (c) => (c.user_a_id === me && c.user_b_id === otherId) || (c.user_b_id === me && c.user_a_id === otherId)
    );
  const pendingRequestToMe = (otherId) =>
    incomingRequests.some((r) => r.from_user_id === otherId && r.to_user_id === me);
  const pendingRequestFromMe = (otherId) => sentRequestToIds.has(otherId);

  const getOtherUser = (conv) => (conv.user_a_id === me ? conv.user_b_id : conv.user_a_id);
  const displayName = (p) => p?.display_name || p?.username || "User";

  if (!me) {
    return (
      <div style={{ padding: 24, fontFamily: F, fontSize: 14, color: "rgba(55,48,107,0.7)" }}>
        Sign in to use DMs.
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: "16px 20px 12px" }}>
        <input
          type="text"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search users to message…"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(13,148,136,0.25)",
            fontFamily: F,
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
        {searching && (
          <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)", marginTop: 6 }}>Searching…</div>
        )}
        {debouncedQ.trim() && searchResults.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {searchResults.map((p) => {
              const hasConv = hasExistingConversation(p.id);
              const fromThem = pendingRequestToMe(p.id);
              const fromMe = pendingRequestFromMe(p.id);
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: 12,
                    border: "1px solid rgba(13,148,136,0.12)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <AvatarSprite avatarId={p.avatar_id} size={36} />
                    <div>
                      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>
                        {displayName(p)}
                      </div>
                      {p.username && (
                        <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)" }}>@{p.username}</div>
                      )}
                    </div>
                  </div>
                  {hasConv ? (
                    <button
                      type="button"
                      onClick={() => {
                        const conv = conversations.find(
                          (c) => (c.user_a_id === me && c.user_b_id === p.id) || (c.user_b_id === me && c.user_a_id === p.id)
                        );
                        if (conv) handleOpenConversation(conv, p);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "none",
                        background: "linear-gradient(135deg, #0d9488, #10b981)",
                        color: "#fff",
                        fontFamily: F,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Message
                    </button>
                  ) : fromThem ? (
                    <span style={{ fontFamily: F, fontSize: 12, color: "#0d9488" }}>Accept in requests below</span>
                  ) : fromMe ? (
                    <span style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)" }}>Request sent</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestConversation(p.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(13,148,136,0.5)",
                        background: "rgba(16,185,129,0.12)",
                        color: "#0f766e",
                        fontFamily: F,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Request conversation
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {incomingRequests.length > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>
            Requests
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {incomingRequests.map((r) => {
              const p = requestProfiles[r.from_user_id];
              if (!p) return null;
              return (
                <Card key={r.id} style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <AvatarSprite avatarId={p.avatar_id} size={40} />
                    <div>
                      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>
                        {displayName(p)}
                      </div>
                      <div style={{ fontFamily: F, fontSize: 12, color: "rgba(55,48,107,0.6)" }}>
                        wants to start a conversation
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(r.id)}
                      disabled={decliningId === r.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.6)",
                        background: "#fff",
                        fontFamily: F,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        cursor: decliningId === r.id ? "default" : "pointer",
                      }}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(r.id)}
                      disabled={acceptingId === r.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "none",
                        background: "linear-gradient(135deg, #0d9488, #10b981)",
                        color: "#fff",
                        fontFamily: F,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: acceptingId === r.id ? "default" : "pointer",
                      }}
                    >
                      {acceptingId === r.id ? "Accepting…" : "Accept"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>
          Conversations
        </div>
        {loadingConvs ? (
          <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", padding: "16px 0" }}>
            Loading…
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", padding: "16px 0" }}>
            No conversations yet. Search for a user and request a conversation.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {conversations.map((conv) => {
              const otherId = getOtherUser(conv);
              const p = convProfiles[otherId];
              const last = lastMessages[conv.id];
              return (
                <Card
                  key={conv.id}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    border: "1px solid rgba(13,148,136,0.15)",
                  }}
                  onClick={() => p && handleOpenConversation(conv, p)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <AvatarSprite avatarId={p?.avatar_id} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>
                        {p ? displayName(p) : "…"}
                      </div>
                      <div
                        style={{
                          fontFamily: F,
                          fontSize: 12,
                          color: "rgba(55,48,107,0.65)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {last ? (last.sender_id === me ? `You: ${last.body}` : last.body) : "No messages yet"}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {openConversationId && openOtherUser && (
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
            if (e.target === e.currentTarget) setOpenConversationId(null);
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AvatarSprite avatarId={openOtherUser.avatar_id} size={36} />
                <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>
                  {displayName(openOtherUser)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenConversationId(null)}
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
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minHeight: 200,
              }}
            >
              {messagesLoading ? (
                <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", textAlign: "center", padding: 24 }}>
                  Loading…
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender_id === me ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      padding: "8px 12px",
                      borderRadius: 14,
                      background: m.sender_id === me ? "linear-gradient(135deg, #0d9488, #10b981)" : "rgba(226,232,240,0.8)",
                      color: m.sender_id === me ? "#fff" : "#1e1b4b",
                      fontFamily: F,
                      fontSize: 14,
                    }}
                  >
                    {m.body}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid rgba(13,148,136,0.12)",
                display: "flex",
                gap: 8,
              }}
            >
              <input
                type="text"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(13,148,136,0.25)",
                  fontFamily: F,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending || !newBody.trim()}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #0d9488, #10b981)",
                  color: "#fff",
                  fontFamily: F,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: sending || !newBody.trim() ? "default" : "pointer",
                  opacity: sending || !newBody.trim() ? 0.7 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
