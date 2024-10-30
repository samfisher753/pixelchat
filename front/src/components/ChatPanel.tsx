import { useState, useRef, useEffect } from 'react';
import ChatMsg from '@/components/ChatMsg/ChatMsg';
import clsx from 'clsx';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { GameEvent } from '@/enums/GameEvent';
import { Msg } from '@/types/Msg';

const ChatPanel = ({ show }: {
  show: boolean;
}) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const initialWidth: number = 447;
  const [isExpanded, setIsExpanded] = useState(true);
  const [transitionActive, setTransitionActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const handleAddMessage = (msg: Msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    };
  
    const handleMouseMove = (e: MouseEvent) => {
      if (panelRef.current && panelRef.current.dataset.resizing === 'true' &&
        containerRef.current
      ) {
        const containerWidth: number = containerRef.current.getBoundingClientRect().width;
        if (e.clientX >= 150 && e.clientX <= containerWidth - 25) {
          panelRef.current.style.width = `${e.clientX}px`;
        }
      }
    };
  
    const handleMouseUp = () => {
      if (panelRef.current) {
        panelRef.current.dataset.resizing = 'false';
      }
    };

    gameEventEmitter.on(GameEvent.AddMessage, handleAddMessage);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      gameEventEmitter.off(GameEvent.AddMessage, handleAddMessage);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo(0, messagesContainerRef.current.scrollHeight);
    }
  }, [messages]);

  useEffect(() => {
    if (!show) {
      setTransitionActive(false);
    }
  }, [show]);

  const handleMouseDown = () => {
    setTransitionActive(false);
    if (panelRef.current) {
      panelRef.current.dataset.resizing = 'true';
    }
  };

  const toggleVisibility = () => {
    setTransitionActive(true);
    setIsExpanded(!isExpanded);
  };

  return (
    <div ref={containerRef} className={clsx("absolute w-full h-full pointer-events-none",
      {"invisible": !show})}>
      <div
        ref={panelRef}
        className={clsx("relative top-0 left-0 h-full bg-chatPanel pointer-events-auto", 
          {
            "transition-all duration-500": transitionActive,
            "transform -translate-x-full": !isExpanded,
            "transform translate-x-0": isExpanded
          })}
        style={{ width: `${initialWidth}px` }}
      >
        <div ref={messagesContainerRef} className="relative w-full h-full overflow-y-auto py-2 px-3">
          {messages.map((msg, index) => (
            <ChatMsg msg={msg} key={index} />
          ))}
        </div>
        <div
          className={clsx("absolute top-0 bottom-0 right-[-5px] w-[10px] cursor-ew-resize",
            {"pointer-events-none": !isExpanded})}
          onMouseDown={handleMouseDown}
        ></div>
        <button
          className="absolute top-[4px] right-[-15px] text-[11px] h-[63px] w-[15px] bg-hideChatButtonDarkGrey border-0 p-0 text-hideChatButtonLightGrey select-none rounded-tr rounded-br font-bold opacity-80"
          onClick={toggleVisibility}
        >
          {isExpanded ? '<' : '>'}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;