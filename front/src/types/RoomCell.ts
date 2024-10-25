import { Pos } from "@/types/Pos";

export type RoomCell = {
    pos: Pos;
    players: string[];
    material: string;
};