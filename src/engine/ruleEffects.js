/**
 * Interprets a single drawn house rule into concrete game mechanics.
 *
 * The 129 rules in data/rules.json use 140+ distinct `params` keys, many
 * appearing only once and several deliberately nonsensical ("huffing",
 * "transverse_below_meridian_requires"...). Building a literal mechanical
 * handler for every key isn't feasible, and it would work against the
 * game's own joke: the whole point of Mornington Crescent is that its
 * elaborate rules mostly don't affect anything.
 *
 * So this interpreter only recognises param clusters that map onto
 * something our station/line data can actually check, and is honest when
 * it can't:
 *
 *   - `rule.enforceable === false`  -> always flavour only, no interpretation attempted.
 *   - enforceable, and we can map its params to real data -> "enforced" (mechanical effect applied).
 *   - enforceable, but its condition needs data we don't have (postcodes,
 *     "pedestrianised squares", free-text move explanations, a notion of a
 *     "foul" when the UI only ever offers legal choices...) -> "honour"
 *     (shown to players as a rule they should self-police, since the engine
 *     can't check it for them).
 *
 * Recognised clusters, each independent and additive:
 *   - station allow/block lists: wild, stations, out_of_bounds (array forms, or the
 *     known category strings "mainline_stations" / "overground")
 *   - line-based restriction: same_line, no_consecutive_same_line
 *   - forced opening move: start (when it isn't "Mornington Crescent" itself,
 *     which would contradict the one hard rule that MC can't be the first move)
 *   - turn order: direction (sets initial rotation), repeat_opponent_reverses_order
 *   - per-round random closure: closed_stations_per_round
 *   - seasonal line penalty: active_months + applies_to "overground"
 *   - time limit: time_limit_seconds + on_timeout
 *   - cosmetic: hide_map
 *   - scoring: score_multiplier + a data-backed condition key (name_contains,
 *     wild_name_contains, line, initial_letter, stations (explicit list),
 *     name_length_parity, word_length_match)
 */

const OVERGROUND_LINES = ['mildmay', 'windrush', 'weaver', 'suffragette', 'liberty', 'lioness'];
const MAINLINE_LINES = ['elizabeth', 'dlr', ...OVERGROUND_LINES];
const KNOWN_LINE_IDS = [
  'dlr', 'elizabeth', 'mildmay', 'district', 'piccadilly', 'hammersmith-city',
  'circle', 'metropolitan', 'windrush', 'northern', 'bakerloo', 'jubilee',
  'central', 'waterloo-city', 'suffragette', 'weaver', 'victoria', 'lioness', 'liberty',
];

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

/** Resolves a category string/array to a concrete line-id list, or null if unmapped. */
function resolveLineCategory(value) {
  const items = toArray(value);
  const lines = new Set();
  let matchedAny = false;

  for (const item of items) {
    const key = String(item).toLowerCase().replace(/\s+line$/, '');
    if (key === 'mainline_stations' || key === 'mainline') {
      MAINLINE_LINES.forEach((l) => lines.add(l));
      matchedAny = true;
    } else if (key === 'overground') {
      OVERGROUND_LINES.forEach((l) => lines.add(l));
      matchedAny = true;
    } else if (KNOWN_LINE_IDS.includes(key.replace(/\s+/g, '-'))) {
      lines.add(key.replace(/\s+/g, '-'));
      matchedAny = true;
    }
  }

  return matchedAny ? [...lines] : null;
}

/** Resolves a station-name list from an array value, ignoring unmapped category strings. */
function resolveStationNameList(value) {
  const items = toArray(value).filter((item) => typeof item === 'string');
  // Category strings like "termini" or "pedestrianised_squares" have no
  // matching field on our station records, so they contribute no names.
  return items.filter((item) => !/^[a-z_]+$/.test(item) || item.includes(' '));
}

function normalizedName(name) {
  return name.toLowerCase();
}

