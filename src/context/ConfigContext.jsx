import { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://localhost/api',
  aiThinkingDelayMsMin: 1200,
  aiThinkingDelayMsMax: 3200,
  objectionChance: 0.25,
  objectionUpheldChance: 0.18,
  commentaryIntervalMsMin: 4000,
  commentaryIntervalMsMax: 9000,
  showRetiredStationsDefault: false,
  humanMaxChoices: 25,
  computerMaxChoices: 25,
  humanMcChance: 0.05,
  computerMcChance: 0.15,
};

const ConfigContext = createContext(DEFAULT_CONFIG);

/**
 * Loads public/.config.json once at boot, falling back to sensible
 * defaults if it's missing so the game is always playable.
 */
export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let cancelled = false;

    fetch('/.config.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('config fetch failed'))))
      .then((json) => {
        if (!cancelled) setConfig({ ...DEFAULT_CONFIG, ...json });
      })
      .catch(() => {
        // keep defaults
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}
