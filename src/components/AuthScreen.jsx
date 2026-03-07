import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../context/ThemeContext";
import { GradientBg, Card, Btn, Btn2, Inp } from "./ui";

const F = "'DM Sans', sans-serif";

function GoogleIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function isBackendUnavailableError(msg) {
  if (!msg || typeof msg !== "string") return false;
  const s = msg.toLowerCase();
  return (
    s.includes("timed out") ||
    s.includes("connection") ||
    s.includes("fetch failed") ||
    s.includes("failed to fetch") ||
    s.includes("network") ||
    s.includes("unhealthy") ||
    s.includes("unreachable") ||
    s.includes("econnrefused") ||
    s.includes("econnreset")
  );
}

function BackendRecovery({ theme }) {
  return (
    <div style={{ marginTop: 10, fontSize: 12, color: theme?.textMuted ?? "rgba(241,245,249,0.85)", lineHeight: 1.6 }}>
      <strong style={{ color: theme?.text }}>Fix the backend:</strong><br />
      1. <strong>Supabase</strong> — Open your project at supabase.com. If it says &quot;Paused&quot;, click <strong>Restore project</strong>. If it says <strong>Unhealthy</strong>, go to Project Settings → General and try <strong>Restart database</strong>, then wait a few minutes.<br />
      2. See <strong>docs/SUPABASE_UNHEALTHY.md</strong> in this repo for full steps.<br />
      3. Then reload this page and try again.
    </div>
  );
}

