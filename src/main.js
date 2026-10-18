// Le-Word: wires the rules, the save and the screen together.
import { ANSWERS, isValid } from './words.js';
import { WORD_LENGTH, scoreGuess, keyColours } from './rules.js';
import { answerFor, allPlayed, isRoundOver, checkGuess, submitGuess, nextRound } from './game.js';
import { load, store } from './save.js';
import { WIN, LOSE, MILESTONES, ALL_DONE } from './messages.js';
import { BUILD } from './version.js';
import { computeStats } from './stats.js';
import { shareText, shareResult } from './share.js';
import * as ui from './ui.js';

const save = load();
let typing = '';   // letters typed into the current row, not yet entered
let busy = false;  // true while tiles are turning over

function startRound() {
  typing = '';
  ui.clearBoard();
  ui.hideEnd();
  if (allPlayed(save, ANSWERS)) {
    ui.setRound('');
    return ui.showEnd({ title: 'All done', line: ALL_DONE });
  }
  ui.setRound(save.round);
  const answer = answerFor(save, ANSWERS);
  save.guesses.forEach((g, r) => ui.paintRow(r, g, scoreGuess(g, answer)));
  ui.paintKeys(keyColours(save.guesses, answer));
  if (isRoundOver(save)) endOfRound();
}

function endOfRound() {
  const n = save.results[save.round];
  const st = computeStats(save.results);
  ui.showEnd({
    title: n ? WIN[n - 1] : LOSE,
    line: n ? `Round ${save.round} in ${n} ${n === 1 ? 'guess' : 'guesses'}` : `The word was ${answerFor(save, ANSWERS).toUpperCase()}`,
    note: MILESTONES[save.round],
    stats: `Played ${st.played} · Won ${st.winPct}% · Streak ${st.streak}`,
    canShare: true,
    button: save.round < ANSWERS.length ? 'Next round' : 'Finish',
    next: () => { nextRound(save); store(save); startRound(); },
  });
}

function onKey(k) {
  if (busy || allPlayed(save, ANSWERS) || isRoundOver(save)) return;
  if (k === 'enter') return enter();
  if (k === 'back') typing = typing.slice(0, -1);
  else if (/^[a-z]$/.test(k) && typing.length < WORD_LENGTH) typing += k;
  ui.paintRow(save.guesses.length, typing);
}

function enter() {
  const r = save.guesses.length;
  const problem = checkGuess(typing, isValid);
  if (problem) { ui.toast(problem); ui.shakeRow(r); return; }
  const answer = answerFor(save, ANSWERS);
  const word = typing;
  typing = '';
  const res = submitGuess(save, word, answer);
  store(save);
  busy = true;
  ui.revealRow(r, word, res.score, () => {
    busy = false;
    ui.paintKeys(keyColours(save.guesses, answer));
    if (res.won) ui.bounceRow(r);
    if (res.over) setTimeout(endOfRound, res.won ? 900 : 400);
  });
}

// Sharing is only for a finished round that's still on screen.
const canShare = () => !allPlayed(save, ANSWERS) && isRoundOver(save);

function openStats() {
  ui.showStats(computeStats(save.results), canShare() ? save.results[save.round] : 0, canShare());
}

async function share() {
  if (!canShare()) return;
  const answer = answerFor(save, ANSWERS);
  const won = save.results[save.round] > 0;
  const result = await shareResult(shareText(save.round, save.guesses, answer, won));
  if (result === 'copied') ui.toast('Copied: paste it into a message', 2200);
  else if (result === 'failed') ui.toast("Couldn't share, sorry");
}

// A PC keyboard works too (handy for testing).
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (ui.statsShowing()) { if (e.key === 'Escape') ui.hideStats(); return; }
  if (e.key === 'Enter' && ui.endShowing()) return document.getElementById('nextBtn').click();
  if (e.key === 'Enter') onKey('enter');
  else if (e.key === 'Backspace') onKey('back');
  else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toLowerCase());
});

ui.build(onKey, { onStats: openStats, onShare: share });
ui.setBuild(BUILD);
startRound();

// The offline cache: invisible now; it allows "Add to Home screen" later and helps on a patchy signal.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
