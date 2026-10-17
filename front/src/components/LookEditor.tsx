import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, RotateCw, Shuffle, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useGame } from '@/contexts/GameContext';
import apiService, { ApiError } from '@/services/apiService';
import { getErrorMessage } from '@/i18n/errorMessages';
import type { AuthUser } from '@/types/AuthUser';
import type { PlayerAnimations } from '@/types/PlayerAnimations';
import { avatarRenderer } from '@/models/others/avatar/AvatarRenderer';
import {
  Look, parseLook, randomLook, serializeLook,
  SKIN_COLORS, HAIR_COLORS, CLOTH_COLORS,
} from '@/models/others/avatar/Look';

// ---------------------------------------------------------------------------
// Opciones del configurador
// ---------------------------------------------------------------------------

type Option<K extends keyof Look> = { key: K; items: [Look[K], string][] };

type Group = {
  title: string;
  options?: Option<keyof Look>[];
  colorKey?: keyof Look;
  colors?: string[];
};

const GROUPS: Group[] = [
  { title: 'Cara', options: [{ key: 'face', items: [['normal', 'Normal'], ['feliz', 'Feliz'], ['guino', 'Guiño'], ['sorpresa', 'Sorpresa'], ['triste', 'Triste'], ['enfadado', 'Enfadado']] }] },
  { title: 'Piel', colorKey: 'skin', colors: SKIN_COLORS },
  { title: 'Pelo', options: [{ key: 'hair', items: [['corto', 'Corto'], ['largo', 'Largo'], ['coleta', 'Coleta'], ['cresta', 'Cresta'], ['rapado', 'Rapado']] }], colorKey: 'hairColor', colors: HAIR_COLORS },
  { title: 'Gorro', options: [{ key: 'hat', items: [['no', 'Nada'], ['gorra', 'Gorra'], ['gorro', 'Gorro de lana']] }], colorKey: 'hatColor', colors: CLOTH_COLORS },
  { title: 'Camiseta', options: [{ key: 'sleeve', items: [['corta', 'Manga corta'], ['larga', 'Manga larga']] }, { key: 'pattern', items: [['liso', 'Lisa'], ['rayas', 'Rayas'], ['logo', 'Logo']] }], colorKey: 'shirt', colors: CLOTH_COLORS },
  { title: 'Pantalón', options: [{ key: 'legs', items: [['largo', 'Largo'], ['corto', 'Corto']] }], colorKey: 'pants', colors: CLOTH_COLORS },
  { title: 'Zapatillas', colorKey: 'shoes', colors: CLOTH_COLORS },
  { title: 'Accesorio', options: [{ key: 'acc', items: [['no', 'Nada'], ['mochila', 'Mochila'], ['bufanda', 'Bufanda']] }], colorKey: 'accColor', colors: CLOTH_COLORS },
];

const ANIMS = [['stand', 'De pie'], ['walk', 'Andar'], ['wave', 'Saludar']] as const;
type PreviewAnim = typeof ANIMS[number][0];

// Las animaciones guardan la dirección 6 de Habbo en el índice 0; el configurador gira en
// direcciones de Habbo (3 = de frente).
const dirIndex = (habboDir: number) => (habboDir + 2) % 8;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface LookEditorProps {
  // Primera vez: no se puede cancelar y empieza con un aspecto aleatorio
  firstTime?: boolean;
  onClose: () => void;
}

