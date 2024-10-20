import { createContext, useContext, useEffect, useState } from 'react'
import Game from '@/game/Game'

const GameContext = createContext({} as any);

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState({});

  useEffect(() => {
    const newGame = new Game();
    setGame(newGame);
  }, []);

  return (
    <GameContext.Provider value={game}>
      {children}
    </GameContext.Provider>
  );
};