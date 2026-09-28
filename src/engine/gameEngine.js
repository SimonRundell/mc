/**
 * Pure(ish) game-state helpers for a round of Mornington Crescent. Random
 * rolls (objections, computer decisions, station closures) happen inline
 * rather than being injected, since this project has no need for strict
 * reducer purity in tests — it just needs to be easy to follow.
 */

import { interpretRule } from './ruleEffects';
import { computeMovePoints, WIN_BONUS } from './scoring';

export const MC_NAME = 'Mornington Crescent Underground Station';

/**
 * @param {object[]} players - [{id, name, isHuman, position}]
 * @param {object} rule - a rule from data/rules.json
 * @param {boolean} retiredStationsEnabled
 */
export function initGame({ players, rule, retiredStationsEnabled }) {
  const activeRuleEffects = interpretRule(rule);
  let order = players.map((p) => p.id);
  if (activeRuleEffects.initialTurnDirection === 'left') {
    order = [...order].reverse();
  }

  return {
    status: 'playing',
    players,
    order,
    turnPointer: 0,
    round: 1,
    moveHistory: [],
    scores: Object.fromEntries(players.map((p) => [p.id, 0])),
    skipCounts: {},
    eliminatedIds: new Set(),
    activeRuleEffects,
    retiredStationsEnabled,
    closedThisRound: new Set(),
    closedRoundNumber: 0,
    winnerId: null,
  };
}

export function getCurrentPlayerId(state) {
  return state.order[state.turnPointer];
}

/**
 * Builds the full option list for the current turn: every visible station
 * (respecting the retired-stations toggle) plus Mornington Crescent itself,
 * each flagged with whether the active house rule disables it and why.
 */
