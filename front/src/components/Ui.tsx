import { useEffect, useState } from "react";
import Login from "@/components/Login";
import NavBar from "@/components/NavBar";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import RoomListWindow from "./RoomListWindow";
import ChatPanel from "@/components/ChatPanel";
import OverlayChat from "@/components/OverlayChat";
import Player from "@/models/entities/Player";
import PlayerInfo from "@/components/PlayerInfo";

const Ui = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [playerInfoPlayer, setPlayerInfoPlayer] = useState<Player | null>(null);

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

    const showPlayerInfo = (player: Player) => {
      setPlayerInfoPlayer(player);
    };

    const hidePlayerInfo = () => {
      setPlayerInfoPlayer(null);
    };

    gameEventEmitter.on(GameEvent.PlayerLoggedIn, handleLogin);
    gameEventEmitter.on(GameEvent.RoomJoined, handleRoomJoined);
    gameEventEmitter.on(GameEvent.RoomLeft, handleRoomLeft);
    gameEventEmitter.on(GameEvent.ShowPlayerInfo, showPlayerInfo);
    gameEventEmitter.on(GameEvent.HidePlayerInfo, hidePlayerInfo);
    
    return () => {
      gameEventEmitter.off(GameEvent.PlayerLoggedIn, handleLogin);
      gameEventEmitter.off(GameEvent.RoomJoined, handleRoomJoined);
      gameEventEmitter.off(GameEvent.RoomLeft, handleRoomLeft);
      gameEventEmitter.off(GameEvent.ShowPlayerInfo, showPlayerInfo);
      gameEventEmitter.off(GameEvent.HidePlayerInfo, hidePlayerInfo);
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
            {roomJoined && <OverlayChat />}
            {playerInfoPlayer && <PlayerInfo player={playerInfoPlayer} />}
          </div>
          <NavBar roomJoined={roomJoined} />
        </div>    
      }
    </div>
  );
};

export default Ui;