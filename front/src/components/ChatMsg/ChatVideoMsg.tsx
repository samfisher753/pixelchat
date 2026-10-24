import FileMsgLink from '@/components/ChatMsg/FileMsgLink';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';
import MsgBubble from '@/components/ChatMsg/MsgBubble';

const MAX_WIDTH: number = 300;
const MAX_HEIGHT: number = 150;

const ChatVideoMsg = ({ msg }: ChatMsgProps) => {

  // Si se conoce el tamaño del vídeo, se fija desde el principio (escalado para caber en el bocadillo).
  // Si no, el navegador lo ajusta al cargar.
  let size: React.CSSProperties | undefined;
  if (msg.mediaWidth && msg.mediaHeight) {
    const scale: number = Math.min(1, MAX_WIDTH / msg.mediaWidth, MAX_HEIGHT / msg.mediaHeight);
    size = { width: Math.round(msg.mediaWidth * scale), height: Math.round(msg.mediaHeight * scale) };
  }

  return (
    <MsgBubble msg={msg}>
      <div>
        {msg.type === "video/mp4" &&
          <video className='block max-h-[150px] max-w-full'
            style={size}
            controls
            src={msg.data} />
        }
        <FileMsgLink msg={msg} />
      </div>
    </MsgBubble>
  );
};

export default ChatVideoMsg;