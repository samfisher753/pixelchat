import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatNavBar from "@/components/ChatNavBar";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import RoomListWindow from "@/components/RoomListWindow";
import ChatPanel from "@/components/ChatPanel";
import OverlayChat from "@/components/OverlayChat";
import Player from "@/models/entities/Player";
import PlayerInfo from "@/components/PlayerInfo";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/providers/AuthProvider";

const ChatPage = () => {
  const [roomJoined, setRoomJoined] = useState(false);
  const [roomListWindowOpen, setRoomListWindowOpen] = useState(false);
  const [playerInfoPlayer, setPlayerInfoPlayer] = useState<Player | null>(null);
  const game = useGame();
  const auth = useAuth();
  const navigate = useNavigate();

  const toggleRoomListWindow = () => setRoomListWindowOpen(prev => !prev);

  useEffect(() => {
    game!.init();

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

    const handleTokenExpired = async () => {
      const success = await auth.refresh();
      if (success) {
        game!.connectSocket();
      } else {
        auth.logout();
        navigate('/login');
      }
    };

    gameEventEmitter.on(GameEvent.RoomJoined, handleRoomJoined);
    gameEventEmitter.on(GameEvent.RoomLeft, handleRoomLeft);
    gameEventEmitter.on(GameEvent.ShowPlayerInfo, showPlayerInfo);
    gameEventEmitter.on(GameEvent.HidePlayerInfo, hidePlayerInfo);
    gameEventEmitter.on(GameEvent.TokenExpired, handleTokenExpired);

    return () => {
      gameEventEmitter.off(GameEvent.RoomJoined, handleRoomJoined);
      gameEventEmitter.off(GameEvent.RoomLeft, handleRoomLeft);
      gameEventEmitter.off(GameEvent.ShowPlayerInfo, showPlayerInfo);
      gameEventEmitter.off(GameEvent.HidePlayerInfo, hidePlayerInfo);
      gameEventEmitter.off(GameEvent.TokenExpired, handleTokenExpired);
    };
  }, []);

  return (
    <>
      <div id="app" className="absolute w-full h-full min-w-[650px] min-h-[400px] overflow-hidden text-base text-[#333333]"></div>
      <div className="absolute z-10 flex flex-col w-full h-full min-w-[650px] min-h-[400px] pointer-events-none">
        <div className="relative grow pointer-events-none">
          <RoomListWindow open={roomListWindowOpen} setWindowOpen={setRoomListWindowOpen} />
          <ChatPanel show={roomJoined} />
          {roomJoined && <OverlayChat />}
          {playerInfoPlayer && <PlayerInfo player={playerInfoPlayer} />}
        </div>
        <ChatNavBar roomJoined={roomJoined} onToggleRoomsList={toggleRoomListWindow} />
      </div>
    </>
    
  );
};

export default ChatPage;