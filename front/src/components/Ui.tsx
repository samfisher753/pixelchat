import { useCallback, useEffect, useState } from "react";
import Login from "@/components/Login";
import NavBar from "@/components/NavBar";
import { gameEventEmitter } from "@/emitters/GameEventEmitter";
import { GameEvent } from "@/enums/GameEvent";
import RoomListWindow from "./RoomListWindow";
import { RoomListItem } from "@/types/RoomListItem";

const Ui = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [rooms, setRooms] = useState<RoomListItem[] | null>(null);

  const handleLogin = useCallback(() => {
    setIsLogged(true);
  }, []);

  useEffect(() => {
    gameEventEmitter.on(GameEvent.PlayerLoggedIn, handleLogin);
    gameEventEmitter.on(GameEvent.OpenRoomsList, onOpenRoomsList);
    return () => {
      gameEventEmitter.off(GameEvent.PlayerLoggedIn, handleLogin);
      gameEventEmitter.off(GameEvent.OpenRoomsList, onOpenRoomsList);
    };
  }, []);

  const onOpenRoomsList = useCallback((rooms: RoomListItem[]) => {
    setRooms(rooms);
  }, []);

  const onCloseRoomsList = useCallback(() => {
    setRooms(null);
  }, []);

  return (
    <div className="absolute w-full h-full pointer-events-none">
      {!isLogged && <Login />}
      {isLogged && 
        <div className="flex flex-col w-full h-full pointer-events-none">
          <div className="relative grow pointer-events-none">
            { rooms && <RoomListWindow rooms={rooms} onClose={onCloseRoomsList} /> }
          </div>
          <NavBar />
        </div>    
      }
    </div>
  );
};

export default Ui;