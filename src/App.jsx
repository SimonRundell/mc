import { ConfigProvider } from './context/ConfigContext';
import { GameProvider, useGame } from './context/GameContext';
import StartScreen from './components/StartScreen';
import TubeBoard from './components/TubeBoard';
import GameOverPanel from './components/GameOverPanel';
import HowToPlayDrawer from './components/HowToPlayDrawer';
import './styles/app.css';

function Screen() {
  const { engineState } = useGame();

  if (!engineState) return <StartScreen />;
  if (engineState.status === 'finished') return <GameOverPanel />;
  return <TubeBoard />;
}

export default function App() {
  return (
    <ConfigProvider>
      <GameProvider>
        <div className="app-shell">
          <Screen />
          <HowToPlayDrawer />
        </div>
      </GameProvider>
    </ConfigProvider>
  );
}
