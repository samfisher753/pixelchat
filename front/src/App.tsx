import { useCallback, useEffect, useState } from "react";
import Login from "@/components/Login";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import NavBar from "@/components/NavBar";
import { GameEvent } from "@/enums/GameEvent";

function App() {

  const [startUi, setStartUi] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const handleStartUi = useCallback(() => {
    setStartUi(true);
  }, []);

  const handleLogin = useCallback(() => {
    setIsLogged(true);
  }, []);

  useEffect(() => {
    gameEventEmitter.on(GameEvent.StartUi, handleStartUi);
    gameEventEmitter.on(GameEvent.PlayerLoggedIn, handleLogin);

    return () => {
      gameEventEmitter.off(GameEvent.StartUi, handleStartUi);
      gameEventEmitter.off(GameEvent.PlayerLoggedIn, handleLogin);
    };
  }, []);  

  return (
    <div className="absolute z-10 w-full h-full pointer-events-none">
      {
        startUi && 
        <div className="absolute w-full h-full pointer-events-none">
          {!isLogged && <Login />}
          { false && <NavBar />}
        </div>
      }
    </div>
  )
}

export default App
