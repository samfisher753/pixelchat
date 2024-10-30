import { useCallback } from "react";
import NavBarItem from "@/components/NavBarItem";
import { useGame } from "@/contexts/GameContext";
import Game from "@/models/logic/Game";
import ChatInput from "@/components/ChatInput";

const NavBar = ({ roomJoined } : 
  {
    roomJoined: boolean
  }
) => {

  const game: Game = useGame();

  const toggleRoomsList = useCallback(() => {
    game.toggleRoomsListWindow();
  }, []);

  const leaveRoom = useCallback(() => {
    game.sendLeaveRoom();
  }, []);

  return (
    <div className="grow-0 w-full h-[50px] p-0 m-0 pl-[20px] bg-barGrey border-t-2 border-b border-barBorderGrey pointer-events-auto">
      { roomJoined && 
        <NavBarItem onClick={leaveRoom} imgSrc="/assets/icons/back.png" />
      }
      <NavBarItem onClick={toggleRoomsList} imgSrc="/assets/icons/rooms.png" />
      { roomJoined &&
        <ChatInput />
      }
    </div>
  );

}

export default NavBar;