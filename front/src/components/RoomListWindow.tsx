import { RoomListItem } from "@/types/RoomListItem";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useRef, useState } from "react";
import RoomListWindowLine from "./RoomListWindowLine";
import clsx from "clsx";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";

const RoomListWindow = () => {

  const game = useGame();
  const [rooms, setRooms] = useState<RoomListItem[] | null>(null);
  const parentRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const draggableRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [open, setOpen] = useState(false);

  let idInterval: NodeJS.Timeout;

  useEffect(() => {
    setInitialPos();

    const onUpdateRoomsList = (rooms: RoomListItem[]) => {
      setRooms(rooms);
    };

    gameEventEmitter.on(GameEvent.UpdateRoomsList, onUpdateRoomsList);
    gameEventEmitter.on(GameEvent.ToggleRoomsListWindow, setOpen);

    game.toggleRoomsListWindow();

    return () => {
      gameEventEmitter.off(GameEvent.UpdateRoomsList, onUpdateRoomsList);
      gameEventEmitter.off(GameEvent.ToggleRoomsListWindow, setOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      game.requestRoomsList();
      idInterval = setInterval(() => {
        game.requestRoomsList();
      }, 10000);
    } else { 
      if (idInterval) {
        clearInterval(idInterval);
      }
      setRooms(null);
    }
  }, [open]);

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
      Math.max(0, element.left + e.movementX),
      parent.width - element.width
    );
    const newY = Math.min(
      Math.max(0, element.top + e.movementY),
      parent.height - element.height
    );

    draggableRef.current.style.left = `${newX}px`;
    draggableRef.current.style.top = `${newY}px`;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const joinRoom = (roomName: string) => {
    game.sendJoinRoom(roomName);
    onClose();
  };

  const onClose = () => {
    game.toggleRoomsListWindow();
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
        className="absolute w-[290px] h-[316px] z-20 p-0 m-0 bg-roomListWindow border border-black rounded-lg pointer-events-auto"
        >
        <div className="relative bg-roomListWindowHeader h-[30px] text-center text-white rounded-t-md flex justify-center items-center cursor-move"
          onMouseDown={handleMouseDown}>
          <span>
            Navegador
          </span>
          <span className="absolute right-[5px] top-[5px] rounded bg-closeButtonRed text-white w-[20px] h-[20px] border border-black cursor-pointer flex justify-center items-center"
            onClick={onClose}>
            <span>X</span>
          </span>
        </div>
        <div className="p-[15px]">
          <div className="bg-white p-[5px]">
            {
              rooms && rooms.map((r, i) => <RoomListWindowLine roomName={r.name} playerCount={r.players} onClick={joinRoom} key={i} index={i} /> )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomListWindow;