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

  async function getOrCreateProfile(authUser, displayName, username, phone) {
    const { data: existing } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    const payload = {
      id: authUser.id,
      display_name: displayName ?? existing?.display_name ?? authUser.user_metadata?.display_name ?? authUser.email?.split("@")[0] ?? "",
      username: username ?? existing?.username ?? authUser.user_metadata?.username ?? authUser.email?.split("@")[0] ?? "",
      phone: phone ?? existing?.phone ?? authUser.user_metadata?.phone ?? null,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    return { id: payload.id, display_name: payload.display_name, username: payload.username };
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const submit = async () => {
    setError("");
    if (mode === "signup") {
      if (!email || !username || !displayName || !password) return setError("All fields required.");
      if (password.length < 6) return setError("Password must be 6+ characters.");
    } else {
      if (!email || !password) return setError("Email and password required.");
    }

    if (supabase) {
      setLoading(true);
      try {
        if (mode === "signup") {
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName, username, phone: phone || null } },
          });
          if (authError) throw authError;
          if (data?.user) {
            const profile = await getOrCreateProfile(data.user, displayName, username, phone);
            onAuth(profile);
          }
        } else {
          const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          if (data?.user) {
            const profile = await getOrCreateProfile(data.user);
            onAuth(profile);
          }
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
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
        <div style={{ fontSize: 44, marginBottom: 8 }}>🐾</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 32, fontWeight: 800, color: "#1e1b4b" }}>Herd</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(55,48,107,0.55)", marginTop: 4, marginBottom: 32 }}>Your music fandom, all in one place</div>
        <Card style={{ margin: "0 0 20px", padding: "24px 20px" }}>
          <div style={{ display: "flex", marginBottom: 24, background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: 3 }}>
            {["login", "signup"].map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: mode === m ? "#fff" : "transparent", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: mode === m ? "#4f46e5" : "rgba(55,48,107,0.4)", cursor: "pointer" }}>{m === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <>
                <Inp label="Display Name" value={displayName} onChange={setDisplayName} placeholder="David Stouck" />
                <Inp label="Username" value={username} onChange={setUsername} placeholder="davidstouck" />
                <Inp label="Phone (optional)" type="tel" value={phone} onChange={setPhone} placeholder="(555) 123-4567" />
              </>
            )}
            <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" autoComplete="email" />
            <Inp label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#dc2626", marginBottom: 12, textAlign: "left" }}>{error}</div>}
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
