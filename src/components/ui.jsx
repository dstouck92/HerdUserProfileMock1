import React, { useState, useEffect } from "react";

export const F = "'DM Sans', sans-serif";

export const AvatarSprite = ({ avatarId, size = 72 }) => {
  const id = Math.max(0, Math.min(11, Number(avatarId) || 0));
  const [imgError, setImgError] = React.useState(false);
  if (imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F, fontSize: Math.round(size * 0.4), fontWeight: 700, color: "#fff" }}>
        {id + 1}
      </div>
    );
  }
  return (
    <img
      src={`/avatars/${id}.png`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      onError={() => setImgError(true)}
    />
  );
};

export const AvatarPicker = ({ selectedId, onSelect, onClose }) => {
  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9998 }} onClick={onClose} />
      <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 9999, background: "rgba(255,255,255,0.98)", backdropFilter: "blur(16px)", borderRadius: 20, padding: 24, boxShadow: "0 8px 32px rgba(13,148,136,0.2)", border: "1px solid rgba(13,148,136,0.2)" }}>
        <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 16, textAlign: "center" }}>Choose your avatar</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              style={{ padding: 4, border: selectedId === i ? "3px solid #0d9488" : "2px solid transparent", borderRadius: "50%", background: "none", cursor: "pointer" }}
            >
              <AvatarSprite avatarId={i} size={64} />
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} style={{ marginTop: 16, width: "100%", padding: "10px", border: "none", borderRadius: 12, background: "rgba(13,148,136,0.15)", color: "#0d9488", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </>
  );
};

export const GradientBg = ({ children }) => (
  <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "linear-gradient(165deg, #e0f2fe 0%, #cffafe 22%, #ccfbf1 45%, #d1fae5 70%, #dcfce7 100%)", fontFamily: F, position: "relative" }}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
    {children}
  </div>
);

export const Card = ({ children, style }) => (
  <div style={{ margin: "0 16px 16px", background: "rgba(255,255,255,0.65)", backdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 2px 16px rgba(13,148,136,0.08)", overflow: "hidden", ...style }}>{children}</div>
);

export const Btn = ({ children, onClick, disabled, style, type = "button" }) => (
  <button type={type} onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: disabled ? "rgba(13,148,136,0.3)" : "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : "0 4px 16px rgba(13,148,136,0.35)", ...style }}>{children}</button>
);

export const Btn2 = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "1px solid rgba(13,148,136,0.3)", background: "rgba(255,255,255,0.7)", color: "#0d9488", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", ...style }}>{children}</button>
);

export const Inp = ({ label, type, value, onChange, placeholder, autoComplete, required }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#0f766e", display: "block", marginBottom: 6 }}>{label}</label>
    <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(13,148,136,0.25)", background: "rgba(255,255,255,0.8)", fontFamily: F, fontSize: 14, color: "#1e1b4b", outline: "none", boxSizing: "border-box" }} />
  </div>
);

export const TabBar = ({ active, onSelect }) => (
  <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.15)", marginBottom: 20 }}>
    {["Curate", "Digital", "Physical", "Live"].map((t) => (
      <button key={t} onClick={() => onSelect(t)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", color: active === t ? "#0f766e" : "rgba(55,48,107,0.55)", fontFamily: F, fontSize: 15, fontWeight: active === t ? 700 : 500, cursor: "pointer", position: "relative" }}>
        {t}
        {active === t && <span style={{ position: "absolute", bottom: -1, left: "30%", right: "30%", height: 3, borderRadius: 2, background: "linear-gradient(90deg, #0d9488, #10b981)" }} />}
      </button>
    ))}
  </div>
);

export const ProfileHeader = ({ user, onViewPublicProfile, onAvatarChange, supabase, showAvatarPicker, onCloseAvatarPicker, onOpenAvatarPicker }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const avatarId = user?.avatar_id ?? 7;

  useEffect(() => {
    if (showAvatarPicker) setPickerOpen(true);
  }, [showAvatarPicker]);

  const handleSelect = (id) => {
    onAvatarChange?.(id);
    setPickerOpen(false);
    onCloseAvatarPicker?.();
  };

  const handleClosePicker = () => {
    setPickerOpen(false);
    onCloseAvatarPicker?.();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 20px 12px" }}>
      <button
        type="button"
        onClick={() => onOpenAvatarPicker ? onOpenAvatarPicker() : (onAvatarChange && setPickerOpen(true))}
        style={{ width: 72, height: 72, borderRadius: "50%", border: "none", padding: 0, cursor: (onAvatarChange || onOpenAvatarPicker) ? "pointer" : "default", flexShrink: 0, boxShadow: "0 4px 20px rgba(13,148,136,0.4)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0d9488, #10b981, #34d399)", fontFamily: F, fontSize: 24, fontWeight: 700, color: "#fff" }}
      >
        <AvatarSprite avatarId={avatarId} size={72} />
      </button>
      <div>
        <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: "#1e1b4b" }}>{user?.display_name}</div>
        <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.6)", marginTop: 2 }}>@{user?.username}</div>
        <button
          type="button"
          onClick={onViewPublicProfile}
          style={{ marginTop: 8, padding: "6px 24px", borderRadius: 20, border: "none", background: "linear-gradient(135deg, #0d9488, #10b981)", color: "#fff", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 12px rgba(13,148,136,0.35)" }}
        >
          Public Profile
        </button>
      </div>
      {pickerOpen && <AvatarPicker selectedId={avatarId} onSelect={handleSelect} onClose={handleClosePicker} />}
    </div>
  );
};

export const Sec = ({ children, icon, right, onRightClick }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", marginBottom: 10, marginTop: 4 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b" }}>{children}</span>
    </div>
    {right && (
      <button
        type="button"
        onClick={onRightClick}
        style={{
          border: "none",
          background: "none",
          padding: 0,
          fontFamily: F,
          fontSize: 13,
          fontWeight: 600,
          color: "#0d9488",
          cursor: onRightClick ? "pointer" : "default",
        }}
      >
        {right}
      </button>
    )}
  </div>
);

export const Stats = ({ stats }) => (
  <div style={{ display: "flex", margin: "0 20px 16px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.5)" }}>
    {stats.map((s, i) => (
      <div key={i} style={{ flex: 1, display: "flex" }}>
        <div style={{ flex: 1, textAlign: "center", padding: "10px 4px" }}>
          <div style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: "#1e1b4b" }}>{s.value}</div>
          <div style={{ fontFamily: F, fontSize: 11, color: "rgba(55,48,107,0.55)", fontWeight: 500 }}>{s.label}</div>
        </div>
        {i < stats.length - 1 && <div style={{ width: 1, background: "rgba(13,148,136,0.2)", margin: "8px 0" }} />}
      </div>
    ))}
  </div>
);

export const Empty = ({ icon, title, desc, btn, onAction }) => (
  <Card style={{ padding: "32px 24px", textAlign: "center" }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>{title}</div>
    <div style={{ fontFamily: F, fontSize: 13, color: "rgba(55,48,107,0.55)", lineHeight: 1.6, marginBottom: 20 }}>{desc}</div>
    {btn && <Btn onClick={onAction} style={{ width: "auto", padding: "12px 32px", display: "inline-block" }}>{btn}</Btn>}
  </Card>
);
