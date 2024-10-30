import FileMsgLink from '@/components/ChatMsg/FileMsgLink';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';

const ChatVideoMsg = ({ msg }: ChatMsgProps) => {

  return (
    <div className="relative max-w-full break-words rounded-md bg-white m-0 text-sm p-[2px_8px] border border-black inline-block text-black">
      <span className="font-bold mr-[5px]">{msg.player!.name}:</span>
      <div>
        {msg.type === "video/mp4" &&
          <video className='block max-h-[150px] max-w-full'
            controls
            src={msg.data} />
        }
        <FileMsgLink msg={msg} />
      </div>
    </div>
  );
};

export default ChatVideoMsg;