export function interpretRule(rule) {
  const summaryParts = [];
  const effects = {
    rule,
    enforceable: !!rule.enforceable,
    enforced: false,
    stationAllowList: null, // Set<string> of lower-cased names, plus MC always allowed
    stationBlockList: new Set(),
    lineAllowList: null,
    lineBlockList: new Set(),
    sameLineAsPrevious: false,
    noConsecutiveSameLine: false,
    forcedFirstMove: null,
    initialTurnDirection: null, // 'left' | 'right'
    reverseOnRepeatStation: false,
    closedStationsPerRound: 0,
    seasonalLinePenalty: null, // { months, lines, effect }
    timeLimitSeconds: null,
    onTimeout: null, // 'skip' | 'eliminate'
    hideMap: false,
    scoring: null, // { multiplier, matcher(stationName, context) }
  };

  if (!rule.enforceable) {
    return {
      ...effects,
      badge: 'flavour',
      mechanicalSummary: 'Flavour only — this rule is not marked enforceable.',
    };
  }

  const params = rule.params || {};

  // --- station allow lists ---
  if (params.wild !== undefined) {
    const lines = resolveLineCategory(params.wild);
    const names = resolveStationNameList(params.wild);
    if (lines || names.length) {
      effects.stationAllowList = effects.stationAllowList || new Set();
      if (lines) effects.lineAllowList = [...(effects.lineAllowList || []), ...lines];
      names.forEach((n) => effects.stationAllowList.add(normalizedName(n)));
      effects.enforced = true;
      summaryParts.push(`Wild stations (${[...(lines || []), ...names].join(', ')}) are always selectable.`);
    }
  }

  // --- station block lists (out_of_bounds) ---
  if (params.out_of_bounds !== undefined) {
    const lines = resolveLineCategory(params.out_of_bounds);
    const names = resolveStationNameList(params.out_of_bounds);
    if (lines) {
      lines.forEach((l) => effects.lineBlockList.add(l));
      effects.enforced = true;
      summaryParts.push(`Stations on the ${lines.join(', ')} line(s) are out of bounds.`);
    }
    if (names.length) {
      names.forEach((n) => effects.stationBlockList.add(normalizedName(n)));
      effects.enforced = true;
      summaryParts.push(`${names.join(', ')} ${names.length > 1 ? 'are' : 'is'} out of bounds.`);
    }
    if (!lines && !names.length) {
      summaryParts.push(`Marked "out of bounds: ${params.out_of_bounds}", but that's not something our station data can check — self-policed.`);
    }
  }

  // --- explicit scoring station list also used as a filter safeguard (not a block) ---
  // (handled below under scoring)

  // --- line-based restriction ---
  if (params.same_line) {
    effects.sameLineAsPrevious = true;
    effects.enforced = true;
    summaryParts.push('The next move must stay on the same line as the last.');
  }
  if (params.no_consecutive_same_line) {
    effects.noConsecutiveSameLine = true;
    effects.enforced = true;
    summaryParts.push('No two consecutive moves may share a line.');
  }

  // --- forced opening move ---
  if (typeof params.start === 'string' && params.start.toLowerCase() !== 'mornington crescent') {
    effects.forcedFirstMove = params.start;
    effects.enforced = true;
    summaryParts.push(`The opening move is forced to ${params.start}.`);
  } else if (typeof params.start === 'string') {
    summaryParts.push('This rule would force the opening move to Mornington Crescent itself, which contradicts the one hard rule of the game — self-policed instead.');
  }

  // --- turn order ---
  if (params.direction === 'left' || params.direction === 'right') {
    effects.initialTurnDirection = params.direction;
    effects.enforced = true;
    summaryParts.push(`Play passes to the ${params.direction} throughout.`);
  }
  if (params.repeat_opponent_reverses_order) {
    effects.reverseOnRepeatStation = true;
    effects.enforced = true;
    summaryParts.push("Repeating the previous player's station reverses the turn order.");
  }

  // --- per-round random closure ---
  if (typeof params.closed_stations_per_round === 'number') {
    effects.closedStationsPerRound = params.closed_stations_per_round;
    effects.enforced = true;
    summaryParts.push(`${params.closed_stations_per_round} station(s) are closed at random each round.`);
  }

  // --- seasonal line penalty ---
  if (Array.isArray(params.active_months) && params.applies_to === 'overground') {
    effects.seasonalLinePenalty = {
      months: params.active_months,
      lines: OVERGROUND_LINES,
      effect: params.penalty || 'delay_one_turn',
    };
    effects.enforced = true;
    summaryParts.push('Overground stations delay the player by a turn during the active months.');
  }

  // --- time limit ---
  if (typeof params.time_limit_seconds === 'number') {
    effects.timeLimitSeconds = params.time_limit_seconds;
    effects.onTimeout = params.on_timeout === 'eliminate' ? 'eliminate' : 'skip';
    effects.enforced = true;
    summaryParts.push(`Moves are timed at ${params.time_limit_seconds}s; running out ${effects.onTimeout === 'eliminate' ? 'eliminates the player' : 'skips their next turn'}.`);
  }

  // --- cosmetic ---
  if (params.hide_map) {
    effects.hideMap = true;
    effects.enforced = true;
    summaryParts.push('The map is hidden for this round.');
  }

  // --- scoring ---
  if (typeof params.score_multiplier === 'number') {
    const multiplier = params.score_multiplier;
    const matchers = [];

    if (Array.isArray(params.name_contains)) {
      const needles = params.name_contains.map((s) => s.toLowerCase());
      matchers.push((name) => needles.some((n) => name.toLowerCase().includes(n)));
    }
    if (Array.isArray(params.wild_name_contains)) {
      const needles = params.wild_name_contains.map((s) => s.toLowerCase());
      matchers.push((name) => needles.some((n) => name.toLowerCase().includes(n)));
    }
    if (typeof params.line === 'string') {
      const lineId = params.line.toLowerCase();
      matchers.push((name, ctx) => (ctx.stationLines || []).includes(lineId));
    }
    if (typeof params.initial_letter === 'string') {
      const letter = params.initial_letter.toLowerCase();
      matchers.push((name) => name.trim().toLowerCase().startsWith(letter));
    }
    if (Array.isArray(params.stations)) {
      const names = params.stations.map((s) => s.toLowerCase());
      matchers.push((name) => names.includes(name.toLowerCase()));
    }
    if (params.name_length_parity === 'even' || params.name_length_parity === 'odd') {
      const parity = params.name_length_parity;
      matchers.push((name) => {
        const len = name.replace(/\s+/g, '').length;
        return parity === 'even' ? len % 2 === 0 : len % 2 === 1;
      });
    }
    if (params.word_length_match) {
      matchers.push((name, ctx) => {
        if (!ctx.previousName) return false;
        return name.trim().split(/\s+/).length === ctx.previousName.trim().split(/\s+/).length;
      });
    }

    if (matchers.length) {
      effects.scoring = {
        multiplier,
        matcher: (name, ctx) => matchers.some((m) => m(name, ctx)),
      };
      effects.enforced = true;
      summaryParts.push(`Qualifying moves score ${multiplier}x points.`);
    } else {
      summaryParts.push(`Claims a ${multiplier}x score multiplier, but its condition isn't something our data can check — self-policed.`);
    }
  }

  const badge = effects.enforced ? 'enforced' : 'honour';
  const mechanicalSummary = summaryParts.length
    ? summaryParts.join(' ')
    : "Marked enforceable, but nothing in its params maps to a mechanic our engine can apply — self-policed.";

  return { ...effects, badge, mechanicalSummary };
}
