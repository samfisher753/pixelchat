import { useCallback, useEffect, useState } from "react";
import Login from "@/components/Login";
import NavBar from "@/components/NavBar";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";

const Ui = () => {
  const [isLogged, setIsLogged] = useState(false);

  const handleLogin = useCallback(() => {
    setIsLogged(true);
  }, []);

  useEffect(() => {
    gameEventEmitter.on(GameEvent.PlayerLoggedIn, handleLogin);
    return () => {
      gameEventEmitter.off(GameEvent.PlayerLoggedIn, handleLogin);
    };
  }, []);

  return (
    <div className="absolute w-full h-full pointer-events-none">
      {!isLogged && <Login />}
      {isLogged && <NavBar />}
    </div>
  );
};

export default Ui;