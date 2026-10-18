import FileMsgLink from '@/components/ChatMsg/FileMsgLink';
import ImageViewer from '@/components/ImageViewer';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';
import MsgBubble from '@/components/ChatMsg/MsgBubble';

const ChatImageMsg = ({ msg }: ChatMsgProps) => {

  return (
    <MsgBubble msg={msg}>
      <div>
        <ImageViewer src={msg.data!} />
        <FileMsgLink msg={msg} />
      </div>
    </MsgBubble>
  );
  
};

export default ChatImageMsg;