import { Pos } from "./Pos";

export type RoomCell = {
    pos: Pos;
    players: string[];
    material: string;
};