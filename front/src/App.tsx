import { useCallback, useEffect, useState } from "react";
import Login from "@/components/Login";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";

function App() {

  const [startUI, setStartUI] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const handleStartUI = useCallback(() => {
    setStartUI(true);
  }, []);

  const handleLogin = useCallback(() => {
    setIsLogged(true);
  }, []);

  useEffect(() => {
    gameEventEmitter.on("startUI", handleStartUI);
    gameEventEmitter.on("playerLoggedIn", handleLogin);

    return () => {
      gameEventEmitter.off("startUI", handleLogin);
      gameEventEmitter.off("playerLoggedIn", handleLogin);
    };
  }, []);  

  return (
    <div className="absolute z-10 w-full h-full pointer-events-none">
      {
        startUI && 
        <div className="absolute w-full h-full pointer-events-none">
          {!isLogged && <Login />}
        </div>
      }
    </div>
  )
}

export default App
