import Player from "@/models/entities/Player";
import { Pos } from "@/types/Pos";

export type Msg = {
    type?: string;
    data?: string;
    filename?: string;
    player?: MsgPlayer;
    width?: number;
    height?: number;
    dy?: number;
    dx?: number;
    pos?: Pos;
    text?: string;
    loaded?: boolean;
    left?: number;
    top?: number;
    playerObject?: Player;
    // Ancho de la columna de la cara a la izquierda del bocadillo (el indicador no pasa de ahí)
    leftInset?: number;
    // Identificador fijo del bocadillo flotante, para que React no mezcle mensajes al borrar los antiguos
    overlayKey?: number;
    // Tamaño real del vídeo, para que el bocadillo aparezca ya con su tamaño final
    mediaWidth?: number;
    mediaHeight?: number;
};

export type MsgPlayer = {
    name: string;
    id: string;
    // Aspecto de quien escribe en el momento del mensaje (para pintar su cara y su color)
    look?: string;
};