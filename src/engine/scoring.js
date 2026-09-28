/**
 * Per-move and win-bonus scoring. When the active house rule includes a
 * data-backed scoring condition (see ruleEffects.js), qualifying moves are
 * multiplied; otherwise every move scores the flat base amount, so every
 * game still produces a meaningful final score.
 */

export const BASE_MOVE_POINTS = 10;
export const WIN_BONUS = 100;

/**
 * @param {string} stationName
 * @param {string[]} stationLines
 * @param {string|null} previousStationName
 * @param {{multiplier:number, matcher:Function}|null} scoringRule
 * @returns {number}
 */
export function computeMovePoints(stationName, stationLines, previousStationName, scoringRule) {
  if (!scoringRule) return BASE_MOVE_POINTS;

  const context = { stationLines, previousName: previousStationName };
  return scoringRule.matcher(stationName, context)
    ? BASE_MOVE_POINTS * scoringRule.multiplier
    : BASE_MOVE_POINTS;
}
