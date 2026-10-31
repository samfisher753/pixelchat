import { RoomListItem } from "@/types/RoomListItem";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useState } from "react";
import RoomListWindowLine from "./RoomListWindowLine";
import { Building2 } from "lucide-react";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import Game from "@/models/logic/Game";
import DraggableWindow from "./DraggableWindow";

const RoomListWindow = ({ open, setWindowOpen }: { open: boolean; setWindowOpen: (open:boolean) => void }) => {

  const game: Game | null = useGame();
  const [rooms, setRooms] = useState<RoomListItem[] | null>(null);

  useEffect(() => {
    const onUpdateRoomsList = (rooms: RoomListItem[]) => {
      setRooms(rooms);
    };

    const onSocketReady = () => {
      setWindowOpen(true);
    };

    gameEventEmitter.on(GameEvent.UpdateRoomsList, onUpdateRoomsList);
    gameEventEmitter.on(GameEvent.SocketReady, onSocketReady);

    return () => {
      gameEventEmitter.off(GameEvent.UpdateRoomsList, onUpdateRoomsList);
      gameEventEmitter.off(GameEvent.SocketReady, onSocketReady);
    };
  }, []);

  // Mientras la ventana está abierta, la lista se refresca cada 10 s; al cerrarla se para
  useEffect(() => {
    if (!open) {
      setRooms(null);
      return;
    }
    game!.requestRoomsList();
    const idInterval = setInterval(() => {
      game!.requestRoomsList();
    }, 10000);
    return () => clearInterval(idInterval);
  }, [open, game]);

  const joinRoom = (roomName: string) => {
    game!.sendJoinRoom(roomName);
    onClose();
  };

  const onClose = () => {
    setWindowOpen(false);
  };

  // No se muestra hasta que llega la lista, así se centra ya con su alto final
  return (
    <DraggableWindow open={open && rooms !== null} onClose={onClose} title="Salas"
      icon={<Building2 className="w-4 h-4 text-neutral-400" />} className="w-[300px] max-h-[316px]">
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {
          rooms && rooms.map((r, i) => <RoomListWindowLine roomName={r.name} playerCount={r.players} onClick={joinRoom} key={i} /> )
        }
      </div>
    </DraggableWindow>
  );
};

export default RoomListWindow;
