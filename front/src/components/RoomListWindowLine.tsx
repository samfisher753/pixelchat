import clsx from "clsx";

const RoomListWindowLine = ({ roomName, playerCount, onClick, index }:
    {
      roomName: string;
      playerCount: number;
      onClick: (roomName: string) => void;
      index: number;
    }
  ) => {

  return (
    <div className={clsx("h-[20px] py-px px-0 cursor-pointer text-sm rounded flex items-center",
      {
        "bg-roomListLine": index % 2 === 0
      })} 
      onClick={() => onClick(roomName)}>
      <span className={clsx("inline-flex w-[40px] h-[18px] text-white rounded justify-center items-center",
        {
          "bg-roomListPlayerCountGrey": playerCount === 0,
          "bg-roomListPlayerCountGreen": playerCount > 0
        })}>
        {playerCount}
      </span>
      <span className="text-black ml-[7px]">
        {roomName}
      </span>
    </div>
  );

}

export default RoomListWindowLine;