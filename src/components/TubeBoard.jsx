import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useConfig } from '../context/ConfigContext';
import { stationsData } from '../data';
import { computeAvailableStations, getCurrentPlayerId, limitChoices } from '../engine/gameEngine';
import PlayerPanel from './PlayerPanel';
import RuleCard from './RuleCard';
import StationSelect from './StationSelect';
import MapPanel from './MapPanel';
import CommentaryFeed from './CommentaryFeed';
import ObjectionModal from './ObjectionModal';

export default function TubeBoard() {
  const { engineState, objectionUI, computerThinkingId, timeLeft, commentary, makeHumanMove } = useGame();

  const currentPlayerId = getCurrentPlayerId(engineState);
  const currentPlayer = engineState.players.find((p) => p.id === currentPlayerId);
  const human = engineState.players.find((p) => p.isHuman);

  const config = useConfig();
  const isHumanTurn = !!currentPlayer?.isHuman;

  // Re-drawn whenever the engine state moves on, so each human turn gets a
  // fresh random shortlist.
  const options = useMemo(() => {
    const all = computeAvailableStations(engineState, stationsData);
    return isHumanTurn ? limitChoices(all, config.humanMaxChoices, config.humanMcChance) : all;
  }, [engineState, isHumanTurn, config.humanMaxChoices, config.humanMcChance]);

  function lastMoveFor(playerId) {
    return [...engineState.moveHistory].reverse().find((m) => m.playerId === playerId) || null;
  }

  const moveHistory = engineState.moveHistory;

  return (
    <div className="tube-board">
      {['top', 'left', 'right'].map((pos) => {
        const player = engineState.players.find((p) => p.position === pos);
        return (
          <PlayerPanel
            key={player.id}
            player={player}
            isCurrentTurn={currentPlayerId === player.id}
            isThinking={computerThinkingId === player.id}
            score={engineState.scores[player.id] || 0}
            lastMove={lastMoveFor(player.id)}
            moveHistory={moveHistory}
          />
        );
      })}

      <div className="tube-board__center">
        <RuleCard effects={engineState.activeRuleEffects} />
        <MapPanel moveHistory={engineState.moveHistory} hidden={engineState.activeRuleEffects.hideMap} />
        <CommentaryFeed lines={commentary} />
      </div>

      <PlayerPanel
        player={human}
        isCurrentTurn={currentPlayerId === human.id}
        isThinking={false}
        score={engineState.scores[human.id] || 0}
        lastMove={lastMoveFor(human.id)}
        moveHistory={moveHistory}
      />

      <StationSelect
        options={options}
        onSelect={makeHumanMove}
        disabled={!currentPlayer?.isHuman || !!objectionUI}
        timeLeft={timeLeft}
      />

      <ObjectionModal objection={objectionUI} players={engineState.players} />
    </div>
  );
}
