import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useConfig } from '../context/ConfigContext';
import HighScoreBoard from './HighScoreBoard';

export default function StartScreen() {
  const { startGame } = useGame();
  const config = useConfig();
  const [name, setName] = useState('');
  const [retiredEnabled, setRetiredEnabled] = useState(config.showRetiredStationsDefault);

  function handleSubmit(e) {
    e.preventDefault();
    startGame(name.trim(), retiredEnabled);
  }

  return (
    <div className="start-screen">
      <img className="start-screen__roundel" src="/mc_logo.png" alt="Mornington Crescent" />
      <h1>Mornington Crescent</h1>
      <p className="start-screen__tagline">
        A parlour game of supposedly great skill. Three computer players will join you.
        The winner is whoever first calls Mornington Crescent &mdash; though it may be
        objected to.
      </p>

      <form className="start-screen__form" onSubmit={handleSubmit}>
        <label htmlFor="player-name">Your name</label>
        <input
          id="player-name"
          type="text"
          value={name}
          maxLength={40}
          placeholder="e.g. Humphrey"
          onChange={(e) => setName(e.target.value)}
        />

        <label className="start-screen__toggle">
          <input
            type="checkbox"
            checked={retiredEnabled}
            onChange={(e) => setRetiredEnabled(e.target.checked)}
          />
          Include retired and closed stations
        </label>

        <button type="submit" className="button-primary">
          Start the game
        </button>
      </form>

      <HighScoreBoard />
    </div>
  );
}
