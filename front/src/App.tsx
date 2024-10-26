import { useCallback, useEffect, useState } from "react";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import Ui from "@/components/Ui";

function App() {
  const [startUi, setStartUi] = useState(false);
  
  const handleStartUi = useCallback(() => {
    setStartUi(true);
  }, []);

  useEffect(() => {
    gameEventEmitter.on(GameEvent.StartUi, handleStartUi);
    return () => {
      gameEventEmitter.off(GameEvent.StartUi, handleStartUi);
    };
  }, []);  

  return (
    <div className="absolute z-10 w-full h-full pointer-events-none">
      { startUi && <Ui/>}
    </div>
  )
}

export default App
