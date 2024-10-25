import { useCallback, useEffect, useState } from "react";
import NavBarItem from "@/components/NavBarItem";
import { useGame } from "@/contexts/GameContext";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import Game from "@/models/logic/Game";

const NavBar = () => {

  const game: Game = useGame();
  const [roomJoined, setRoomJoined] = useState(false);

  useEffect(() => {
    gameEventEmitter.on(GameEvent.RoomJoined, handleRoomJoined);
    gameEventEmitter.on(GameEvent.RoomLeft, handleRoomLeft);

    return () => {
      gameEventEmitter.off(GameEvent.RoomJoined, handleRoomJoined);
      gameEventEmitter.off(GameEvent.RoomLeft, handleRoomLeft);
    };
  }, []);

  const handleRoomJoined = useCallback(() => {
    setRoomJoined(true);
  }, []);

  const handleRoomLeft = useCallback(() => {
    setRoomJoined(false);
  }, []);

  const openRoomsList = useCallback(() => {
    game.openRoomsList();
  }, []);

  const leaveRoom = useCallback(() => {
    game.sendLeaveRoom();
  }, []);

  return (
    <div className="absolute bottom-0 w-full p-0 m-0 pl-[20px] bg-barGrey border-2 border-barBorderGrey pointer-events-auto">
      { roomJoined && 
        <NavBarItem onClick={leaveRoom} imgSrc="/assets/icons/back.png" />
      }
      <NavBarItem onClick={openRoomsList} imgSrc="/assets/icons/rooms.png" />
    </div>
  );

}

export default NavBar;