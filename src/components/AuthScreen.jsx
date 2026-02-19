import { useState } from "react";
import { supabase } from "../lib/supabase";
import { GradientBg, Card, Btn, Btn2, Inp } from "./ui";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fallbackProfile(authUser, displayName, username) {
    const name = displayName ?? authUser.user_metadata?.display_name ?? authUser.email?.split("@")[0] ?? "User";
    const uname = username ?? authUser.user_metadata?.username ?? authUser.email?.split("@")[0] ?? "user";
    return { id: authUser.id, display_name: name, username: uname };
  }

  async function getOrCreateProfile(authUser, displayName, username, phone) {
    // Never block login on profile table; use best-effort background upsert.
    const profile = fallbackProfile(authUser, displayName, username);
    const payload = {
      id: authUser.id,
      display_name: profile.display_name,
      username: profile.username,
      phone: phone ?? authUser.user_metadata?.phone ?? null,
      updated_at: new Date().toISOString(),
    };
    try {
      // Fire-and-forget; ignore any errors so auth flow isn't affected.
      supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .catch(() => {});
    } catch (_) {
      // Ignore; fallback profile is already returned.
    }
    return profile;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const submit = async () => {
    setError("");
    if (mode === "signup") {
      if (!email?.trim() || !username?.trim() || !displayName?.trim() || !password) return setError("All fields required.");
      if (!phone?.trim()) return setError("Phone number is required.");
      if (password.length < 6) return setError("Password must be 6+ characters.");
    } else {
      if (!email || !password) return setError("Email and password required.");
    }

    if (supabase) {
      setLoading(true);
      setError("");
      try {
        if (mode === "signup") {
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName, username, phone: phone.trim() || null } },
          });
          if (authError) throw authError;
          if (data?.user) {
            const profile = await getOrCreateProfile(data.user, displayName, username, phone.trim());
            onAuth(profile);
          } else {
            setError("Sign up succeeded but no user returned. Check your email to confirm, or try logging in.");
          }
        } else {
          const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          if (data?.user) {
            const profile = await getOrCreateProfile(data.user);
            onAuth(profile);
          } else {
            setError("Login succeeded but no session. Try again or check if email confirmation is required.");
          }
        }
      } catch (err) {
        setError(err?.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "signup") onAuth({ id: "mock", email, phone, username, display_name: displayName });
    else onAuth({ id: "mock", email, phone: "", username: email.split("@")[0], display_name: email.split("@")[0] });
  };

  return (
    <GradientBg>
      <div style={{ padding: "60px 24px 40px", textAlign: "center" }}>
        <img src="/goat-headphones.png" alt="Herd" style={{ width: 88, height: 88, objectFit: "contain", marginBottom: 8, mixBlendMode: "multiply" }} />
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 800, color: "#1e1b4b" }}>Herd</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(55,48,107,0.55)", marginTop: 4, marginBottom: 32 }}>Prove you&apos;re the Goat</div>
        <Card style={{ margin: "0 0 20px", padding: "24px 20px" }}>
          <div style={{ display: "flex", marginBottom: 24, background: "rgba(13,148,136,0.08)", borderRadius: 10, padding: 3 }}>
            {["login", "signup"].map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: mode === m ? "#fff" : "transparent", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: mode === m ? "#0f766e" : "rgba(55,48,107,0.4)", cursor: "pointer" }}>{m === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <>
                <Inp label="Display Name" value={displayName} onChange={setDisplayName} placeholder="David Stouck" />
                <Inp label="Username" value={username} onChange={setUsername} placeholder="davidstouck" />
                <Inp label="Phone *" type="tel" value={phone} onChange={setPhone} placeholder="(555) 123-4567" required />
              </>
            )}
            <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" autoComplete="email" />
            {mode === "login" && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(55,48,107,0.5)", marginTop: -8, marginBottom: 12 }}>Use the email you signed up with, not your display name.</div>}
            <Inp label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} />
            <div role="alert" style={{ minHeight: error ? "auto" : 0, marginBottom: 12, textAlign: "left" }}>
              {error && (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#dc2626", padding: "10px 12px", background: "#fef2f2", borderRadius: 8 }}>
                  {error}
                  {error.includes("Connection timed out") && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c", lineHeight: 1.5 }}>
                      <strong>Fix:</strong><br />
                      1. Supabase: open your project → if it says &quot;Paused&quot;, click <strong>Restore project</strong>.<br />
                      2. Vercel: Project → Settings → Environment Variables. Set <code style={{ background: "#fee2e2", padding: "1px 4px", borderRadius: 4 }}>VITE_SUPABASE_URL</code> and <code style={{ background: "#fee2e2", padding: "1px 4px", borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code> from Supabase → Settings → API. Then Deployments → Redeploy.
                    </div>
                  )}
                </div>
              )}
            </div>
            <Btn type="submit" disabled={loading}>{loading ? "…" : mode === "login" ? "Log In" : "Create Account"}</Btn>
          </form>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <Btn2 type="button" style={{ flex: 1, padding: "10px 0", fontSize: 13 }}>Google</Btn2>
            <Btn2 type="button" style={{ flex: 1, padding: "10px 0", fontSize: 13 }}>Spotify</Btn2>
          </div>
        </Card>
      </div>
    </GradientBg>
  );
}
