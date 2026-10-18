import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';
import MsgBubble from '@/components/ChatMsg/MsgBubble';

const ChatTextMsg = ({ msg }: ChatMsgProps) => {

  const parseTextWithLinks = (text: string): JSX.Element[] => {
    const reg = new RegExp('(https?:\/\/[^<>\\s]+)', 'gi');
    const elements: JSX.Element[] = [];
    let lastIndex: number = 0;
    let match: RegExpExecArray | null;

    while ((match = reg.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(<span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>);
      }
      elements.push(
        <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer">
          {match[0]}
        </a>
      );
      lastIndex = reg.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <MsgBubble msg={msg}>
      <span>{parseTextWithLinks(msg.text!)}</span>
    </MsgBubble>
  );
};

export default ChatTextMsg;