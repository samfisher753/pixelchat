import { useEffect, useState } from "react";
import Login from "@/components/Login";
import NavBar from "@/components/NavBar";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import RoomListWindow from "./RoomListWindow";
import ChatPanel from "./ChatPanel";

const Ui = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);

  useEffect(() => {

    const handleLogin = () => {
      setIsLogged(true);
    };

    const handleRoomJoined = () => {
      setRoomJoined(true);
    };
  
    const handleRoomLeft = () => {
      setRoomJoined(false);
    };

    gameEventEmitter.on(GameEvent.PlayerLoggedIn, handleLogin);
    gameEventEmitter.on(GameEvent.RoomJoined, handleRoomJoined);
    gameEventEmitter.on(GameEvent.RoomLeft, handleRoomLeft);
    
    return () => {
      gameEventEmitter.off(GameEvent.PlayerLoggedIn, handleLogin);
      gameEventEmitter.off(GameEvent.RoomJoined, handleRoomJoined);
      gameEventEmitter.off(GameEvent.RoomLeft, handleRoomLeft);
    };
  }, []);

  return (
    <div className="absolute w-full h-full pointer-events-none">
      {!isLogged && <Login />}
      {isLogged && 
        <div className="flex flex-col w-full h-full pointer-events-none">
          <div className="relative grow pointer-events-none">
            <RoomListWindow />
            <ChatPanel show={roomJoined} />
          </div>
          <NavBar roomJoined={roomJoined} />
        </div>    
      }
    </div>
  );
};

export default Ui;