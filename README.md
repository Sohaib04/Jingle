# Jingle

A music geography game built with Next.js and Three.js. Listen to a song, guess where it's from, and see how close you get on a 3D satellite globe.

**Play now at [jingle-game.com](https://jingle-game.com)**

Inspired by games like GeoGuessr and Heardle — Jingle combines music trivia with geography in a single, interactive experience.

## How It Works

1. A mystery song plays from somewhere in the world
2. Spin the 3D globe and select the country you think it's from
3. Scoring is based on distance accuracy, response time, and streak multiplier
4. Play through 10 rounds and aim for the top score

## Tech Stack

- **Framework** — Next.js (App Router)
- **3D Globe** — Three.js / react-globe.gl with custom night-mode shader
- **State** — Zustand
- **Music** — iTunes preview API with Web Audio API synth fallback
- **Database** — Supabase (optional, falls back to localStorage)
- **Styling** — Tailwind CSS

## Getting Started

```bash
# clone the repo
git clone https://github.com/Sohaib04/Jingle.git
cd Jingle

# install dependencies
bun install
# or: npm install

# copy env template (optional — app works without it)
cp .env.example .env.local

# start dev server
bun dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Environment Variables

All environment variables are optional. Without them the app uses local audio previews and localStorage for persistence.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for score persistence |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

See [`.env.example`](.env.example) for the full template.

## Project Structure

```
app/
  api/game/         # Game session API routes (start, finish)
  page.tsx           # Main game page
  layout.tsx         # Root layout with metadata
components/
  game/              # HUD, song player, guess bar, results, start screen
  globe/             # 3D globe with satellite/night views and controls
lib/
  game/              # Scoring engine, state store, types
  geo/               # Country data, haversine distance
  music/             # Music providers (iTunes, preview, Spotify stub)
  supabase/          # Client + schema
public/
  audio/             # Placeholder WAV tracks
  data/              # GeoJSON country boundaries
  images/            # Globe textures
```

## License

MIT
