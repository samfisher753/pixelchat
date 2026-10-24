import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';

// Diálogo para encuadrar una imagen antes de subirla: se arrastra para moverla y se acerca o
// aleja con el control. Devuelve un JPEG del tamaño indicado con la zona que se ve en el marco.

const MAX_ZOOM = 3;

interface ImageCropDialogProps {
  file: File;
  title: string;
  outputWidth: number;
  outputHeight: number;
  // Vista previa redonda (foto de perfil); el recorte sigue siendo cuadrado
  round?: boolean;
  onCancel: () => void;
  onConfirm: (image: Blob) => void;
}

const ImageCropDialog = ({ file, title, outputWidth, outputHeight, round = false, onCancel, onConfirm }: ImageCropDialogProps) => {

  const aspect = outputWidth / outputHeight;
  // Tamaño del marco en pantalla
  const frameWidth = aspect > 1 ? 600 : 280;
  const frameHeight = Math.round(frameWidth / aspect);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setFailed(true);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  // Escala para que la imagen cubra el marco entero con zoom 1
  const baseScale = image ? Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const shownWidth = image ? image.naturalWidth * scale : 0;
  const shownHeight = image ? image.naturalHeight * scale : 0;

  // La imagen siempre tiene que cubrir el marco: no se puede mover más allá de sus bordes
  const clamp = (o: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(frameWidth - shownWidth, o.x)),
    y: Math.min(0, Math.max(frameHeight - shownHeight, o.y)),
  });

  // Al cargar, centrada
  useEffect(() => {
    if (!image) return;
    const s = Math.max(frameWidth / image.naturalWidth, frameHeight / image.naturalHeight);
    setOffset({ x: (frameWidth - image.naturalWidth * s) / 2, y: (frameHeight - image.naturalHeight * s) / 2 });
    setZoom(1);
  }, [image, frameWidth, frameHeight]);

  // Al cambiar el zoom, se mantiene el centro del marco
  const changeZoom = (next: number) => {
    if (!image) return;
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    const cx = frameWidth / 2, cy = frameHeight / 2;
    const ratio = z / zoom;
    const nextWidth = image.naturalWidth * baseScale * z, nextHeight = image.naturalHeight * baseScale * z;
    const o = { x: cx - (cx - offset.x) * ratio, y: cy - (cy - offset.y) * ratio };
    setOffset({
      x: Math.min(0, Math.max(frameWidth - nextWidth, o.x)),
      y: Math.min(0, Math.max(frameHeight - nextHeight, o.y)),
    });
    setZoom(z);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setOffset(clamp({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y }));
  };
  const onPointerUp = () => { drag.current = null; };

  const confirm = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    const k = outputWidth / frameWidth;
    ctx.drawImage(image, offset.x * k, offset.y * k, shownWidth * k, shownHeight * k);
    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.88);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="max-w-full bg-[#2C2C2C] rounded-3xl border border-[#383838] shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h2 id="crop-title" className="text-lg font-bold text-white">{title}</h2>
          <p className="text-sm text-neutral-400 mt-1">Arrastra la imagen para encuadrarla y usa el control para acercarla.</p>
        </div>

        <div className="px-6 flex justify-center">
          {failed ? (
            <div className="flex items-center justify-center text-sm text-red-400 bg-[#1E1E1E] rounded-xl" style={{ width: frameWidth, height: frameHeight }}>
              No se ha podido abrir la imagen.
            </div>
          ) : (
            <div
              className="relative overflow-hidden bg-[#1E1E1E] rounded-xl cursor-grab active:cursor-grabbing touch-none select-none max-w-full"
              style={{ width: frameWidth, height: frameHeight }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            >
              {image && (
                <img src={image.src} alt="" draggable={false} className="absolute max-w-none pointer-events-none"
                  style={{ left: offset.x, top: offset.y, width: shownWidth, height: shownHeight }} />
              )}
              {round && (
                // Oscurece lo que queda fuera del círculo: así se ve como quedará la foto de perfil
                <div className="absolute inset-0 pointer-events-none rounded-full" style={{ boxShadow: '0 0 0 999px rgba(0,0,0,0.55)' }} />
              )}
            </div>
          )}
        </div>

        <div className="px-6 pt-4 flex items-center gap-3">
          <button type="button" onClick={() => changeZoom(zoom - 0.25)} aria-label="Alejar" className="text-neutral-400 hover:text-white">
            <ZoomOut className="w-4 h-4" />
          </button>
          <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} aria-label="Zoom"
            onChange={e => changeZoom(Number(e.target.value))} className="flex-1 accent-[#4b8df8]" disabled={!image} />
          <button type="button" onClick={() => changeZoom(zoom + 0.25)} aria-label="Acercar" className="text-neutral-400 hover:text-white">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 mt-2 border-t border-[#383838] flex justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-[#383838] hover:bg-[#444444] text-white rounded-full font-bold transition-colors border border-[#444444]">
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button type="button" onClick={confirm} disabled={!image}
            className="flex items-center gap-2 px-5 py-2 bg-[#022F72] hover:bg-blue-800 text-white rounded-full font-bold transition-colors disabled:opacity-50">
            <Check className="w-4 h-4" />
            Usar imagen
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ImageCropDialog;
