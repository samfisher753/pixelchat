import { dataURItoBlob } from '@/utils/Utils';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';

const FileMsgLink = ({ msg }: ChatMsgProps) => {

  const text: string = 'Download ' + msg.type!.split('/')[0] + ' file';
  const blob: Blob = dataURItoBlob(msg);
  const url: string = URL.createObjectURL(blob);

  return (
    <a href={url} download={msg.filename} target="_blank"
      className='text-linkBlue'>
      {text}
    </a>
  );

};

export default FileMsgLink;