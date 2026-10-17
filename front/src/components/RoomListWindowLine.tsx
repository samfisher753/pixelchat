import clsx from "clsx";
import { Users } from "lucide-react";

const RoomListWindowLine = ({ roomName, playerCount, onClick }:
    {
      roomName: string;
      playerCount: number;
      onClick: (roomName: string) => void;
    }
  ) => {

  return (
    <button type="button"
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-[#383838] transition-colors"
      onClick={() => onClick(roomName)}>
      <span className="flex-1 min-w-0 truncate text-sm font-medium text-white">
        {roomName}
      </span>
      <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums",
        {
          "bg-[#383838] text-neutral-400": playerCount === 0,
          "bg-emerald-500/15 text-emerald-400": playerCount > 0
        })}
        title={playerCount === 1 ? '1 persona' : `${playerCount} personas`}>
        <Users className="w-3 h-3" />
        {playerCount}
      </span>
    </button>
  );

}

export default RoomListWindowLine;
