import { ReactNode } from 'react';
import PlayerFace from '@/components/ChatMsg/PlayerFace';
import { DEFAULT_LOOK, parseLook } from '@/models/others/avatar/Look';
import { Msg } from '@/types/Msg';

// Bocadillo común a todos los mensajes de un jugador (texto, imagen, audio, vídeo).
// A la izquierda, una columna del color de su camiseta con su cara, a toda la altura del bocadillo.
// A la derecha, el nombre y el contenido del mensaje.
// align-top evita el hueco que deja la línea base bajo un elemento en línea: así el alto medido
// es el del bocadillo (OverlayChat coloca el indicador justo debajo).
// El fondo blanco va solo en la zona del contenido, no en el contenedor: si no, en las esquinas
// redondeadas de la columna de color asoma un poco de blanco por el suavizado del borde.
const MsgBubble = ({ msg, children }: { msg: Msg; children: ReactNode }) => {

  const look = msg.player!.look;
  const shirt = (parseLook(look) ?? DEFAULT_LOOK).shirt;

  return (
    <div className="relative max-w-full inline-flex align-top items-stretch rounded-md overflow-hidden m-0 text-sm border border-black text-black">
      <span data-face-column className="shrink-0 flex items-start pt-[2px] px-[3px] border-r border-black" style={{ background: shirt }}>
        <PlayerFace look={look} />
      </span>
      <div className="min-w-0 break-words bg-white pl-[5px] pr-2 py-[2px]">
        <span className="font-bold mr-[5px]">{msg.player!.name}:</span>
        {children}
      </div>
    </div>
  );
};

export default MsgBubble;
