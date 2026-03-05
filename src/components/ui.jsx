import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export const F = "'DM Sans', sans-serif";

export const AvatarSprite = ({ avatarId, size = 72, imageUrl }) => {
  const id = Math.max(0, Math.min(11, Number(avatarId) || 0));
  const [spriteError, setSpriteError] = React.useState(false);
  const [customError, setCustomError] = React.useState(false);

  if (imageUrl && !customError) {
    return (
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={() => setCustomError(true)}
      />
    );
  }

  if (spriteError) {
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
      onError={() => setSpriteError(true)}
    />
  );
};

export function AvatarPicker({ selectedId, onSelect, onClose, onUploadImage }) {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file && onUploadImage) {
      onUploadImage(file);
    }
    if (event.target) event.target.value = "";
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: theme.modalOverlay, zIndex: 9998 }} onClick={onClose} />
      <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 9999, background: theme.modalBg, backdropFilter: "blur(16px)", borderRadius: 22, padding: 24, boxShadow: theme.cardShadow, border: theme.modalBorder }}>
        <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: theme.modalText, marginBottom: 16, textAlign: "center" }}>Choose your avatar</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              style={{ padding: 4, border: selectedId === i ? `3px solid ${theme.accent}` : "2px solid transparent", borderRadius: "50%", background: "none", cursor: "pointer" }}
            >
              <AvatarSprite avatarId={i} size={64} />
            </button>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        {onUploadImage && (
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ marginTop: 16, width: "100%", padding: "10px", border: "none", borderRadius: 14, background: theme.btnPrimaryBg, color: theme.btnPrimaryText, fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: theme.btnPrimaryShadow }}>
            Upload Profile Picture
          </button>
        )}
        <button type="button" onClick={onClose} style={{ marginTop: 10, width: "100%", padding: "10px", border: "none", borderRadius: 14, background: theme.accentLight, color: theme.accent, fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </>
  );
}

export function GradientBg({ children }) {
  const { theme } = useTheme();
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", paddingBottom: 88, background: theme.bg, fontFamily: F, position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
      {children}
    </div>
  );
}

export function Card({ children, style, ...rest }) {
  const { theme } = useTheme();
  return (
    <div style={{ margin: "0 16px 16px", background: theme.cardBg, backdropFilter: "blur(16px)", borderRadius: 22, border: theme.cardBorder, boxShadow: theme.cardShadow, overflow: "hidden", ...style }} {...rest}>{children}</div>
  );
}

export function Btn({ children, onClick, disabled, style, type = "button" }) {
  const { theme } = useTheme();
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "14px 0", borderRadius: 18, border: "none", background: disabled ? theme.accentLight : theme.btnPrimaryBg, color: theme.btnPrimaryText, fontFamily: F, fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : theme.btnPrimaryShadow, ...style }}>{children}</button>
  );
}

export function Btn2({ children, onClick, style }) {
  const { theme } = useTheme();
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "14px 0", borderRadius: 18, border: theme.btnSecondaryBorder, background: theme.btnSecondaryBg, color: theme.btnSecondaryText, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", ...style }}>{children}</button>
  );
}

