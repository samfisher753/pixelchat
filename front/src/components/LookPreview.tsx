import { useEffect, useRef, useState } from 'react';
import { Loader2, UserCircle } from 'lucide-react';
import { assets } from '@/models/others/Assets';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
  maxLength?: number;
}

const LookPreview = ({ value, onChange, inputClassName, maxLength }: Props) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [previewValue, setPreviewValue] = useState('');
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar el panel al clicar fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpiar la imagen al cerrar el panel
  useEffect(() => {
    if (!open) {
      if (imgRef.current && imageContainerRef.current?.contains(imgRef.current)) {
        imageContainerRef.current.removeChild(imgRef.current);
      }
      imgRef.current = null;
      setStatus('idle');
      setPreviewValue('');
    }
  }, [open]);

  const handlePreview = async () => {
    if (!value.trim()) return;
    setStatus('loading');
    setPreviewValue(value.trim());

    // Limpiar imagen anterior
    if (imgRef.current && imageContainerRef.current?.contains(imgRef.current)) {
      imageContainerRef.current.removeChild(imgRef.current);
      imgRef.current = null;
    }

    try {
      const img = await assets.getPreviewImage(value.trim());
      imgRef.current = img;
      imageContainerRef.current?.appendChild(img);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        maxLength={maxLength}
        placeholder="defaultAvatar"
        className={inputClassName}
      />

      {open && (
        <div className="absolute left-0 bottom-full mb-2 z-20 w-64 bg-[#2C2C2C] border border-[#383838] rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
          <p className="text-xs text-neutral-500 leading-snug">
            Introduce el nombre de tu avatar de{' '}
            <a
              href="https://www.habbo.es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4b8df8] hover:underline"
            >
              Habbo.es
            </a>{' '}
            y pulsa previsualizar.
          </p>

          <button
            type="button"
            disabled={!value.trim() || status === 'loading'}
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold text-white bg-[#022F72] hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</>
              : 'Previsualizar'}
          </button>

          {/* Área de previsualización */}
          <div className="flex flex-col items-center gap-2 min-h-[60px]">
            {status === 'idle' && (
              <div className="flex flex-col items-center gap-1 text-neutral-600">
                <UserCircle className="w-10 h-10" />
                <span className="text-xs">Sin previsualizar</span>
              </div>
            )}

            {status === 'error' && (
              <p className="text-xs text-red-400 text-center">
                No se encontró el avatar "<span className="font-medium">{previewValue}</span>".
              </p>
            )}

            {/* El img se inserta aquí directamente desde assets.getPreviewImage */}
            <div ref={imageContainerRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LookPreview;
