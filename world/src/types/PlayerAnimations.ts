import { PlayerStatus } from "../enums/PlayerStatus";
import { Pos } from "./Pos";

type AnimationFrames = HTMLImageElement[] | string[];

type EightDirections = [AnimationFrames, AnimationFrames, AnimationFrames, AnimationFrames, AnimationFrames, AnimationFrames, AnimationFrames, AnimationFrames];
type FourDirections = [AnimationFrames, AnimationFrames, AnimationFrames, AnimationFrames];

export type PlayerAnimations = {
    stand: EightDirections;
    walk: EightDirections;
    sit: FourDirections;
    wave: EightDirections;
};

export type PlayerMovementProps = {
    pos: Pos;
    target: Pos;
    nextPos: Pos;
    direction: number;
    status: PlayerStatus;
};

export type PlayerAnimationsCollection = {
    [key: string]: PlayerAnimations;
};