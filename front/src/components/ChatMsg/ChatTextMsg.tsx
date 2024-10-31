import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';

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
    <div className="relative max-w-full break-words rounded-md bg-white m-0 text-sm p-[2px_8px] border border-black inline-block text-black">
      <span className="font-bold mr-[5px]">{msg.player!.name}:</span>
      <span>{parseTextWithLinks(msg.text!)}</span>
    </div>
  );
};

export default ChatTextMsg;