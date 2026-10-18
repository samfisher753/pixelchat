import FileMsgLink from '@/components/ChatMsg/FileMsgLink';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';
import MsgBubble from '@/components/ChatMsg/MsgBubble';

const ChatVideoMsg = ({ msg }: ChatMsgProps) => {

  return (
    <MsgBubble msg={msg}>
      <div>
        {msg.type === "video/mp4" &&
          <video className='block max-h-[150px] max-w-full'
            controls
            src={msg.data} />
        }
        <FileMsgLink msg={msg} />
      </div>
    </MsgBubble>
  );
};

export default ChatVideoMsg;