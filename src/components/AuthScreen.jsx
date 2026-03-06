import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../context/ThemeContext";
import { GradientBg, Card, Btn, Btn2, Inp } from "./ui";

const F = "'DM Sans', sans-serif";

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
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
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
    const name = authUser.user_metadata?.display_name ?? uname;
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
      if (
        !email?.trim() ||
        !username?.trim() ||
        !password ||
        !phone?.trim() ||
        !age?.trim() ||
        !gender?.trim() ||
        !country?.trim()
      ) {
        return setError("All signup fields marked * are required.");
      }
      const ageNumber = parseInt(age, 10);
      if (!Number.isFinite(ageNumber) || ageNumber <= 0) {
        return setError("Please enter a valid age.");
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
          const ageNumber = parseInt(age, 10);
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: username.trim(),
                username: username.trim(),
                phone: phone.trim() || null,
                age: Number.isFinite(ageNumber) ? ageNumber : null,
                gender: gender.trim() || null,
                country: country.trim() || null,
                region: region.trim() || null,
              },
            },
          });
          if (authError) throw authError;
          const authUser = data?.user ?? data?.session?.user;
          if (authUser) {
            const profile = await getOrCreateProfile(
              authUser,
              username.trim(),
              phone.trim(),
              Number.isFinite(ageNumber) ? ageNumber : null,
              gender.trim() || null,
              country.trim() || null,
              region.trim() || null
            );
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

    if (mode === "signup") onAuth({ id: "mock", email, phone, username, display_name: username, avatar_id: 7 });
    else onAuth({ id: "mock", email, phone: "", username: email.split("@")[0], display_name: email.split("@")[0], avatar_id: 7 });
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

  return (
    <GradientBg>
      <div style={{ padding: "60px 24px 40px", textAlign: "center" }}>
        {backendUnavailable && !error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: theme.accentLight, border: `1px solid ${theme.accent}60`, borderRadius: 12, textAlign: "left" }}>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Backend may be unavailable</div>
            <div style={{ fontFamily: F, fontSize: 12, color: theme.textMuted, lineHeight: 1.5, marginBottom: 10 }}>Supabase could be Paused or Unhealthy. Restore or restart it in the Supabase dashboard, or open the app in demo mode below.</div>
            <button type="button" onClick={handleOpenDemoMode} style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: theme.accent, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Open in demo mode</button>
          </div>
        )}
        <img src="/goat-headphones.png" alt="Herd" style={{ width: 88, height: 88, objectFit: "contain", marginBottom: 8, filter: "brightness(1.05) contrast(1.05)" }} />
        <div style={{ fontFamily: F, fontSize: 32, fontWeight: 800, color: theme.text }}>Herd</div>
        <div style={{ fontFamily: F, fontSize: 14, color: theme.textMuted, marginTop: 4, marginBottom: 32 }}>Prove you&apos;re the Goat</div>
        <Card style={{ margin: "0 0 20px", padding: "24px 20px" }}>
          <div style={{ display: "flex", marginBottom: 24, background: theme.accentLight, borderRadius: 10, padding: 3 }}>
            {["login", "signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                  setMessage("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: mode === m ? theme.cardBg : "transparent",
                  boxShadow: mode === m ? theme.cardShadow : "none",
                  fontFamily: F,
                  fontSize: 14,
                  fontWeight: 600,
                  color: mode === m ? theme.accent : theme.textSoft,
                  cursor: "pointer",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <>
                <Inp label="Username" value={username} onChange={setUsername} placeholder="JaneDoe" />
                <Inp label="Phone *" type="tel" value={phone} onChange={setPhone} placeholder="(555) 123-4567" required />
                <Inp label="Age *" type="number" value={age} onChange={setAge} placeholder="25" required />
                <Inp label="Gender *" value={gender} onChange={setGender} placeholder="Female, Male, Non-binary, etc." required />
                <Inp label="Country *" value={country} onChange={setCountry} placeholder="United States" required />
                <Inp label="Region / State" value={region} onChange={setRegion} placeholder="California" />
              </>
            )}
            <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" autoComplete="email" />
            {mode === "login" && (
              <div style={{ fontFamily: F, fontSize: 11, color: theme.textMuted, marginTop: -8, marginBottom: 12 }}>
                Use the email you signed up with, not your username.
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
                    color: theme.accent,
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
                <div style={{ fontFamily: F, fontSize: 13, color: "#f87171", padding: "10px 12px", background: "rgba(248,113,113,0.15)", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)" }}>
                  {error}
                  {isBackendUnavailableError(error) && <BackendRecovery theme={theme} />}
                </div>
              )}
              {message && !error && (
                <div style={{ marginTop: 4, fontFamily: F, fontSize: 13, color: theme.accent, padding: "8px 10px", background: theme.accentLight, borderRadius: 8, border: `1px solid ${theme.accent}40` }}>
                  {message}
                </div>
              )}
            </div>
            <Btn type="submit" disabled={loading}>{loading ? "…" : mode === "login" ? "Log In" : "Create Account"}</Btn>
            {showBackendHelp && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: theme.cardBorder, textAlign: "center" }}>
                <div style={{ fontFamily: F, fontSize: 12, color: theme.textMuted, marginBottom: 10 }}>
                  Backend unavailable? You can open the app in demo mode (no saved data).
                </div>
                <button
                  type="button"
                  onClick={handleOpenDemoMode}
                  style={{
                    fontFamily: F,
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.accent,
                    background: theme.accentLight,
                    border: theme.btnSecondaryBorder,
                    borderRadius: 10,
                    padding: "10px 20px",
                    cursor: "pointer",
                  }}
                >
                  Open in demo mode
                </button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </GradientBg>
  );
}
