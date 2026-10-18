import { useEffect, useRef } from "react";
import { assets } from "@/models/others/Assets";
import { DEFAULT_AVATAR } from "@/constants/constants";

// Zona del sprite (64×112) donde está la cabeza entera, con gorros y peinados incluidos. Se usa el
// sprite de pie mirando abajo a la izquierda (índice 6 de stand, dirección 4 de Habbo). En esa
// diagonal la esquina delantera de la cabeza (la barbilla) baja hasta la fila 52.
const CROP_X = 12;
const CROP_Y = 12;
const CROP_SIZE = 40;
// Se muestra a la mitad para que quepa en una línea de texto sin cambiar la altura del bocadillo.
// El canvas guarda el recorte a tamaño real y el navegador lo reduce, que en pantallas con más
// densidad de píxeles se ve más nítido.
const DISPLAY_SIZE = CROP_SIZE / 2;

// Cara del personaje en miniatura, recortada de su sprite, para los bocadillos del chat
const PlayerFace = ({ look }: { look: string | undefined }) => {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const own = look ? assets.avatars[look] : undefined;
    const images = own?.loaded ? own : assets.avatars[DEFAULT_AVATAR];
    const sprite = images?.stand?.[6]?.[0] as CanvasImageSource | undefined;
    if (!ctx || !sprite) return;
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.drawImage(sprite, CROP_X, CROP_Y, CROP_SIZE, CROP_SIZE, 0, 0, CROP_SIZE, CROP_SIZE);
  }, [look]);

  return (
    <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE} aria-hidden="true"
      className="shrink-0 block" style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }} />
  );
};

export default PlayerFace;
