import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { useCallback, useEffect, useState } from "react";

const Test = () => {

  const [showing, setShowing] = useState(false);

  const showPlayerInfo = useCallback(() => {
    setShowing(true);
  }, []);

  const hidePlayerInfo = useCallback(() => {
    setShowing(false);
  }, []);

  useEffect(() => {
    gameEventEmitter.on("showPlayerInfo", showPlayerInfo);
    gameEventEmitter.on("hidePlayerInfo", hidePlayerInfo);

    return () => {
      gameEventEmitter.off("showPlayerInfo", showPlayerInfo);
      gameEventEmitter.off("hidePlayerInfo", hidePlayerInfo);
    };
  }, []);

  const dettachHandlers = () => {
    gameEventEmitter.off("showPlayerInfo", showPlayerInfo);
    gameEventEmitter.off("hidePlayerInfo", hidePlayerInfo);
  };

  return (
    <div>
      {
        showing ?
          <p>Test: showing player info</p>
          :
          <p>Test: hiding player info</p>
      }
      <button onClick={dettachHandlers}>Test: dettach handlers</button>
    </div>
  );
};

export default Test;