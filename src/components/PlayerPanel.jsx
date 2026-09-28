import { useState } from 'react';

export default function PlayerPanel({ player, isCurrentTurn, isThinking, score, lastMove, moveHistory }) {
  const [expanded, setExpanded] = useState(false);
  const direction = player.position === 'bottom' ? 'up' : 'down';
  const playerMoves = moveHistory.filter((m) => m.playerId === player.id);

  return (
    <div className={`player-panel player-panel--${player.position} ${isCurrentTurn ? 'player-panel--active' : ''}`}>
      <div className="player-panel__name">{player.name}</div>

      <button
        type="button"
        className="player-panel__score"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        title="Show previous moves"
      >
        {score} pts
      </button>

      {isThinking && <div className="player-panel__thinking">considering the board&hellip;</div>}
      {lastMove && !isThinking && (
        <div className="player-panel__last-move">
          {lastMove.isMC ? 'Called Mornington Crescent' : `Played ${lastMove.stationName}`}
        </div>
      )}

      {expanded && (
        <div className={`player-panel__history player-panel__history--${direction}`}>
          {playerMoves.length === 0 ? (
            <p className="player-panel__history-empty">No moves yet.</p>
          ) : (
            <ol>
              {playerMoves.map((m, i) => (
                <li key={i}>
                  {m.isMC ? 'Mornington Crescent' : m.stationName}
                  <span className="player-panel__history-points">{m.points} pts</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
