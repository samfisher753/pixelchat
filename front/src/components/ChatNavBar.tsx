import NavBarItem from "@/components/NavBarItem";
import { useGame } from "@/contexts/GameContext";
import Game from "@/models/logic/Game";
import ChatInput from "@/components/ChatInput";

const ChatNavBar = ({ roomJoined, onToggleRoomsList } : 
  {
    roomJoined: boolean,
    onToggleRoomsList: () => void
  }
) => {

  const game: Game | null = useGame();

  const leaveRoom = () => {
    game!.sendLeaveRoom();
  };

  return (
    <div className="grow-0 w-full h-[50px] p-0 m-0 pl-[20px] bg-barGrey border-t-2 border-b border-barBorderGrey pointer-events-auto">
      { roomJoined && 
        <NavBarItem onClick={leaveRoom} imgSrc="/assets/icons/back.png" />
      }
      <NavBarItem onClick={onToggleRoomsList} imgSrc="/assets/icons/rooms.png" />
      { roomJoined &&
        <ChatInput />
      }
    </div>
  );

}

export default ChatNavBar;