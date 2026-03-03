import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { GradientBg, Card, Btn, Inp } from "./ui";

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      setError("Password reset is unavailable because Supabase is not configured.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setMessage("");
    const pwd = password.trim();
    const confirm = confirmPassword.trim();
    if (!pwd || !confirm) {
      setError("Enter your new password in both fields.");
      return;
    }
    if (pwd.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pwd !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: pwd });
      if (updateError) throw updateError;
      setMessage("Your password has been updated. Redirecting you to Herd…");
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      if (err && typeof console !== "undefined") console.error("Update password error:", err);
      setError(err?.message || "Could not update password. Try the link again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBg>
      <div style={{ padding: "60px 24px 40px", textAlign: "center" }}>
        <img
          src="/goat-headphones.png"
          alt="Herd"
          style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 8, mixBlendMode: "multiply" }}
        />
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 26,
            fontWeight: 800,
            color: "#1e1b4b",
            marginBottom: 4,
          }}
        >
          Reset your password
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "rgba(55,48,107,0.65)",
            marginBottom: 24,
          }}
        >
          Choose a new password for your Herd account.
        </div>
        <Card style={{ margin: "0 0 20px", padding: "22px 20px" }}>
          <form onSubmit={handleSubmit} noValidate>
            <Inp
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
            <Inp
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat password"
              autoComplete="new-password"
            />
            <div role="alert" style={{ minHeight: error || message ? "auto" : 0, marginBottom: 12, textAlign: "left" }}>
              {error && (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "#dc2626",
                    padding: "10px 12px",
                    background: "#fef2f2",
                    borderRadius: 8,
                  }}
                >
                  {error}
                </div>
              )}
              {message && !error && (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "#166534",
                    padding: "10px 12px",
                    background: "#ecfdf3",
                    borderRadius: 8,
                  }}
                >
                  {message}
                </div>
              )}
            </div>
            <Btn type="submit" disabled={loading || !supabase}>
              {loading ? "Updating…" : "Save new password"}
            </Btn>
          </form>
        </Card>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            marginTop: 8,
            border: "none",
            background: "none",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "rgba(55,48,107,0.7)",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Back to Herd
        </button>
      </div>
    </GradientBg>
  );
}

