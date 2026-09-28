import { createContext, useContext, useEffect, useState } from 'react';
import { useConfig } from './ConfigContext';
import { stationsData, rulesData, commentaryData } from '../data';
import { drawComputerNames } from '../data/computerPlayers';
import {
  initGame,
  getCurrentPlayerId,
  computeAvailableStations,
  applyMove,
  applyTimeout,
  computerDecision,
} from '../engine/gameEngine';
import { pickGameRule } from '../engine/rules';

const GameContext = createContext(null);

const CATEGORY_WEIGHTS = { play: 0.4, atmosphere: 0.25, stats: 0.2, history: 0.15 };

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickCommentaryLine() {
  const r = Math.random();
  let cumulative = 0;
  let category = 'play';
  for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    cumulative += weight;
    if (r <= cumulative) {
      category = cat;
      break;
    }
  }
  const candidates = commentaryData.comments.filter((c) => c.category === category);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function buildPlayers(humanName) {
  const [topName, rightName, leftName] = drawComputerNames(3);
  return [
    { id: 'top', name: topName, isHuman: false, position: 'top' },
    { id: 'right', name: rightName, isHuman: false, position: 'right' },
    { id: 'bottom', name: humanName || 'You', isHuman: true, position: 'bottom' },
    { id: 'left', name: leftName, isHuman: false, position: 'left' },
  ];
}

export function GameProvider({ children }) {
  const config = useConfig();
  const [engineState, setEngineState] = useState(null);
  const [objectionUI, setObjectionUI] = useState(null);
  const [computerThinkingId, setComputerThinkingId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [commentary, setCommentary] = useState([]);

  const forceRuleId = new URLSearchParams(window.location.search).get('forceRule') || undefined;

  function startGame(humanName, retiredStationsEnabled) {
    const rule = pickGameRule(rulesData, forceRuleId);
    const players = buildPlayers(humanName);
    setEngineState(initGame({ players, rule, retiredStationsEnabled }));
    setCommentary([]);
    setObjectionUI(null);
    setTimeLeft(null);
  }

  function playAgain() {
    setEngineState(null);
    setObjectionUI(null);
    setComputerThinkingId(null);
    setTimeLeft(null);
  }

  async function resolveMove(currentState, option) {
    const { state: newState, objection } = applyMove(currentState, option, stationsData, config);

    if (!objection) {
      setEngineState(newState);
      return;
    }

    setObjectionUI({ ...objection, callerId: getCurrentPlayerId(currentState), stage: 'called' });
    await wait(1400);

    if (!objection.raised) {
      setObjectionUI((prev) => (prev ? { ...prev, stage: 'ruled' } : prev));
      await wait(1200);
      setEngineState(newState);
      setObjectionUI(null);
      return;
    }

    setObjectionUI((prev) => (prev ? { ...prev, stage: 'objected' } : prev));
    await wait(1600);

    setObjectionUI((prev) => (prev ? { ...prev, stage: 'ruled' } : prev));
    await wait(1800);

    setEngineState(newState);
    setObjectionUI(null);
  }

  function makeHumanMove(option) {
    if (!engineState || engineState.status !== 'playing' || objectionUI || option.disabled) return;
    const currentId = getCurrentPlayerId(engineState);
    const player = engineState.players.find((p) => p.id === currentId);
    if (!player?.isHuman) return;
    resolveMove(engineState, option);
  }

  // Computer players take their turn automatically after a fake pause.
  useEffect(() => {
    if (!engineState || engineState.status !== 'playing' || objectionUI) return;

    const currentId = getCurrentPlayerId(engineState);
    const player = engineState.players.find((p) => p.id === currentId);
    if (!player || player.isHuman) return;

    setComputerThinkingId(currentId);
    const delay = randomBetween(config.aiThinkingDelayMsMin, config.aiThinkingDelayMsMax);

    const timer = setTimeout(() => {
      const options = computeAvailableStations(engineState, stationsData);
      const choice = computerDecision(engineState, options, config);
      setComputerThinkingId(null);
      resolveMove(engineState, choice);
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineState, objectionUI]);

  // Countdown timer for the human's turn when tonight's rule is timed.
  useEffect(() => {
    if (!engineState || engineState.status !== 'playing' || objectionUI) {
      setTimeLeft(null);
      return;
    }

    const limit = engineState.activeRuleEffects.timeLimitSeconds;
    const currentId = getCurrentPlayerId(engineState);
    const player = engineState.players.find((p) => p.id === currentId);

    if (!limit || !player?.isHuman) {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(limit);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          clearInterval(interval);
          setEngineState((prev) => applyTimeout(prev));
          return null;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineState, objectionUI]);

  // Ambient commentary feed while a game is in progress.
  useEffect(() => {
    if (!engineState || engineState.status !== 'playing') return;

    let timer;
    const scheduleNext = () => {
      const delay = randomBetween(config.commentaryIntervalMsMin, config.commentaryIntervalMsMax);
      timer = setTimeout(() => {
        const line = pickCommentaryLine();
        setCommentary((prev) => [...prev.slice(-24), { ...line, key: `${Date.now()}-${Math.random()}` }]);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineState?.status]);

  const value = {
    engineState,
    objectionUI,
    computerThinkingId,
    timeLeft,
    commentary,
    startGame,
    makeHumanMove,
    playAgain,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  return useContext(GameContext);
}
