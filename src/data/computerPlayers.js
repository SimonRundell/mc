/**
 * Roster of computer player names. Three distinct names are drawn from
 * this list at the start of each game for the top/left/right seats.
 */
export const COMPUTER_PLAYER_NAMES = [
  "The Chairman's Nephew",
  'Reg from Catering',
  'Mrs Fanshawe-Piper',
  'Graham',
  'Barry',
  'Tim from Buxton',
  'Willie from Neasden',
  'Doreen from Pinner',
  'The Under-Secretary for Tokens',
  'Nigel with the Flask',
  'Susan (No Relation)',
  'Colonel Bletchworth',
  'Big Dave from Purley',
  'The Verger',
  "Auntie Vera's Solicitor",
  'Kevin, Probably',
];

/** Draws `count` distinct names at random from the roster. */
export function drawComputerNames(count) {
  const shuffled = [...COMPUTER_PLAYER_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
