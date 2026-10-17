import { useEffect, useRef } from "react";
import { Shirt } from "lucide-react";
import Player from "@/models/entities/Player";
import { PlayerStatus } from "@/enums/PlayerStatus";
import { grid } from "@/models/logic/Grid";

// Dónde termina el pico del menú respecto a la esquina superior de la casilla: un poco por
// encima de la cabeza, para no taparla (Player.ts dibuja el sprite en y - 84)
const HEAD_TOP_STAND = -78;
const HEAD_TOP_SIT = -56;
const TILE_HALF_WIDTH = 32;

// Menú flotante sobre la cabeza del propio personaje. Sigue al muñeco mientras camina.
const PlayerMenu = ({ player, onChangeLook, onClose }: {
  player: Player;
  onChangeLook: () => void;
  onClose: () => void;
}) => {

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId = 0;
    const place = () => {
      const el = menuRef.current;
      const pos = player.pos;
      const dp = pos ? grid.drawPos[pos.y]?.[pos.x] : undefined;
      if (el) {
        if (dp) {
          const walk = player.status === PlayerStatus.Walk && player.walkd ? player.walkd : { x: 0, y: 0 };
          const headTop = player.status === PlayerStatus.Sit ? HEAD_TOP_SIT : HEAD_TOP_STAND;
          el.style.left = `${Math.round(dp.x + TILE_HALF_WIDTH + walk.x)}px`;
          el.style.top = `${Math.round(dp.y + headTop + walk.y)}px`;
          el.style.visibility = 'visible';
        } else {
          el.style.visibility = 'hidden';
        }
      }
      frameId = requestAnimationFrame(place);
    };
    frameId = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frameId);
  }, [player]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div ref={menuRef} className="absolute z-20 -translate-x-1/2 -translate-y-full invisible pointer-events-auto">
      <div className="min-w-[160px] bg-[#2C2C2C] border border-[#383838] rounded-xl shadow-2xl overflow-hidden">
        <p className="px-3 py-2 text-sm font-bold text-white border-b border-[#383838] truncate">
          {player.username}
        </p>
        <button type="button" onClick={onChangeLook}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-200 hover:bg-[#383838] hover:text-white transition-colors">
          <Shirt className="w-4 h-4" />
          Cambiar aspecto
        </button>
      </div>
      {/* Pico que apunta a la cabeza */}
      <div className="w-3 h-3 mx-auto -mt-[7px] bg-[#2C2C2C] border-r border-b border-[#383838] rotate-45" />
    </div>
  );
};

export default PlayerMenu;
