import { useEffect, useRef, useState } from 'react';
import { avatarRenderer } from '@/models/others/avatar/AvatarRenderer';
import { DEFAULT_LOOK, parseLook } from '@/models/others/avatar/Look';

// Tamaño del sprite y fila donde apoyan los pies
const SPRITE_W = 64;
const SPRITE_H = 112;
const FOOT_Y = 100;

// Personaje de cuerpo entero, de pie y mirando abajo a la izquierda, con su sombra.
// Se dibuja una vez a tamaño real y se amplía sin suavizar para que se vean los píxeles.
// Solo se muestran las filas ocupadas (el sprite deja hueco arriba para gorros y peinados altos),
// así queda centrado en su sitio sea cual sea el aspecto.
const AvatarFigure = ({ look, scale = 2, className = '' }: { look: string | null | undefined; scale?: number; className?: string }) => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  // Primera y última fila con algo dibujado
  const [rows, setRows] = useState({ top: 0, bottom: SPRITE_H - 1 });

  useEffect(() => {
    let cancelled = false;
    avatarRenderer.renderSprite(parseLook(look) ?? DEFAULT_LOOK, 'stand', 0, 4)
      .then(sprite => {
        const ctx = canvasRef.current?.getContext('2d');
        if (cancelled || !ctx) return;
        ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let y = -5; y <= 5; y++) {
          const hw = Math.round(18 * Math.sqrt(1 - (y / 6) ** 2));
          ctx.fillRect(SPRITE_W / 2 - hw, FOOT_Y + y, hw * 2, 1);
        }
        ctx.drawImage(sprite, 0, 0);
        const alpha = ctx.getImageData(0, 0, SPRITE_W, SPRITE_H).data;
        const used = (y: number) => {
          for (let x = 0; x < SPRITE_W; x++) if (alpha[(y * SPRITE_W + x) * 4 + 3] > 0) return true;
          return false;
        };
        let top = 0, bottom = SPRITE_H - 1;
        while (top < bottom && !used(top)) top++;
        while (bottom > top && !used(bottom)) bottom--;
        setRows({ top, bottom });
      })
      // Sin WebGL no se puede generar el personaje: simplemente no se muestra
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [look]);

  if (failed) return null;

  // El canvas es el sprite entero; el contenedor recorta las filas vacías. Las medidas van en
  // unidades del sprite (em) para que className pueda cambiar la escala con el tamaño de letra.
  return (
    <div className={`overflow-hidden ${className}`}
      style={{ fontSize: scale, width: SPRITE_W + 'em', height: (rows.bottom - rows.top + 1) + 'em' }}>
      <canvas ref={canvasRef} width={SPRITE_W} height={SPRITE_H} role="img" aria-label="Personaje"
        className="block"
        style={{ width: SPRITE_W + 'em', height: SPRITE_H + 'em', marginTop: -rows.top + 'em', imageRendering: 'pixelated' }} />
    </div>
  );
};

export default AvatarFigure;
