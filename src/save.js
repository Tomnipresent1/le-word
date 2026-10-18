// Progress, kept in this phone's browser only (localStorage); nothing leaves the phone.
// Versioned (v) so a later build can upgrade an old save instead of losing it.
const KEY = 'le-word-save';

// round: the round being played (1-based). guesses: words played this round.
// results: { roundNumber: guesses used if won, 0 if not }. Stats will be worked out from this.
const fresh = () => ({ v: 1, round: 1, guesses: [], results: {} });

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) return { ...fresh(), ...s };
  } catch (e) { /* no storage (private window, blocked): play without saving */ }
  return fresh();
}

export function store(save) {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* as above */ }
}
