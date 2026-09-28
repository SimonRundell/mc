import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useConfig } from '../context/ConfigContext';
import { fetchHighScores, submitHighScore } from '../api/highscores';
import NameEntryModal from './NameEntryModal';
import HighScoreBoard from './HighScoreBoard';

export default function GameOverPanel() {
  const { engineState, playAgain } = useGame();
  const config = useConfig();
  const [qualifies, setQualifies] = useState(false);
  const [checked, setChecked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const winner = engineState.players.find((p) => p.id === engineState.winnerId);
  const human = engineState.players.find((p) => p.isHuman);
  const humanScore = engineState.scores[human.id] || 0;

  useEffect(() => {
    let cancelled = false;
    fetchHighScores(config.apiBaseUrl)
      .then((scores) => {
        if (cancelled) return;
        const qualifiesNow = scores.length < 10 || humanScore > Math.min(...scores.map((s) => s.score));
        setQualifies(qualifiesNow && humanScore > 0);
        setChecked(true);
      })
      .catch(() => setChecked(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveScore(name) {
    await submitHighScore(config.apiBaseUrl, {
      name,
      score: humanScore,
      ruleName: engineState.activeRuleEffects.rule.name,
      turns: engineState.moveHistory.length,
    });
    setSaved(true);
    setQualifies(false);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="game-over-panel">
      <h2>
        {winner?.name} {winner?.isHuman ? 'wins!' : 'wins.'}
      </h2>
      <p>
        {human.name} scored {humanScore} points in {engineState.moveHistory.length} moves.
      </p>

      {checked && qualifies && !saved && (
        <NameEntryModal
          defaultName={human.name}
          score={humanScore}
          onSubmit={handleSaveScore}
          onDismiss={() => setQualifies(false)}
        />
      )}

      <button className="button-primary" onClick={playAgain}>
        Play again
      </button>

      <HighScoreBoard refreshKey={refreshKey} />
    </div>
  );
}
