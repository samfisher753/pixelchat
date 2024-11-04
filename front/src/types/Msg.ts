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
};

export type MsgPlayer = {
    name: string;
    id: string;
};