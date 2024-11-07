import { PlayerStatus } from "@/enums/PlayerStatus";
import Player from "@/models/entities/Player";

const PlayerInfo = ({ player }: {
  player: Player;
}) => {

  const playerImg: HTMLImageElement = player.images![PlayerStatus.Stand][6][0] as HTMLImageElement;

  return (
    <div className="absolute w-full h-full">
      <div className="absolute right-[12px] bottom-[12px] z-10 rounded-[7px] bg-playerInfoDarkGrey pointer-events-auto">
        <p className="m-0 p-[10px_15px] text-white font-bold text-[14px]">
          {player.name}
        </p>
        <div className="bg-playerInfoLightGrey border border-playerInfoBorderBlack rounded-[5px] inline-block mt-[0px] mr-[10px] mb-[12px] ml-[10px] pt-[5px] pr-[5px] pb-[15px] pl-[8px]">
          <img src={playerImg.src}></img>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;