export function Inp({ label, type, value, onChange, placeholder, autoComplete, required }) {
  const { theme } = useTheme();
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: theme.label, display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: theme.inputBorder, background: theme.inputBg, fontFamily: F, fontSize: 14, color: theme.inputText, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

export function TabBar({ active, onSelect }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${theme.tabBarBorder}`, marginBottom: 20 }}>
      {["Curate", "Digital", "Physical", "Live"].map((t) => (
        <button key={t} onClick={() => onSelect(t)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", color: active === t ? theme.tabActive : theme.tabInactive, fontFamily: F, fontSize: 15, fontWeight: active === t ? 700 : 500, cursor: "pointer", position: "relative" }}>
          {t}
          {active === t && <span style={{ position: "absolute", bottom: -1, left: "30%", right: "30%", height: 3, borderRadius: 2, background: theme.tabIndicator }} />}
        </button>
      ))}
    </div>
  );
}

export function BottomNav({ active, onSelect }) {
  const { theme } = useTheme();
  const items = [
    { id: "Feed", label: "Feed", iconSrc: "/Nav/Navigation Bar 1JPG.jpg" },
    { id: "Herds", label: "Herds", iconSrc: "/Nav/Navigation Bar 2JPG.jpg" },
    { id: "Search", label: "Search", iconSrc: "/Nav/Navigation Bar 3JPG.jpg" },
    { id: "DMs", label: "DMs", iconSrc: "/Nav/DMs-icon.jpg" },
    { id: "Profile", label: "Profile", iconSrc: "/Nav/Navigation Bar 5JPG.jpg" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        padding: "8px 16px 16px",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        background: theme.navBg,
        borderTop: theme.navBorder,
        backdropFilter: "blur(16px)",
        boxShadow: theme.navShadow,
        zIndex: 20,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              style={{
                flex: 1,
                border: "none",
                background: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: F,
                fontSize: 11,
                color: isActive ? theme.navActive : theme.navInactive,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 4px",
                  borderRadius: 999,
                  background: isActive ? theme.navActiveBg : "transparent",
                  border: isActive ? `1px solid ${theme.accent}` : "1px solid transparent",
                  boxShadow: isActive ? "0 4px 10px rgba(0,0,0,0.2)" : "none",
                  transition: "all 0.18s ease-out",
                }}
              >
                <img
                  src={item.iconSrc}
                  alt={item.label}
                  style={{
                    width: (item.id === "Search" || item.id === "DMs") ? 28 : 22,
                    height: (item.id === "Search" || item.id === "DMs") ? 28 : 22,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                <span style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function ProfileHeader({ user, onViewPublicProfile, onAvatarChange, supabase, showAvatarPicker, onCloseAvatarPicker, onOpenAvatarPicker, onProfileImageSelected }) {
  const { theme } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const avatarId = user?.avatar_id ?? 7;
  const profileImageUrl = user?.profile_image_url || null;

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
        style={{ width: 72, height: 72, borderRadius: "50%", border: "none", padding: 0, cursor: (onAvatarChange || onOpenAvatarPicker) ? "pointer" : "default", flexShrink: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: theme.avatarFallbackBg, fontFamily: F, fontSize: 24, fontWeight: 700, color: "#fff" }}
      >
        <AvatarSprite avatarId={avatarId} size={72} imageUrl={profileImageUrl} />
      </button>
      <div>
        <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: theme.text }}>{user?.display_name}</div>
        <div style={{ fontFamily: F, fontSize: 13, color: theme.textMuted, marginTop: 2 }}>@{user?.username}</div>
      </div>
      {pickerOpen && <AvatarPicker selectedId={avatarId} onSelect={handleSelect} onClose={handleClosePicker} onUploadImage={onProfileImageSelected} />}
    </div>
  );
}

export function Sec({ children, icon, right, onRightClick, onToggle, isOpen }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", marginBottom: 10, marginTop: 4 }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: onToggle ? "pointer" : "default" }}
        onClick={onToggle}
      >
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: theme.text }}>{children}</span>
        {onToggle && (
          <span style={{ marginLeft: 6, fontSize: 14, color: theme.textSoft }}>
            {isOpen ? "▾" : "▸"}
          </span>
        )}
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
            color: theme.accent,
            cursor: onRightClick ? "pointer" : "default",
          }}
        >
          {right}
        </button>
      )}
    </div>
  );
}

export function Stats({ stats }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: "flex", margin: "0 20px 16px", background: theme.cardBg, backdropFilter: "blur(12px)", borderRadius: 18, border: theme.cardBorder }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flex: 1, display: "flex" }}>
          <div style={{ flex: 1, textAlign: "center", padding: "10px 4px" }}>
            <div style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: theme.text }}>{s.value}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: theme.textSoft, fontWeight: 500 }}>{s.label}</div>
          </div>
          {i < stats.length - 1 && <div style={{ width: 1, background: theme.statDivider, margin: "8px 0" }} />}
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon, title, desc, btn, onAction }) {
  const { theme } = useTheme();
  return (
    <Card style={{ padding: "32px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: theme.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: F, fontSize: 13, color: theme.textMuted, lineHeight: 1.6, marginBottom: 20 }}>{desc}</div>
      {btn && <Btn onClick={onAction} style={{ width: "auto", padding: "12px 32px", display: "inline-block" }}>{btn}</Btn>}
    </Card>
  );
}

export function BadgeShape({ icon, title, description, size = 44 }) {
  const { theme } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const tip = description ? `${title}\n${description}` : title;
  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        title={tip}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: theme.accentLight,
          border: `2px solid ${theme.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.5,
          flexShrink: 0,
        }}
      >
        {icon || "🏅"}
      </div>
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%) translateY(-6px)",
            padding: "6px 10px",
            borderRadius: 10,
            background: theme.modalBg,
            color: theme.modalText,
            border: theme.modalBorder,
            fontFamily: F,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: "nowrap",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            boxShadow: theme.cardShadow,
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
}

export function ThemeToggle() {
  const { mode, setMode, theme } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setMode("bright")}
        style={{
          padding: "6px 10px",
          border: "none",
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
          fontFamily: F,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          background: mode === "bright" ? theme.accentLight : "transparent",
          color: mode === "bright" ? theme.accent : theme.textMuted,
        }}
      >
        Bright
      </button>
      <button
        type="button"
        onClick={() => setMode("dark")}
        style={{
          padding: "6px 10px",
          border: "none",
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
          fontFamily: F,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          background: mode === "dark" ? theme.accentLight : "transparent",
          color: mode === "dark" ? theme.accent : theme.textMuted,
        }}
      >
        Dark
      </button>
    </div>
  );
}
