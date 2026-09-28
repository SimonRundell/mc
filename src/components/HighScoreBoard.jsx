import { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { fetchHighScores } from '../api/highscores';

export default function HighScoreBoard({ refreshKey }) {
  const config = useConfig();
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHighScores(config.apiBaseUrl)
      .then((data) => {
        if (!cancelled) setScores(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [config.apiBaseUrl, refreshKey]);

  return (
    <div className="high-score-board">
      <h3>Top Ten</h3>
      {error && <p className="high-score-board__error">The high score board couldn't be reached.</p>}
      {!error && scores.length === 0 && <p className="high-score-board__empty">No scores recorded yet.</p>}
      {scores.length > 0 && (
        <ol className="high-score-board__list">
          {scores.map((s, i) => (
            <li key={`${s.name}-${s.achievedAt}-${i}`}>
              <span className="high-score-board__rank">{i + 1}</span>
              <span className="high-score-board__name">{s.name}</span>
              <span className="high-score-board__score">{s.score}</span>
              <span className="high-score-board__rule">{s.ruleName}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
