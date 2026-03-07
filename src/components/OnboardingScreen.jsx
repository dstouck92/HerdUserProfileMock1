import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Inp } from "./ui";

const F = "'DM Sans', sans-serif";

export default function OnboardingScreen({ user, onComplete }) {
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [age, setAge] = useState(user?.age != null ? String(user.age) : "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const phoneTrim = phone.trim();
    const ageNum = parseInt(age, 10);
    const genderTrim = gender.trim();
    const countryTrim = country.trim();
    if (!phoneTrim || !Number.isFinite(ageNum) || ageNum <= 0 || !genderTrim || !countryTrim) {
      setError("Phone, age, gender, and country are required.");
      return;
    }
    if (!supabase || !user?.id) {
      setError("Unable to save. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          phone: phoneTrim,
          age: ageNum,
          gender: genderTrim,
          country: countryTrim,
          region: region.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (updateError) throw updateError;
      onComplete({
        phone: phoneTrim,
        age: ageNum,
        gender: genderTrim,
        country: countryTrim,
        region: region.trim() || null,
      });
    } catch (err) {
      if (err && typeof console !== "undefined") console.error("Onboarding save error:", err);
      setError(err?.message || "Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const bgStyle = { background: "#0a0a0a", minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 88, fontFamily: F };
  const muted = "rgba(255,255,255,0.5)";

  return (
    <div style={bgStyle}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <div style={{ padding: "48px 24px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: "#fff" }}>Complete your profile</div>
          <div style={{ fontFamily: F, fontSize: 13, color: muted, marginTop: 6 }}>A few details so we can personalize your experience.</div>
        </div>
        <form onSubmit={handleSubmit} noValidate style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: "24px 20px" }}>
          <Inp label="Phone *" type="tel" value={phone} onChange={setPhone} placeholder="(555) 123-4567" required />
          <Inp label="Age *" type="number" value={age} onChange={setAge} placeholder="25" required />
          <Inp label="Gender *" value={gender} onChange={setGender} placeholder="Female, Male, Non-binary, etc." required />
          <Inp label="Country *" value={country} onChange={setCountry} placeholder="United States" required />
          <Inp label="Region / State" value={region} onChange={setRegion} placeholder="California" />
          {error && (
            <div style={{ fontFamily: F, fontSize: 13, color: "#f87171", padding: "10px 12px", background: "rgba(248,113,113,0.12)", borderRadius: 8, marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 18,
              border: "none",
              background: loading ? "rgba(45,212,191,0.4)" : "linear-gradient(135deg, #0d9488, #14b8a6)",
              color: "#fff",
              fontFamily: F,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
