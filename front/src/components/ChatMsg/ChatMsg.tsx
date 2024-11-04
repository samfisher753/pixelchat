import { Msg } from '@/types/Msg';
import ChatTextMsg from '@/components/ChatMsg/ChatTextMsg';
import ChatInfoMsg from '@/components/ChatMsg/ChatInfoMsg';
import ChatImageMsg from '@/components/ChatMsg/ChatImageMsg';
import ChatVideoMsg from '@/components/ChatMsg/ChatVideoMsg';
import ChatAudioMsg from '@/components/ChatMsg/ChatAudioMsg';
import { forwardRef } from 'react';
import clsx from 'clsx';

export type ChatMsgProps = {
  msg: Msg;
  mode?: "overlay" | "panel";
};

const ChatMsg = forwardRef<HTMLDivElement, ChatMsgProps>(({msg, mode = "panel" }: ChatMsgProps, ref) => {

  const type: string = msg.type!.split('/')[0];

  return (
    <div className={clsx("pointer-events-auto",
      {
        "fixed max-w-[345px]": mode === "overlay",
        "relative": mode === "panel",
      })} 
      ref={ref}
      style={
        mode === "overlay" ? 
        // Pos modified also with refs in OverlayChat
        {
          left: msg.left + 'px',
          top: msg.top + 'px'
        }
        : 
        {}
      }>
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

});

export default ChatMsg;