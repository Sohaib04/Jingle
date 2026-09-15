import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { GameSummary } from "@/lib/game/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * Saves a completed game session to Supabase or falls back to local storage.
 */
export async function saveGameResult(summary: GameSummary): Promise<void> {
  // If Supabase is configured, persist to database
  if (supabase) {
    try {
      const { data: gameRow, error: gameError } = await supabase
        .from("games")
        .insert({
          total_score: summary.totalScore,
          rounds_count: summary.roundsCount,
          exact_count: summary.exactCount,
          best_streak: summary.bestStreak,
          total_distance_km: summary.totalDistanceKm,
          avg_response_time: summary.averageResponseTimeSeconds,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      if (gameRow && summary.roundResults.length > 0) {
        const roundRows = summary.roundResults.map((r) => ({
          game_id: gameRow.id,
          round_number: r.roundNumber,
          song_id: r.song.id,
          actual_country_code: r.actualCountry.code,
          guessed_country_code: r.guessedCountry?.code || null,
          distance_km: r.distanceKm,
          base_score: r.baseScore,
          time_bonus: r.timeBonus,
          multiplier: r.multiplier,
          total_score: r.totalScore,
          response_time_seconds: r.responseTimeSeconds,
          is_exact: r.isExact,
          streak: r.streak,
        }));

        await supabase.from("game_rounds").insert(roundRows);
      }
      return;
    } catch (err) {
      console.warn("Supabase save error, falling back to local storage:", err);
    }
  }

  // Graceful local storage fallback
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = localStorage.getItem("geotune_recent_games");
      const list = existingRaw ? JSON.parse(existingRaw) : [];
      list.unshift(summary);
      localStorage.setItem("geotune_recent_games", JSON.stringify(list.slice(0, 20)));

      // Update high score
      const currentHighScore = Number(localStorage.getItem("geotune_high_score") || "0");
      if (summary.totalScore > currentHighScore) {
        localStorage.setItem("geotune_high_score", String(summary.totalScore));
      }
    } catch {
      // ignore storage errors
    }
  }
}
