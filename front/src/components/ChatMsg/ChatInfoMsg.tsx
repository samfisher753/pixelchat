import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';

const ChatInfoMsg = ({ msg }: ChatMsgProps) => {

  return (
    <div className="relative max-w-full break-words rounded-md text-infoMessage mx-0 my-1 text-sm p-[2px_8px] block font-bold text-center">
      {msg.text}
    </div>
  );

};

export default ChatInfoMsg;