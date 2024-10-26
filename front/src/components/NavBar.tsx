import { useCallback, useEffect, useState } from "react";
import NavBarItem from "@/components/NavBarItem";
import { useGame } from "@/contexts/GameContext";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import Game from "@/models/logic/Game";
import ChatInput from "@/components/ChatInput";

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
    <div className="grow-0 w-full h-[50px] p-0 m-0 pl-[20px] bg-barGrey border-t-2 border-b border-barBorderGrey pointer-events-auto">
      { roomJoined && 
        <NavBarItem onClick={leaveRoom} imgSrc="/assets/icons/back.png" />
      }
      <NavBarItem onClick={openRoomsList} imgSrc="/assets/icons/rooms.png" />
      { roomJoined &&
        <ChatInput />
      }
    </div>
  );

}

export default NavBar;