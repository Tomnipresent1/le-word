// One round's flow, working on the save object (see save.js). No screen code, so the self-test can play rounds.
import { WORD_LENGTH, MAX_GUESSES, scoreGuess } from './rules.js';

export const answerFor = (save, answers) => answers[save.round - 1];
export const allPlayed = (save, answers) => save.round > answers.length;
// A round is over once its result is written down: guesses used if won, 0 if not.
export const isRoundOver = (save) => save.results[save.round] !== undefined;

// Why a typed word can't be played yet, or null if it can.
export function checkGuess(word, isValid) {
  if (word.length < WORD_LENGTH) return 'Not enough letters';
  if (!isValid(word)) return 'Not in word list';
  return null;
}

export function submitGuess(save, word, answer) {
  save.guesses.push(word);
  const won = word === answer;
  const over = won || save.guesses.length >= MAX_GUESSES;
  if (over) save.results[save.round] = won ? save.guesses.length : 0;
  return { score: scoreGuess(word, answer), won, over };
}

export function nextRound(save) {
  save.round++;
  save.guesses = [];
}
