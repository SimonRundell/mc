/**
 * Draws the single house rule that governs an entire game of Mornington
 * Crescent. One rule is chosen at random from the full set and stays in
 * force until someone wins.
 *
 * @param {{rules: object[]}} rulesData - parsed contents of data/rules.json
 * @param {string} [forceId] - dev-only override (see ?forceRule= query param)
 * @returns {object} the chosen rule
 */
export function pickGameRule(rulesData, forceId) {
  const rules = rulesData.rules;

  if (forceId) {
    const forced = rules.find((r) => r.id === forceId);
    if (forced) return forced;
  }

  return rules[Math.floor(Math.random() * rules.length)];
}
