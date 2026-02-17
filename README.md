# Herd — User Profile (MVP3)

Your music fandom, all in one place. Built from **HerdMVP3_Prototype2.jsx** (Claude → Cursor).

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. http://localhost:5173).

## What’s included

- **Auth** — Login / Sign up (placeholder; ready for Supabase)
- **Digital** — Upload Spotify Extended Streaming History JSON → top artists, tracks, stats
- **Physical** — Vinyl and merch collection (add/edit)
- **Live** — Concert history (manual entry; Setlist.fm search ready to wire)
- **Curate** — Choose what to show on your public profile

## Supabase setup (auth + data)

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor** and run the schema: copy-paste and execute `supabase/schema.sql`.
3. In **Settings → API** copy your project URL and the `anon` public key.
4. In this repo root create a `.env` file (see `.env.example`):
   - `VITE_SUPABASE_URL=https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-anon-key`
5. Restart the dev server (`npm run dev`). Sign up and data will persist.

Without `.env`, the app still runs with in-memory mock auth and data.

## Setlist.fm concert search

The dev server (`npm run dev`) includes an API route `/api/concerts/search?artist=...` that queries Setlist.fm. The API key is in `server.js` (or set `SETLIST_FM_API_KEY` in `.env`). In the **Add Concert** modal, use **Search Setlist.fm**, enter an artist name, and click results to add.

## Next steps

- Use **Supabase Storage** for merch photos
- Move Spotify JSON parsing to `lib/spotify-json-parser.ts` and optionally run server-side

## Tech

- **Vite** + **React 18**
- Single `App.jsx` foundation; can be split into components as you grow
