import FileMsgLink from '@/components/ChatMsg/FileMsgLink';
import ImageViewer from '@/components/ImageViewer';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';

const ChatImageMsg = ({ msg }: ChatMsgProps) => {

  return (
    <div className="relative max-w-full break-words rounded-md bg-white m-0 text-sm p-[2px_8px] border border-black inline-block text-black">
      <span className="font-bold mr-[5px]">{msg.player!.name}:</span>
      <div>
        <ImageViewer src={msg.data!} />
        <FileMsgLink msg={msg} />
      </div>
    </div>
  );
  
};

export default ChatImageMsg;