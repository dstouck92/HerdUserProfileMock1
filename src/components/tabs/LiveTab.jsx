import { Card, Stats, Empty } from "../ui";
import { useTheme } from "../../context/ThemeContext";

const F = "'DM Sans', sans-serif";

export default function LiveTab({ concerts, onAdd, onEdit }) {
  const { theme } = useTheme();
  if (!concerts.length) return <Empty icon="🎫" title="No Concerts Yet" desc="Search database or manually add concerts you've attended." btn="+ Add Concert" onAction={onAdd} />;
  return (
    <div>
      <Stats stats={[{ value: concerts.length, label: "Concerts" }, { value: new Set(concerts.filter((c) => c.tour).map((c) => c.tour)).size, label: "Tours" }, { value: new Set(concerts.map((c) => c.artist)).size, label: "Artists" }]} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", marginBottom: 10 }}>
        <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: theme.text }}>Concert History</span>
        <button onClick={onAdd} style={{ padding: "6px 14px", borderRadius: 20, border: theme.btnSecondaryBorder, background: theme.cardBg, fontFamily: F, fontSize: 12, fontWeight: 600, color: theme.accent, cursor: "pointer" }}>+ Add</button>
      </div>
      <Card>
        {concerts.map((c, i) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i === concerts.length - 1 ? "none" : theme.cardBorder }}>
            <span style={{ fontSize: 26, marginRight: 14 }}>🎫</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>{c.artist}</strong>{c.tour && <span style={{ fontWeight: 400, color: theme.textMuted }}> - {c.tour}</span>}</div>
              <div style={{ fontFamily: F, fontSize: 12, color: theme.textMuted, marginTop: 2 }}><span style={{ fontWeight: 600, color: theme.accent }}>{c.date}</span>{c.venue && <> | {c.venue}</>}{c.city && <>, {c.city}</>}</div>
            </div>
            <button onClick={() => onEdit(c)} type="button" title="Edit concert" style={{ marginRight: 8, padding: "8px 10px", borderRadius: 10, border: theme.btnSecondaryBorder, background: theme.cardBg, color: theme.accent, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Edit">✎</button>
            <span style={{ color: theme.textSoft, fontSize: 18 }}>›</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
