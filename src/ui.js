// Everything on screen: the grid, the keyboard, the little pop-up note and the end-of-round card.
// Plain page elements and CSS only (no canvas, no heavy animation), so it stays light on a low-end phone.
import { WORD_LENGTH, MAX_GUESSES } from './rules.js';

const $ = (id) => document.getElementById(id);
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-']; // + is Enter, - is Delete
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FLIP_MS = REDUCED ? 0 : 300, STAGGER_MS = REDUCED ? 0 : 250;
const GAP = 5;

let rowEls = [], tiles = [], keyEls = {}, toastTimer = 0, onNext = null;

function el(cls, tag = 'div') { const e = document.createElement(tag); e.className = cls; return e; }

// onKey(key) for the keyboard; onStats() for the header button; onShare() for both Share buttons.
export function build(onKey, { onStats, onShare }) {
  const board = $('board');
  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = el('row');
    tiles.push([]);
    for (let c = 0; c < WORD_LENGTH; c++) { const t = el('tile'); row.appendChild(t); tiles[r].push(t); }
    board.appendChild(row);
    rowEls.push(row);
  }

  const kb = $('keyboard');
  for (const letters of KEY_ROWS) {
    const row = el('krow');
    if (letters === 'asdfghjkl') row.appendChild(el('khalf')); // the middle row sits half a key in, like a real keyboard
    for (const ch of letters) {
      const b = el('key', 'button');
      b.type = 'button';
      if (ch === '+') { b.dataset.key = 'enter'; b.textContent = 'Enter'; b.classList.add('wide'); }
      else if (ch === '-') { b.dataset.key = 'back'; b.textContent = '⌫'; b.classList.add('wide'); b.setAttribute('aria-label', 'Delete'); }
      else { b.dataset.key = ch; b.textContent = ch; keyEls[ch] = b; }
      row.appendChild(b);
    }
    if (letters === 'asdfghjkl') row.appendChild(el('khalf'));
    kb.appendChild(row);
  }
  kb.addEventListener('mousedown', (e) => e.preventDefault()); // keys never take focus, so a PC's Enter key can't re-press one
  kb.addEventListener('click', (e) => { const b = e.target.closest('.key'); if (b) onKey(b.dataset.key); });
  $('nextBtn').addEventListener('click', () => onNext && onNext());
  $('statsBtn').addEventListener('click', onStats);
  $('shareBtn').addEventListener('click', onShare);
  $('statsShare').addEventListener('click', onShare);
  $('statsClose').addEventListener('click', hideStats);
  $('stats').addEventListener('click', (e) => { if (e.target === $('stats')) hideStats(); }); // tap outside the panel

  fit();
  if (window.ResizeObserver) new ResizeObserver(fit).observe($('boardWrap'));
  else addEventListener('resize', fit);
}

// Size the tiles to the space the grid has, upright or sideways.
function fit() {
  const wrap = $('boardWrap');
  const w = wrap.clientWidth - 8, h = wrap.clientHeight - 16;
  const tile = Math.max(18, Math.floor(Math.min((w - (WORD_LENGTH - 1) * GAP) / WORD_LENGTH, (h - (MAX_GUESSES - 1) * GAP) / MAX_GUESSES, 64)));
  document.documentElement.style.setProperty('--tile', tile + 'px');
  document.documentElement.style.setProperty('--gap', GAP + 'px');
}

// Show a row's letters; with a score, show its colours straight away (used when coming back to a round).
export function paintRow(r, word, score) {
  tiles[r].forEach((t, i) => {
    const ch = word[i] || '';
    t.textContent = ch;
    t.className = 'tile' + (ch ? ' filled' : '') + (score ? ' ' + score[i] : '');
  });
}

export function clearBoard() {
  for (let r = 0; r < MAX_GUESSES; r++) paintRow(r, '');
  paintKeys({});
}

// Turn the tiles over one by one, colouring each as it flips; call done when the last has landed.
export function revealRow(r, word, score, done) {
  tiles[r].forEach((t, i) => setTimeout(() => {
    t.classList.add('flip');
    setTimeout(() => t.classList.add(score[i]), FLIP_MS / 2);
  }, i * STAGGER_MS));
  setTimeout(done, (WORD_LENGTH - 1) * STAGGER_MS + FLIP_MS);
}

export function shakeRow(r) {
  const row = rowEls[r];
  row.classList.remove('shake');
  void row.offsetWidth; // restart the animation if it's already shaking
  row.classList.add('shake');
}

export function bounceRow(r) {
  if (REDUCED) return;
  tiles[r].forEach((t, i) => { t.style.animationDelay = i * 90 + 'ms'; t.classList.remove('flip'); t.classList.add('bounce'); });
}

export function paintKeys(keys) {
  for (const ch in keyEls) keyEls[ch].className = 'key' + (keys[ch] ? ' ' + keys[ch] : '');
}

export function toast(msg, ms = 1400) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function setRound(n) { $('round').textContent = n ? 'Round ' + n : ''; }
export function setBuild(b) { $('build').textContent = b; }

// The card that takes the keyboard's place when a round ends. No button = nothing more to play.
export function showEnd({ title, line, note = '', stats = '', canShare = false, button, next }) {
  $('endTitle').textContent = title;
  $('endLine').textContent = line;
  $('endNote').textContent = note;
  $('endNote').hidden = !note;
  $('endStats').textContent = stats;
  $('endStats').hidden = !stats;
  $('shareBtn').hidden = !canShare;
  $('nextBtn').hidden = !button;
  $('nextBtn').textContent = button || '';
  onNext = next || null;
  $('keyboard').hidden = true;
  $('endCard').hidden = false;
}

export function hideEnd() {
  $('endCard').hidden = true;
  $('keyboard').hidden = false;
}

export const endShowing = () => !$('endCard').hidden;

// The stats panel. highlight = the guess count of the round just finished (its bar shows green), or 0.
export function showStats(st, highlight, canShare) {
  $('sPlayed').textContent = st.played;
  $('sWin').textContent = st.winPct;
  $('sStreak').textContent = st.streak;
  $('sBest').textContent = st.best;
  const max = Math.max(1, ...st.dist);
  const dist = $('dist');
  dist.textContent = '';
  st.dist.forEach((count, i) => {
    const row = el('drow'), label = el('dlabel'), bar = el('dbar' + (i + 1 === highlight ? ' now' : ''));
    label.textContent = i + 1;
    bar.textContent = count;
    bar.style.width = Math.max(8, (100 * count) / max) + '%';
    row.append(label, bar);
    dist.appendChild(row);
  });
  $('statsShare').hidden = !canShare;
  $('stats').hidden = false;
}

export function hideStats() { $('stats').hidden = true; }
export const statsShowing = () => !$('stats').hidden;
