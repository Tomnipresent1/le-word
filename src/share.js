// The share button: coloured squares only (no letters, no link), handed to the phone's own share menu so the player
// picks who gets it. The game itself sends nothing anywhere.
import { scoreGuess, MAX_GUESSES } from './rules.js';

const SQUARE = { hit: '🟩', near: '🟨', miss: '⬛' };

export function shareText(round, guesses, answer, won) {
  const rows = guesses.map((g) => scoreGuess(g, answer).map((s) => SQUARE[s]).join(''));
  return `Le-Word ${round} ${won ? guesses.length : 'X'}/${MAX_GUESSES}\n\n${rows.join('\n')}`;
}

// 'shared' | 'cancelled' | 'copied' | 'failed'
export async function shareResult(text) {
  if (navigator.share) {
    try { await navigator.share({ text }); return 'shared'; }
    catch (e) { if (e.name === 'AbortError') return 'cancelled'; } // menu closed without sharing: do nothing
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) { /* not allowed here: try the old way */ }
  // Last resort, for plain-http test pages (like testing over home Wi-Fi), where the newer ways aren't allowed.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { /* nothing more to try */ }
  ta.remove();
  return ok ? 'copied' : 'failed';
}
