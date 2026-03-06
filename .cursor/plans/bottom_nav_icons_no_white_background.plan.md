# Bottom nav: remove white background from icons

## Summary of problem

- The 5 bottom nav buttons (Feed, Herds, Search, DMs, Profile) use **image files** (JPG) for the icon shapes.
- Those images have **opaque white backgrounds**, so:
  - In **dark mode**: white rectangles appear around each icon against the dark nav bar.
  - In **bright mode**: white rectangles are still visible and look unsophisticated.
- **Goal:** Keep the same icon shapes but remove the visible white background so the nav looks clean in both themes.

## Root cause

- Icons are rendered in [src/components/ui.jsx](src/components/ui.jsx) in `BottomNav` via `<img src={item.iconSrc}>` with paths like `/Nav/Navigation Bar 1JPG.jpg`, `/Nav/DMs-icon.jpg`, etc. (from [public/Nav/](public/Nav/)).
- JPG does not support transparency; the assets are opaque (white) everywhere that isn’t the icon shape. There is no way to “make white transparent” with CSS when the image itself is opaque—the browser has no alpha channel to work with.

So the fix **requires** using assets that have a **transparent background** (PNG or SVG). The only choice is whether we use one set of assets and adapt with CSS, or two sets (one per theme).

---

## Options

### Option A: One set of assets + CSS (recommended if you can export one set)

- **What you provide:** One set of icons with **transparent background** and **dark/black** icon shape (e.g. same shapes as now, but PNG with transparency).
  - Naming suggestion: e.g. `feed.png`, `herds.png`, `search.png`, `dms.png`, `profile.png` in `public/Nav/` (or keep current names but as PNG with transparency).
- **What we do in code:**
  - Use these PNGs for all themes.
  - **Bright mode:** Show as-is (dark icon on transparent → looks good on light nav).
  - **Dark mode:** Apply CSS so the icon appears light: e.g. `filter: invert(1)` (and optionally `brightness(1.1)`) so the dark shape becomes white/light on the dark nav; the transparent areas stay transparent.
- **Pros:** Only one set of assets to create/maintain; no white rectangles.  
- **Cons:** Slight color shift in dark mode (invert can look a bit “flat”); if your current icons use multiple colors, invert may look wrong and Option B is better.

### Option B: Two sets of assets (dark + bright)

- **What you provide:**
  - **Bright mode:** Icons with **transparent background** and **dark** shape (e.g. `feed.png`, or `feed-bright.png`).
  - **Dark mode:** Same shapes with **transparent background** and **white/light** shape (e.g. `feed-dark.png`).
- **What we do in code:**
  - In `BottomNav`, use `useTheme()` (already used there) and choose `iconSrc` (or a second `iconSrcDark`) based on `theme.id === 'dark'` (or `mode === 'dark'`).
  - Render one `<img>` with the theme-appropriate `src`.
- **Pros:** Best visual quality in both modes; no CSS hacks.  
- **Cons:** You maintain two versions of each icon (or we use invert for one side and only one extra set).

### Option C: CSS-only with current JPGs (not recommended)

- We could try `mix-blend-mode: multiply` so that “white” in the image blends with the nav background. That only works when the nav is light (bright mode); in dark mode the icon would disappear or look wrong. We could also try a dark wrapper and different blend modes, but the result is fragile and usually still shows edges or artifacts. **Recommendation:** don’t rely on this; use transparent assets instead.

---

## Recommended approach

1. **Use transparent-background assets (PNG or SVG).** This is the only reliable way to remove the white rectangles.
2. **Prefer Option A (one set + invert in dark mode)** to minimize asset work:
   - You export (or recreate) the **same 5 icon shapes** as **PNG with transparent background** and **black/dark** shape.
   - We switch the nav to use these PNGs and add a dark-mode-only CSS rule (e.g. `filter: invert(1)`) on the nav icons when `theme.id === 'dark'`.
3. **If Option A doesn’t look good** (e.g. icons have multiple colors or invert looks bad), switch to **Option B**: add a second set of white-on-transparent PNGs for dark mode and pick `iconSrc` by theme in code.

---

## What you need to do (assets)

- **Minimum:** Provide **5 PNGs** (or SVG) with **transparent background** and **dark/black** icon shape for: Feed, Herds, Search, DMs, Profile. Same filenames or new names (we’ll point the code to them). Place in `public/Nav/` (e.g. `feed.png`, `herds.png`, `search.png`, `dms.png`, `profile.png`).
- **Optional (Option B):** If you prefer perfect dark-mode look without invert, also provide a second set (e.g. `feed-dark.png`, …) with **white/light** shape on transparent for dark mode.

**Re-upload / rename:**  
- Use **PNG** (or SVG) so transparency is supported.  
- Avoid spaces in filenames for simplicity (e.g. `Navigation Bar 1JPG.jpg` → `feed.png`).  
- If you only provide one set, we’ll use Option A; if you provide two sets, we can use Option B.

---

## Implementation plan (for agent mode)

1. **Update nav config in [src/components/ui.jsx](src/components/ui.jsx)**
   - Point each tab’s `iconSrc` to the new transparent PNG (e.g. `/Nav/feed.png`, `/Nav/herds.png`, `/Nav/search.png`, `/Nav/dms.png`, `/Nav/profile.png`). If using two sets, add a field like `iconSrcDark` and choose in the render based on `theme.id`.
2. **Theme-aware icon rendering**
   - In `BottomNav`, keep using `useTheme()`. For **Option A:** apply to the nav `<img>` something like:  
     `style={{ ...existingStyles, ...(theme.id === 'dark' ? { filter: 'invert(1) brightness(1.05)' } : {}) }}`  
     so dark mode shows a light icon without changing layout or behavior.
   - For **Option B:** set `src={theme.id === 'dark' && item.iconSrcDark ? item.iconSrcDark : item.iconSrc}` (or equivalent) and no invert.
3. **Keep behavior and layout unchanged**
   - Same 5 tabs, same labels, same active state and navigation; only the icon asset and optional filter/dual-src change.
4. **Fallback if assets missing**
   - If we want a safe fallback, we can keep the old JPG paths as fallback when the new PNG fails to load (`onError` → use old `iconSrc`), or we can remove old paths once the new assets are in place.

---

## Files to touch

- [src/components/ui.jsx](src/components/ui.jsx): `BottomNav` — update `items` icon paths and add theme-based `filter` (Option A) or dual `iconSrc`/`iconSrcDark` (Option B).
- [public/Nav/](public/Nav/): add new PNG (and optionally dark) assets; old JPGs can stay or be removed after verification.

---

## Intended result

- Same features and navigation; same icon shapes.
- No white rectangles around the icons in bright or dark mode.
- Icons look intentional and consistent with the app’s theme (dark icons in bright mode, light icons in dark mode).