const LookEditor = ({ firstTime = false, onClose }: LookEditorProps) => {
  const auth = useAuth();
  const game = useGame();

  const [look, setLook] = useState<Look>(() => parseLook(auth.user?.look) ?? randomLook());
  const [anim, setAnim] = useState<PreviewAnim>('stand');
  const [dir, setDir] = useState(4);   // mirando abajo a la izquierda, en diagonal
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spritesRef = useRef<PlayerAnimations | null>(null);
  const viewRef = useRef({ anim, dir });

  useEffect(() => {
    viewRef.current = { anim, dir };
  }, [anim, dir]);

  // Regenera los sprites cuando cambia el aspecto (con una pequeña espera para no
  // generar en cada clic si se cambian varias cosas seguidas)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const sprites = await avatarRenderer.buildAnimations(look);
        if (!cancelled) spritesRef.current = sprites;
      } catch {
        if (!cancelled) setPreviewFailed(true);
      }
    }, 80);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [look]);

  // Bucle de animación de la vista previa
  useEffect(() => {
    let frameId = 0;
    const draw = (t: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      const sprites = spritesRef.current;
      if (ctx && sprites) {
        const { anim, dir } = viewRef.current;
        const frames = sprites[anim][dirIndex(dir)] as HTMLCanvasElement[];
        let f = 0;
        if (anim === 'walk') f = Math.floor(t / 125) % 4;
        else if (anim === 'wave') f = Math.floor(t / 220) % 2;
        else if (frames.length > 1 && t % 3200 < 160) f = 1;
        ctx.clearRect(0, 0, 64, 112);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let y = -5; y <= 5; y++) {
          const hw = Math.round(18 * Math.sqrt(1 - (y / 6) ** 2));
          ctx.fillRect(32 - hw, 100 + y, hw * 2, 1);
        }
        ctx.drawImage(frames[f], 0, 0);
      }
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (firstTime) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSaving) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [firstTime, isSaving, onClose]);

  const set = <K extends keyof Look>(key: K, value: Look[K]) => setLook(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const updated = await apiService.patch<AuthUser>('/users/me', { look: serializeLook(look) });
      auth.updateUser(updated);
      game?.updatePlayer(updated);
      toast.success('Aspecto guardado.');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? getErrorMessage(err.violations?.[0]?.code ?? err.code, 'look') : 'Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const chip = (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
      selected
        ? 'bg-[#022F72] border-[#022F72] text-white'
        : 'bg-[#1E1E1E] border-[#383838] text-neutral-300 hover:border-neutral-500'
    }`;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="look-editor-title">
      <div className="w-full max-w-3xl max-h-[92vh] bg-[#2C2C2C] rounded-3xl border border-[#383838] shadow-2xl flex flex-col overflow-hidden">

        <div className="px-6 pt-6 pb-4 border-b border-[#383838]">
          <h2 id="look-editor-title" className="text-xl font-bold text-white">
            {firstTime ? 'Elige tu aspecto' : 'Cambiar aspecto'}
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            {firstTime
              ? 'Así te verán los demás en las salas. Podrás cambiarlo cuando quieras desde tu perfil.'
              : 'Así te verán los demás en las salas.'}
          </p>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
          {/* Vista previa */}
          <div className="flex flex-col items-center gap-4 p-6 bg-[#1E1E1E] md:border-r border-[#383838]">
            <canvas
              ref={canvasRef}
              width={64}
              height={112}
              className="w-[192px] h-[336px] max-md:w-[128px] max-md:h-[224px]"
              style={{ imageRendering: 'pixelated' }}
              role="img"
              aria-label="Vista previa del avatar"
            />
            {previewFailed && (
              <p className="text-xs text-neutral-400 text-center max-w-[200px]">
                Tu navegador no puede mostrar la vista previa (necesita WebGL). Puedes elegir y guardar igualmente.
              </p>
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDir(d => (d + 7) % 8)} aria-label="Girar a la izquierda"
                className="p-2 rounded-full bg-[#383838] hover:bg-[#444444] text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setDir(d => (d + 1) % 8)} aria-label="Girar a la derecha"
                className="p-2 rounded-full bg-[#383838] hover:bg-[#444444] text-white transition-colors">
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Animación">
              {ANIMS.map(([value, label]) => (
                <button key={value} type="button" onClick={() => setAnim(value)} aria-pressed={anim === value} className={chip(anim === value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Opciones */}
          <div className="overflow-y-auto p-6 space-y-5">
            {GROUPS.map(group => (
              <div key={group.title} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{group.title}</h3>
                {group.options?.map(option => (
                  <div key={option.key} className="flex flex-wrap gap-1.5" role="group" aria-label={group.title}>
                    {option.items.map(([value, label]) => (
                      <button key={String(value)} type="button" onClick={() => set(option.key, value)}
                        aria-pressed={look[option.key] === value} className={chip(look[option.key] === value)}>
                        {label}
                      </button>
                    ))}
                  </div>
                ))}
                {group.colorKey && group.colors && (
                  <div className="flex flex-wrap gap-1.5">
                    {group.colors.map(color => {
                      const selected = look[group.colorKey!] === color;
                      return (
                        <button key={color} type="button" onClick={() => set(group.colorKey!, color)}
                          aria-label={`${group.title} ${color}`} aria-pressed={selected}
                          className={`w-7 h-7 rounded-md border border-black/30 transition-transform hover:scale-110 ${
                            selected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2C2C2C]' : ''
                          }`}
                          style={{ background: color }} />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="px-6 py-4 border-t border-[#383838] flex items-center justify-between gap-3">
          <button type="button" onClick={() => setLook(randomLook())} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#383838] hover:bg-[#444444] text-white rounded-full font-bold transition-colors border border-[#444444] disabled:opacity-50">
            <Shuffle className="w-4 h-4" />
            Aleatorio
          </button>
          <div className="flex items-center gap-2">
            {!firstTime && (
              <button type="button" onClick={onClose} disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#383838] hover:bg-[#444444] text-white rounded-full font-bold transition-colors border border-[#444444] disabled:opacity-50">
                <X className="w-4 h-4" />
                Cancelar
              </button>
            )}
            <button type="button" onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-[#022F72] hover:bg-blue-800 text-white rounded-full font-bold transition-colors disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar aspecto
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LookEditor;
