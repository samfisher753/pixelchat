import { RoomListItem } from "@/types/RoomListItem";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useRef, useState } from "react";
import RoomListWindowLine from "./RoomListWindowLine";
import clsx from "clsx";
import { Building2, X } from "lucide-react";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import Game from "@/models/logic/Game";

const RoomListWindow = ({ open, setWindowOpen }: { open: boolean; setWindowOpen: (open:boolean) => void }) => {

  const game: Game | null = useGame();
  const [rooms, setRooms] = useState<RoomListItem[] | null>(null);
  const parentRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const draggableRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  // La ventana se centra la primera vez que llega la lista (su alto depende del número de salas)
  const centered = useRef(false);

  useEffect(() => {
    setInitialPos();

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

  useEffect(() => {
    if (rooms && !centered.current) {
      centered.current = true;
      setInitialPos();
    }
  }, [rooms]);

  const setInitialPos = () => {
    const parent = parentRef.current!.getBoundingClientRect();
    const element = draggableRef.current!.getBoundingClientRect();

    const x: number = (parent.width - element.width) / 2;
    const y: number = (parent.height - element.height) / 2;

    draggableRef.current!.style.left = `${x}px`;
    draggableRef.current!.style.top = `${y}px`;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !parentRef.current || !draggableRef.current) return;

    const parent = parentRef.current.getBoundingClientRect();
    const element = draggableRef.current.getBoundingClientRect();
    
    const newX = Math.min(
      Math.max(0, element.left + e.movementX - parent.left),
      parent.width - element.width
    );
    const newY = Math.min(
      Math.max(0, element.top + e.movementY - parent.top),
      parent.height - element.height
    );

    draggableRef.current.style.left = `${newX}px`;
    draggableRef.current.style.top = `${newY}px`;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const joinRoom = (roomName: string) => {
    game!.sendJoinRoom(roomName);
    onClose();
  };

  const onClose = () => {
    setWindowOpen(false);
  };

  return (
    <div ref={parentRef} 
      className={clsx("absolute w-full h-full",
        {
          "pointer-events-none": !isDragging,
          "pointer-events-auto": isDragging,
          "invisible": !open || !rooms
        })}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}>
      <div ref={draggableRef}
        className="absolute w-[300px] max-h-[316px] z-20 flex flex-col bg-[#2C2C2C] border border-[#383838] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        >
        <div className="h-11 shrink-0 pl-4 pr-2 flex items-center justify-between border-b border-[#383838] cursor-move select-none"
          onMouseDown={handleMouseDown}>
          <span className="flex items-center gap-2 text-sm font-bold text-white">
            <Building2 className="w-4 h-4 text-neutral-400" />
            Salas
          </span>
          <button type="button" aria-label="Cerrar"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#383838] transition-colors"
            onMouseDown={e => e.stopPropagation()}
            onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {
            rooms && rooms.map((r, i) => <RoomListWindowLine roomName={r.name} playerCount={r.players} onClick={joinRoom} key={i} /> )
          }
        </div>
      </div>
    </div>
  );
};

export default RoomListWindow;
