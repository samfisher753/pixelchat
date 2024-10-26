import { RoomListItem } from "@/types/RoomListItem";
import { useGame } from "@/contexts/GameContext";
import { useCallback, useEffect, useRef, useState } from "react";
import RoomListWindowLine from "./RoomListWindowLine";
import { Pos } from "@/types/Pos";
import clsx from "clsx";

const RoomListWindow = ({ rooms, onClose }:
  {
    rooms: RoomListItem[];
    onClose: () => void;
  }
) => {

  const game = useGame();
  const [position, setPosition] = useState<Pos>({ x: 0, y: 0 });
  const parentRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const draggableRef: React.RefObject<HTMLDivElement> | null = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const parent = parentRef.current!.getBoundingClientRect();
    const element = draggableRef.current!.getBoundingClientRect();

    const x: number = (parent.width - element.width) / 2;
    const y: number = (parent.height - element.height) / 2;

    setPosition({x, y});
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !parentRef.current || !draggableRef.current) return;

    const parent = parentRef.current.getBoundingClientRect();
    const element = draggableRef.current.getBoundingClientRect();
    
    const newX = Math.min(
      Math.max(0, position.x + e.movementX),
      parent.width - element.width
    );
    const newY = Math.min(
      Math.max(0, position.y + e.movementY),
      parent.height - element.height
    );

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const joinRoom = useCallback((roomName: string) => {
    game.sendJoinRoom(roomName);
    onClose();
  }, []);

  return (
    <div ref={parentRef} 
      className={clsx("absolute w-full h-full",
        {
          "pointer-events-none": !isDragging,
          "pointer-events-auto": isDragging
        })}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}>
      <div ref={draggableRef} 
        className="absolute w-[290px] h-[316px] z-10 p-0 m-0 bg-roomListWindow border border-black rounded-lg pointer-events-auto"
        style={{top: position.y, left: position.x,}}
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
              rooms.map((r, i) => <RoomListWindowLine roomName={r.name} playerCount={r.players} onClick={joinRoom} key={i} index={i} /> )
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomListWindow;