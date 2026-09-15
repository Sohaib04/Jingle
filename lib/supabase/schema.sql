-- ==========================================================
-- Jingle Database Schema (Supabase / PostgreSQL)
-- ==========================================================

-- 1. Countries table
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(2) NOT NULL UNIQUE,       -- ISO 3166-1 alpha-2 (e.g. 'BR', 'JP')
  code3 VARCHAR(3) NOT NULL,             -- ISO 3166-1 alpha-3 (e.g. 'BRA', 'JPN')
  name VARCHAR(120) NOT NULL,
  continent VARCHAR(60) NOT NULL,
  flag VARCHAR(10) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Songs catalog table
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  album_art TEXT NOT NULL,
  country_code VARCHAR(2) REFERENCES public.countries(code) ON DELETE CASCADE,
  genre VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'easy' NOT NULL, -- 'easy', 'medium', 'hard'
  provider VARCHAR(50) DEFAULT 'preview' NOT NULL,
  provider_track_id VARCHAR(255) NOT NULL,
  audio_url TEXT,
  duration_seconds INTEGER DEFAULT 30 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Games session table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name VARCHAR(100) DEFAULT 'Anonymous',
  mode VARCHAR(50) DEFAULT 'classic' NOT NULL,    -- 'classic', 'daily', 'endless'
  total_score INTEGER DEFAULT 0 NOT NULL,
  rounds_count INTEGER DEFAULT 10 NOT NULL,
  exact_count INTEGER DEFAULT 0 NOT NULL,
  best_streak INTEGER DEFAULT 0 NOT NULL,
  total_distance_km INTEGER DEFAULT 0 NOT NULL,
  avg_response_time DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Game rounds breakdown
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  song_id VARCHAR(255) NOT NULL,
  actual_country_code VARCHAR(2) NOT NULL,
  guessed_country_code VARCHAR(2),
  distance_km INTEGER NOT NULL,
  base_score INTEGER NOT NULL,
  time_bonus INTEGER NOT NULL,
  multiplier DOUBLE PRECISION NOT NULL,
  total_score INTEGER NOT NULL,
  response_time_seconds DOUBLE PRECISION NOT NULL,
  is_exact BOOLEAN NOT NULL,
  streak INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for leaderboards & querying
CREATE INDEX IF NOT EXISTS idx_games_score ON public.games (total_score DESC);
CREATE INDEX IF NOT EXISTS idx_games_created ON public.games (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_difficulty ON public.songs (difficulty);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game ON public.game_rounds (game_id);