export default function AuthScreen({ onAuth }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    let timeoutId = null;
    const timeoutMs = 8000;
    (async () => {
      try {
        await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, rej) => {
            timeoutId = setTimeout(() => rej(new Error("Connection timed out")), timeoutMs);
          }),
        ]);
      } catch (_) {
        if (!cancelled) setBackendUnavailable(true);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    })();
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); };
  }, []);

  const showBackendHelp = backendUnavailable || (error && isBackendUnavailableError(error));
  const handleOpenDemoMode = () => {
    setError("");
    setMessage("");
    onAuth({ id: "demo", display_name: "Demo", username: "demo", avatar_id: 7 });
  };

  function fallbackProfile(authUser, username) {
    const uname = (username ?? authUser.user_metadata?.username ?? authUser.email?.split("@")[0] ?? "user").toString().trim() || "user";
    const name =
      authUser.user_metadata?.display_name ??
      authUser.user_metadata?.full_name ??
      authUser.user_metadata?.name ??
      uname;
    return { id: authUser.id, display_name: name, username: uname, avatar_id: 7 };
  }

  async function getOrCreateProfile(authUser, username, phone, age, gender, country, region) {
    const profile = fallbackProfile(authUser, username);
    const payload = {
      id: authUser.id,
      display_name: profile.display_name,
      username: profile.username,
      // Only update optional fields if we have a concrete value (from args or metadata).
      ...(phone != null || authUser.user_metadata?.phone != null
        ? { phone: phone ?? authUser.user_metadata?.phone }
        : {}),
      ...(age != null || authUser.user_metadata?.age != null
        ? { age: age ?? authUser.user_metadata?.age }
        : {}),
      ...(gender != null || authUser.user_metadata?.gender != null
        ? { gender: gender ?? authUser.user_metadata?.gender }
        : {}),
      ...(country != null || authUser.user_metadata?.country != null
        ? { country: country ?? authUser.user_metadata?.country }
        : {}),
      ...(region != null || authUser.user_metadata?.region != null
        ? { region: region ?? authUser.user_metadata?.region }
        : {}),
      ...(authUser.user_metadata?.avatar_url != null
        ? { profile_image_url: authUser.user_metadata.avatar_url }
        : {}),
      updated_at: new Date().toISOString(),
    };
    try {
      // Await upsert so the profile row exists before viewing public profile.
      await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
    } catch (_) {
      // Ignore; fallback profile is already returned and app can still load.
    }
    return profile;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const submit = async () => {
    setError("");
    setMessage("");
    if (mode === "signup") {
      if (!email?.trim() || !username?.trim() || !password) {
        return setError("Email, username, and password are required.");
      }
      if (password.length < 6) return setError("Password must be 6+ characters.");
    } else {
      if (!email || !password) return setError("Email and password required.");
    }

    if (supabase) {
      setLoading(true);
      setError("");
      setMessage("");
      try {
        if (mode === "signup") {
          const { data, error: authError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                display_name: username.trim(),
                username: username.trim(),
              },
            },
          });
          if (authError) throw authError;
          const authUser = data?.user ?? data?.session?.user;
          if (authUser) {
            const profile = await getOrCreateProfile(authUser, username.trim());
            onAuth(profile);
          } else {
            setError("Sign up succeeded but no user returned. Check your email to confirm, or try logging in.");
          }
        } else {
          const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          if (data && typeof console !== "undefined") console.log("signInWithPassword data:", data);
          const authUser = data?.user ?? data?.session?.user;
          if (authUser) {
            const profile = await getOrCreateProfile(authUser);
            onAuth(profile);
          } else {
            setError("Login succeeded but no session. Try again or check if email confirmation is required.");
          }
        }
      } catch (err) {
        if (err && typeof console !== "undefined") console.error("Auth error:", err);
        const errMsg = err?.message || "Something went wrong.";
        setError(errMsg);
        if (isBackendUnavailableError(errMsg)) setBackendUnavailable(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "signup") onAuth({ id: "mock", email, username, display_name: username, avatar_id: 7 });
    else onAuth({ id: "mock", email, username: email.split("@")[0], display_name: email.split("@")[0], avatar_id: 7 });
  };

  const handleSignInWithGoogle = async () => {
    if (!supabase) {
      setError("Google sign-in is unavailable because Supabase is not configured.");
      return;
    }
    setError("");
    setMessage("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (oauthError) throw oauthError;
      // User is redirected to Google; no need to call onAuth here.
    } catch (err) {
      if (err && typeof console !== "undefined") console.error("Google sign-in error:", err);
      setError(err?.message || "Could not start Google sign-in.");
    }
  };

  const handleResetPassword = async () => {
    if (!email?.trim()) {
      setError("Enter your email above first.");
      setMessage("");
      return;
    }
    if (!supabase) {
      setError("Password reset is unavailable because Supabase is not configured.");
      setMessage("");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (resetError) throw resetError;
      setMessage("Check your email for a link to reset your password.");
    } catch (err) {
      if (err && typeof console !== "undefined") console.error("Password reset error:", err);
      setError(err?.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const authBg = { background: "#0a0a0a", minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 88, fontFamily: F };
  const muted = "rgba(255,255,255,0.5)";
  const border = "1px solid rgba(255,255,255,0.1)";

  return (
    <div style={authBg}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <div style={{ padding: "48px 24px 32px", textAlign: "center" }}>
        {backendUnavailable && !error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(45,212,191,0.4)", borderRadius: 12, textAlign: "left" }}>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>Backend may be unavailable</div>
            <div style={{ fontFamily: F, fontSize: 12, color: muted, lineHeight: 1.5, marginBottom: 10 }}>Supabase could be Paused or Unhealthy. Restore or restart it in the Supabase dashboard, or open the app in demo mode below.</div>
            <button type="button" onClick={handleOpenDemoMode} style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: "#2dd4bf", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Open in demo mode</button>
          </div>
        )}
        <img src="/goat-headphones.png" alt="Herd" style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 12, filter: "brightness(1.05)" }} />
        <div style={{ fontFamily: F, fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Herd</div>
        <div style={{ fontFamily: F, fontSize: 13, color: muted, marginTop: 4, marginBottom: 32 }}>Prove you&apos;re the Goat</div>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            onClick={handleSignInWithGoogle}
            aria-label="Continue with Google"
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              border,
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <GoogleIcon size={24} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontFamily: F, fontSize: 12, color: muted }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border, padding: "20px 20px 24px" }}>
          <div style={{ display: "flex", marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
            {["login", "signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); setMessage(""); }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: mode === m ? "rgba(255,255,255,0.08)" : "transparent",
                  fontFamily: F,
                  fontSize: 14,
                  fontWeight: 600,
                  color: mode === m ? "#fff" : muted,
                  cursor: "pointer",
                }}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <Inp label="Username" value={username} onChange={setUsername} placeholder="JaneDoe" />
            )}
            <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" autoComplete="email" />
            {mode === "login" && (
              <div style={{ fontFamily: F, fontSize: 11, color: muted, marginTop: -8, marginBottom: 12 }}>
                Use the email you signed up with.
              </div>
            )}
            <Inp label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    fontFamily: F,
                    fontSize: 11,
                    color: "#2dd4bf",
                    textDecoration: "underline",
                    cursor: loading ? "default" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            )}
            <div role="alert" style={{ minHeight: error || message ? "auto" : 0, marginBottom: 12, textAlign: "left" }}>
              {error && (
                <div style={{ fontFamily: F, fontSize: 13, color: "#f87171", padding: "10px 12px", background: "rgba(248,113,113,0.12)", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)" }}>
                  {error}
                  {isBackendUnavailableError(error) && <BackendRecovery theme={theme} />}
                </div>
              )}
              {message && !error && (
                <div style={{ fontFamily: F, fontSize: 13, color: "#2dd4bf", padding: "8px 10px", background: "rgba(45,212,191,0.12)", borderRadius: 8, border: "1px solid rgba(45,212,191,0.3)" }}>
                  {message}
                </div>
              )}
            </div>
            <Btn type="submit" disabled={loading}>{loading ? "…" : mode === "login" ? "Log in" : "Create account"}</Btn>
            {showBackendHelp && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <div style={{ fontFamily: F, fontSize: 12, color: muted, marginBottom: 10 }}>Backend unavailable? Open in demo mode (no saved data).</div>
                <button type="button" onClick={handleOpenDemoMode} style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: "#2dd4bf", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(45,212,191,0.3)", borderRadius: 10, padding: "10px 20px", cursor: "pointer" }}>
                  Open in demo mode
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
