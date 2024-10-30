import { Msg } from '@/types/Msg';
import ChatTextMsg from '@/components/ChatMsg/ChatTextMsg';
import ChatInfoMsg from '@/components/ChatMsg/ChatInfoMsg';
import ChatImageMsg from '@/components/ChatMsg/ChatImageMsg';
import ChatVideoMsg from '@/components/ChatMsg/ChatVideoMsg';
import ChatAudioMsg from '@/components/ChatMsg/ChatAudioMsg';

export type ChatMsgProps = {
  msg: Msg;
};

const ChatMsg = ({ msg }: ChatMsgProps) => {

  const type: string = msg.type!.split('/')[0];

  return (
    <div className="relative">
      { type === "text" &&
        <ChatTextMsg msg={msg} />
      }
      { type === "info" &&
        <ChatInfoMsg msg={msg} />
      }
      { type === "image" &&
        <ChatImageMsg msg={msg} />
      }
      { type === "video" &&
        <ChatVideoMsg msg={msg} />
      }
      { type === "audio" && 
        <ChatAudioMsg msg={msg} />
      }
    </div>
  );

};

export default ChatMsg;