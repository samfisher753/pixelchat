import { createContext, useContext, useEffect, useState } from 'react'
import Game from '@/models/logic/Game'

const GameContext = createContext({} as Game);

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [game, setGame] = useState({} as Game);

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