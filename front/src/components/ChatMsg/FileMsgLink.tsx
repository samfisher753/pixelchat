import { useState } from 'react';
import { toast } from 'sonner';
import { ChatMsgProps } from '@/components/ChatMsg/ChatMsg';

const LABELS: Record<string, string> = {
  image: 'Descargar imagen',
  video: 'Descargar vídeo',
  audio: 'Descargar audio',
};

// El archivo está en otro dominio (OCI), y ahí el navegador ignora el nombre del atributo download.
// Por eso se descarga al pulsar y se guarda con su nombre original desde una URL local.
const FileMsgLink = ({ msg }: ChatMsgProps) => {

  const [downloading, setDownloading] = useState(false);
  const label: string = LABELS[msg.type!.split('/')[0]] ?? 'Descargar archivo';

  const download = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(msg.data!);
      if (!response.ok) throw new Error(String(response.status));
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = msg.filename ?? 'archivo';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error('No se ha podido descargar el archivo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <a href={msg.data} onClick={download} className='text-linkBlue cursor-pointer'>
      {downloading ? 'Descargando…' : label}
    </a>
  );

};

export default FileMsgLink;
