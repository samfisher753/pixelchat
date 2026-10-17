import NavBarItem from "@/components/NavBarItem";
import { useGame } from "@/contexts/GameContext";
import Game from "@/models/logic/Game";
import ChatInput from "@/components/ChatInput";
import { DoorOpen, Building2 } from "lucide-react";

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
    <div className="relative grow-0 w-full h-[50px] p-0 m-0 pl-[12px] bg-barGrey border-t-2 border-b border-barBorderGrey pointer-events-auto">
      { roomJoined && 
        <NavBarItem onClick={leaveRoom} icon={<DoorOpen className="w-4 h-4" />} label="Salir de la sala" />
      }
      <NavBarItem onClick={onToggleRoomsList} icon={<Building2 className="w-4 h-4" />} label="Salas" />
      { roomJoined &&
        <ChatInput />
      }
    </div>
  );

}

export default ChatNavBar;