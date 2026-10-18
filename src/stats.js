// Stats, worked out from the save's results ({ round: guesses used if won, 0 if not }). Nothing extra is stored,
// so stats can never drift out of step with what was actually played.
import { MAX_GUESSES } from './rules.js';

export function computeStats(results) {
  const rounds = Object.keys(results).map(Number).sort((a, b) => a - b);
  const dist = Array(MAX_GUESSES).fill(0); // how many wins took 1 guess, 2 guesses, ... 6
  let wins = 0, run = 0, best = 0;
  for (const r of rounds) {
    const n = results[r];
    if (n > 0) { wins++; dist[n - 1]++; run++; best = Math.max(best, run); }
    else run = 0;
  }
  return {
    played: rounds.length,
    wins,
    winPct: rounds.length ? Math.round((100 * wins) / rounds.length) : 0,
    streak: run, // wins in a row, up to the latest round (rounds are played in order)
    best,
    dist,
  };
}
