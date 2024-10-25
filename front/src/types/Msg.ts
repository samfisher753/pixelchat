import { Pos } from "@/types/Pos";

export type Msg = {
    type?: string;
    data?: string;
    filename?: string;
    player?: MsgPlayer;
    html?: HTMLDivElement;
    width?: number;
    height?: number;
    dy?: number;
    dx?: number;
    pos?: Pos;
    text?: string;
    playerRef?: HTMLImageElement;
};

type MsgPlayer = {
    name: string;
    id: string;
};