# Spotify artist images for herds

Fan club (herd) pages can show the artist’s profile image from Spotify.

## 1. Get Spotify credentials

1. Go to [Spotify for Developers](https://developer.spotify.com/dashboard).
2. Log in and create an app (or use an existing one).
3. In the app, open **Settings** and copy:
   - **Client ID**
   - **Client Secret**

## 2. Configure environment variables

**Local (`.env` in project root):**

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Vercel:**

1. Project → **Settings** → **Environment Variables**
2. Add:
   - `SPOTIFY_CLIENT_ID` = your Client ID
   - `SPOTIFY_CLIENT_SECRET` = your Client Secret
3. Redeploy so the new variables are used.

## 3. Test the API

**Bad Bunny’s Spotify artist ID:** `4q3ewBCX7sLwd24euuV69X`

- **Local:** run `npm run dev`, then open:
  - `http://localhost:5173/api/spotify/artist-image?artist_id=4q3ewBCX7sLwd24euuV69X`
- **Vercel:** after deploy, open:
  - `https://your-app.vercel.app/api/spotify/artist-image?artist_id=4q3ewBCX7sLwd24euuV69X`

You should get JSON like: `{ "imageUrl": "https://i.scdn.co/..." }`.  
If credentials are missing you’ll get a 503 with an error message.

## 4. How the app uses it

When a herd has a `spotify_artist_id` (e.g. Bad Bunny’s herd) and no `image_url` in the database, the app calls this API and uses the returned URL for the herd’s profile image in the list and on the herd detail page.
