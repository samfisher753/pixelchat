import { useEffect, useRef, useState } from 'react';
import { PlayerStatus } from "@/enums/PlayerStatus";
import Player from "@/models/entities/Player";

const PlayerInfo = ({ player }: {
  player: Player;
}) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = player.images?.[PlayerStatus.Stand]?.[6]?.[0] as HTMLImageElement | undefined;
    const container = containerRef.current;
    if (!img || !container) return;

    container.appendChild(img);
    setReady(true);

    return () => {
      if (container.contains(img)) {
        container.removeChild(img);
      }
    };
  }, [player]);

  return (
    <div className="absolute w-full h-full">
      <div className={`absolute right-[12px] bottom-[12px] p-[10px] z-10 rounded-[7px] bg-playerInfoDarkGrey pointer-events-auto w-[190px] transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        <p className="m-0 text-white font-bold text-[14px]">
          {player.username}
        </p>
        <div className="border border-[#333333] w-full h-[1px]" />
        <div
          ref={containerRef}
          className="bg-playerInfoLightGrey border border-playerInfoBorderBlack rounded-[5px] inline-block mt-[3px] pt-[5px] pr-[5px] pb-[15px] pl-[8px]"
        />
        <div className="border border-[#333333] w-full h-[1px]" />
        <p className="bg-playerInfoLightGrey border border-playerInfoBorderBlack rounded-[5px] min-h-[24px] mt-[3px] mb-[3px] px-[15px] py-[8px] flex items-center justify-center text-center text-white text-[12px] break-words">
          {player.motto || ''}
        </p>
      </div>
    </div>
  );
};

export default PlayerInfo;
