import { useCallback, useEffect, useState } from "react";
import Login from "@/components/Login";
import { useGame } from '@/contexts/GameContext';
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import Test from "./components/Test";

function App() {

  const [isLogged, setIsLogged] = useState(false);
  const [isComponentVisible, setIsComponentVisible] = useState(false);

  const showPlayerInfo = useCallback(() => {
    console.log(gameEventEmitter);
    setIsComponentVisible(true);
  }, []);

  const hidePlayerInfo = useCallback(() => {
    console.log(gameEventEmitter);
    setIsComponentVisible(false);
  }, []);

  useEffect(() => {
    gameEventEmitter.on("showPlayerInfo", showPlayerInfo);
    gameEventEmitter.on("hidePlayerInfo", hidePlayerInfo);

    return () => {
      gameEventEmitter.off("showPlayerInfo", showPlayerInfo);
      gameEventEmitter.off("hidePlayerInfo", hidePlayerInfo);
    };
  }, []);

  const game = useGame();

  const handleClick = () => {
    if (game) {
      game.directLogin();
      setIsLogged(true);
    }
  };

  return (
    <div className="absolute z-10">
      {!isLogged && <Login onClick={handleClick} />}
      {isComponentVisible && <p>Showing player info</p>}
      <Test></Test>
    </div>
  )
}

export default App