export function computeAvailableStations(state, stationsData) {
  const effects = state.activeRuleEffects;
  const isFirstMoveEver = state.moveHistory.length === 0;
  const previousMove = state.moveHistory[state.moveHistory.length - 1] || null;

  const visible = stationsData.stations.filter(
    (s) => state.retiredStationsEnabled || s.status === 'open'
  );

  const options = visible.map((station) => {
    const name = station.name;
    const lower = name.toLowerCase();
    const isWild =
      (effects.stationAllowList && effects.stationAllowList.has(lower)) ||
      (effects.lineAllowList && station.lines.some((l) => effects.lineAllowList.includes(l)));

    let disabled = false;
    let reason = '';

    if (!isWild) {
      if (effects.stationBlockList.has(lower)) {
        disabled = true;
        reason = 'Out of bounds under tonight\'s rule.';
      }
      if (!disabled && station.lines.some((l) => effects.lineBlockList.has(l))) {
        disabled = true;
        reason = 'That line is out of bounds under tonight\'s rule.';
      }
      if (!disabled && state.closedThisRound.has(lower)) {
        disabled = true;
        reason = 'Closed for this round.';
      }
      if (!disabled && effects.sameLineAsPrevious && previousMove && !previousMove.isMC) {
        if (!station.lines.some((l) => previousMove.stationLines.includes(l))) {
          disabled = true;
          reason = 'Must stay on the same line as the last move.';
        }
      }
      if (!disabled && effects.noConsecutiveSameLine && previousMove && !previousMove.isMC) {
        if (station.lines.some((l) => previousMove.stationLines.includes(l))) {
          disabled = true;
          reason = 'Cannot repeat the previous move\'s line.';
        }
      }
    }

    if (
      !disabled &&
      isFirstMoveEver &&
      effects.forcedFirstMove &&
      lower !== effects.forcedFirstMove.toLowerCase()
    ) {
      disabled = true;
      reason = `Tonight's rule forces the opening move to ${effects.forcedFirstMove}.`;
    }

    const isMCOption = name === MC_NAME;
    if (isMCOption && isFirstMoveEver) {
      disabled = true;
      reason = 'Mornington Crescent cannot be called on the first move.';
    }

    return {
      name,
      status: station.status,
      special: !!station.special,
      lines: station.lines,
      coordinates: station.coordinates,
      isMCOption,
      disabled,
      reason,
    };
  });

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

function skipPlayerNextTurn(state, playerId) {
  return {
    ...state,
    skipCounts: { ...state.skipCounts, [playerId]: (state.skipCounts[playerId] || 0) + 1 },
  };
}

function advanceTurn(state) {
  let pointer = state.turnPointer;
  const skip = { ...state.skipCounts };
  const eliminated = state.eliminatedIds;

  for (let i = 0; i < state.order.length * 2; i++) {
    pointer = (pointer + 1) % state.order.length;
    const pid = state.order[pointer];
    if (eliminated.has(pid)) continue;
    if (skip[pid] > 0) {
      skip[pid] -= 1;
      continue;
    }
    break;
  }

  const round = Math.floor(state.moveHistory.length / state.order.length) + 1;

  return { ...state, turnPointer: pointer, skipCounts: skip, round };
}

function recomputeClosedStations(state, stationsData) {
  const n = state.activeRuleEffects.closedStationsPerRound;
  if (!n || state.closedRoundNumber === state.round) return state;

  const candidates = stationsData.stations.filter(
    (s) => s.status === 'open' && s.name !== MC_NAME && !s.special
  );
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const closed = new Set(shuffled.slice(0, n).map((s) => s.name.toLowerCase()));

  return { ...state, closedThisRound: closed, closedRoundNumber: state.round };
}

/**
 * Rolls the objection mechanic for an MC call: ~25% chance one of the other
 * three players objects, and if so, less than a 20% chance it's upheld.
 */
export function resolveMcCall(state, callerId, config) {
  const raised = Math.random() < config.objectionChance;
  if (!raised) {
    return { raised: false, objectorId: null, upheld: null, result: 'win' };
  }

  const others = state.players.filter((p) => p.id !== callerId).map((p) => p.id);
  const objectorId = others[Math.floor(Math.random() * others.length)];
  const upheld = Math.random() < config.objectionUpheldChance;

  return { raised: true, objectorId, upheld, result: upheld ? 'rejected' : 'win' };
}

/**
 * Applies a chosen station (or MC) for the current player. Returns the new
 * state plus the objection roll result (null unless the move was an MC call).
 */
export function applyMove(state, option, stationsData, config) {
  const currentPlayerId = getCurrentPlayerId(state);
  const previousMove = state.moveHistory[state.moveHistory.length - 1] || null;

  const points = option.isMCOption
    ? WIN_BONUS
    : computeMovePoints(
        option.name,
        option.lines,
        previousMove?.stationName,
        state.activeRuleEffects.scoring
      );

  const move = {
    playerId: currentPlayerId,
    stationName: option.name,
    stationLines: option.lines,
    coordinates: option.coordinates,
    isMC: option.isMCOption,
    special: option.special,
    round: state.round,
    points,
  };

  let next = {
    ...state,
    moveHistory: [...state.moveHistory, move],
    scores: { ...state.scores, [currentPlayerId]: (state.scores[currentPlayerId] || 0) + points },
  };

  // Reverse turn order if this move repeats the immediately preceding
  // opponent's station, when tonight's rule cares about that.
  if (
    state.activeRuleEffects.reverseOnRepeatStation &&
    previousMove &&
    !previousMove.isMC &&
    previousMove.playerId !== currentPlayerId &&
    previousMove.stationName.toLowerCase() === option.name.toLowerCase()
  ) {
    const reversedOrder = [...next.order].reverse();
    next = { ...next, order: reversedOrder, turnPointer: reversedOrder.indexOf(currentPlayerId) };
  }

  // Seasonal Overground penalty (checked against the real current month).
  const seasonal = state.activeRuleEffects.seasonalLinePenalty;
  if (seasonal) {
    const month = new Date().getMonth() + 1;
    if (seasonal.months.includes(month) && option.lines.some((l) => seasonal.lines.includes(l))) {
      next = skipPlayerNextTurn(next, currentPlayerId);
    }
  }

  if (!option.isMCOption) {
    next = advanceTurn(next);
    next = recomputeClosedStations(next, stationsData);
    return { state: next, objection: null };
  }

  const objection = resolveMcCall(next, currentPlayerId, config);
  if (objection.result === 'win') {
    next = { ...next, status: 'finished', winnerId: currentPlayerId };
  } else {
    next = advanceTurn(next);
    next = recomputeClosedStations(next, stationsData);
  }

  return { state: next, objection };
}

export function applyTimeout(state) {
  const playerId = getCurrentPlayerId(state);
  let next = state;

  if (state.activeRuleEffects.onTimeout === 'eliminate') {
    next = { ...state, eliminatedIds: new Set([...state.eliminatedIds, playerId]) };
  } else {
    next = skipPlayerNextTurn(state, playerId);
  }

  return advanceTurn(next);
}

/**
 * Picks a computer player's move: a rising chance to call MC each round
 * once eligible, otherwise a uniform-random legal station.
 */
export function computerDecision(state, availableOptions, config) {
  const isFirstMoveEver = state.moveHistory.length === 0;
  const mcOption = availableOptions.find((o) => o.isMCOption);
  const legalStations = availableOptions.filter((o) => !o.isMCOption && !o.disabled);

  if (mcOption && !mcOption.disabled && !isFirstMoveEver) {
    const probability = Math.min(
      0.95,
      config.mcCallBaseProbability + config.mcCallProbabilityIncrement * (state.round - 1)
    );
    if (Math.random() < probability) return mcOption;
  }

  if (!legalStations.length) return mcOption;
  return legalStations[Math.floor(Math.random() * legalStations.length)];
}
