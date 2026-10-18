import FileMsgLink from '@/components/ChatMsg/FileMsgLink';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';
import MsgBubble from '@/components/ChatMsg/MsgBubble';

const ChatAudioMsg = ({ msg }: ChatMsgProps) => {

  return (
    <MsgBubble msg={msg}>
      <div>
        {(msg.type === 'audio/mpeg' || msg.type === 'audio/wav' ||
          msg.type === 'audio/mp3') &&
          <audio className='block max-h-[150px] max-w-full'
            controls
            src={msg.data} />
        }
        <FileMsgLink msg={msg} />
      </div>
    </MsgBubble>
  );
  
};

export default ChatAudioMsg;