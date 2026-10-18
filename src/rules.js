// The rules of the game, with no screen code in them, so the self-test can check them directly.
export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

// Colour one guess against the answer: 'hit' (right letter, right place), 'near' (in the word, somewhere else),
// 'miss' (not in the word). A repeated letter is only coloured as many times as the answer has it, greens first,
// as in the original.
export function scoreGuess(guess, answer) {
  const result = Array(guess.length).fill('miss');
  const left = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) result[i] = 'hit';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] !== 'hit' && left[guess[i]] > 0) { result[i] = 'near'; left[guess[i]]--; }
  }
  return result;
}

// Keyboard colours: each letter shows the best colour it has earned so far this round.
const RANK = { miss: 1, near: 2, hit: 3 };
export function keyColours(guesses, answer) {
  const keys = {};
  for (const g of guesses) scoreGuess(g, answer).forEach((s, i) => {
    if (!keys[g[i]] || RANK[s] > RANK[keys[g[i]]]) keys[g[i]] = s;
  });
  return keys;
}
