import { PlayerStatus } from "../enums/PlayerStatus";
import { PlayerAnimations, PlayerMovementProps } from "../types/PlayerAnimations";
import { Pos } from "../types/Pos";
import { RoomCell } from "../types/RoomCell";
import Room from "../models/Room";

const VELOCITY: number = 1.3;
const FRAMES_PER_IMG_WALK: number = 6;
const X: number[] = [  0,  1, 1, 1, 0, -1, -1, -1 ];
const Y: number[] = [ -1, -1, 0, 1, 1,  1,  0, -1 ];

export default class Player {

    name: string;
    id: string;
    room?: string | null;
    pos?: Pos | null;
    status?: PlayerStatus;
    direction?: number;
    animFrame?: number;
    walkd?: Pos;
    images?: PlayerAnimations | null;
    target?: Pos | null;
    nextPos?: Pos | null;
    click?: Pos | null;

    constructor(player: any) {
        this.name = player.name;
        this.id = player.id;
        this.room = player.room || null;
        this.pos = player.pos || null;

        this.status = PlayerStatus.None;
        this.direction = player.direction || -1;
        this.animFrame = -1;
        this.walkd = {x:0, y:0};
        this.images = null;

        this.target = player.target || null;
        this.nextPos = player.nextPos || null

        this.click = null;
    }

    update(player: PlayerMovementProps, room: Room): void {

        if (this.direction !== player.direction
            || this.status !== player.status) {
            this.changeAnim(player.direction, player.status);
        }

        if (room !== null && this.pos !== null && 
            (this.pos!.x !== player.pos!.x || this.pos!.y !== player.pos!.y)){
            room.updatePlayerCell(this.pos!, player.pos, this.id);
            this.walkd = {x:0, y:0};
        }

        this.pos = player.pos;
        this.target = player.target;
        this.nextPos = player.nextPos;
    }

    reset(): void {
        this.room = null;
        this.pos = null;
        this.status = PlayerStatus.None;
        this.direction = -1;
        this.animFrame = -1;
        this.walkd = {x:0, y:0};
        this.images = null;
        this.target = null;
        this.nextPos = null;
        this.click = null;
    }

    changeAnim(dir: number, status: PlayerStatus): void {
        this.direction = dir;
        this.status = status;
        this.animFrame = -1;
        this.walkd = {x:0, y:0};
    }

    getPosDirection(a: Pos, b: Pos): number {
        const u: Pos = {x: a.x-b.x, y: a.y-b.y};
        if (u.x === 0 && u.y === 0) return this.direction!;
        if (u.x === 0 && u.y > 0) return 0;
        if (u.x < 0 && u.y > 0) return 1;
        if (u.x < 0 && u.y === 0) return 2;
        if (u.x < 0 && u.y < 0) return 3;
        if (u.x === 0 && u.y < 0) return 4;
        if (u.x > 0 && u.y < 0) return 5;
        if (u.x > 0 && u.y === 0) return 6;
        return 7;
    } 

    changeDirection(tgt: Pos): void {
        if (this.status === PlayerStatus.Stand){
            this.direction = this.getPosDirection(this.pos!, tgt);
        }
    }

    move(tgt: Pos, room: Room): void {
        
        // BFS 
        const ini = this.pos!;
        const n = room.size;
        const posBefore: Pos[][] = [];
        for (let i=0; i<n; ++i){
            posBefore.push([]);
            for (let j=0; j<n; ++j) 
                posBefore[i].push({x: -1, y: -1});
        }
        posBefore[ini.y][ini.x] = {x: tgt.x, y: tgt.y};

        const nextPos = [ ini ];
        while (nextPos.length > 0){
            const p: Pos = nextPos[0];
            nextPos.splice(0, 1);
            if (p.x === tgt.x && p.y === tgt.y) break;
            const j: number = this.getPosDirection(p, tgt);
            for (let i=0; i<8; ++i){
                const k: number = (j+i)%8;
                const q: Pos = {x: p.x+X[k], y: p.y+Y[k]};
                // If not a valid pos
                if (q.x<0 || q.x>=n || q.y<0 || q.y>=n) continue;
                // If pos already visited
                if (posBefore[q.y][q.x].x >= 0) continue;
                // If void/out/dark/unused cell
                const c: RoomCell = room.cell(q.x,q.y);
                if (c === null) continue;
                // If cell not empty
                if (c.players.length > 0) continue;
                // If valid pos
                posBefore[q.y][q.x] = p;
                nextPos.push(q);
            }
        }

        if (posBefore[tgt.y][tgt.x].x !== -1){
            let b: Pos = posBefore[tgt.y][tgt.x];
            let next: Pos = tgt;
            while (b.x !== ini.x || b.y !== ini.y){
                next = posBefore[next.y][next.x];
                b = posBefore[b.y][b.x];
            }

            const d: number = this.getPosDirection(ini,next);
            const playerMovementProps: PlayerMovementProps = {
                pos: this.pos!,
                target: tgt,
                nextPos: next,
                direction: d,
                status: PlayerStatus.Walk
            };

            this.update(playerMovementProps, room);
        }

    }

    stop(): void {
        this.target = null;
        this.nextPos = null;
        this.changeAnim(this.direction!, PlayerStatus.Stand);
    }

    sit(): void {
        if (this.direction!%2 !== 0) this.direction = (this.direction!+1)%8;
        this.changeAnim(this.direction!, PlayerStatus.Sit);
    }

    wave(): void {
        this.changeAnim(this.direction!, PlayerStatus.Wave);
    }

    updateLogic(room: Room): void {
        if (this.status === PlayerStatus.Walk){
            this.updateLogicWalk(room);
        }
        else {
            // Check mouse click
            if (this.click !== null) {
                const c: RoomCell = room.cell(this.click!.x, this.click!.y);
                // If there is a room cell there
                if (c !== null){
                    // If player on the cell, change direction
                    if (c.players.length > 0) {
                        this.changeDirection(c.pos);
                    }
                    // If not, move to cell
                    else {
                        this.move(c.pos, room);
                    }
                }
                this.click = null;
            }

            if (this.status === PlayerStatus.Stand || this.status === PlayerStatus.Sit){
                this.updateLogicStand();
            }
            // Wave
            else {
                this.updateLogicWave();
            }
        }
    }

    updateLogicWave(): void {
        ++this.animFrame!;
        if (this.animFrame === 250) this.changeAnim(this.direction!, PlayerStatus.Stand);
    }

    updateLogicStand(): void {
        ++this.animFrame!;
        if (this.animFrame === 246) this.animFrame = 0;
    }

    updateLogicWalk(room: Room): void {
        const w: number = 64;
        const h: number = 32;

        // Update pos offset
        const X: number[] = [ -2,  0,  2, 1, 2, 0, -2, -1 ];               
        const Y: number[] = [ -1, -1, -1, 0, 1, 1,  1,  0 ];

        const dirV: number[] = [ 0.5, 1, 0.5, 2, 0.5, 1, 0.5, 2 ];

        this.walkd!.x += dirV[this.direction!]*X[this.direction!]*VELOCITY;
        this.walkd!.y += dirV[this.direction!]*Y[this.direction!]*VELOCITY;

        const r: number = Math.abs(this.walkd!.x/w) + Math.abs(this.walkd!.y/h);
        // If arrived to next cell
        if (r > 1) {
            this.walkd!.x = 0;
            this.walkd!.y = 0;
            room.updatePlayerCell(this.pos!,this.nextPos!,this.id);
            this.pos = this.nextPos;

            let moved = false;
            // If player clicked somewhere
            if (this.click !== null) {
                const c: RoomCell = room.cell(this.click!.x, this.click!.y);
                // If it's a valid room cell without players
                if (c !== null && c.players.length === 0){
                    this.move(c.pos, room);
                    moved = true;
                }
                this.click = null;
            }

            // If invalid or unavailable pos clicked
            if (!moved) {
                // If next cell is the target or there is a player on the target cell
                if ((this.nextPos!.x === this.target!.x && this.nextPos!.y === this.target!.y)
                    || room.cell(this.target!.x,this.target!.y).players.length > 0) {
                    this.stop();
                }
                else {
                    this.move(this.target!, room);
                } 
            } 
        }

        // Update animFrame
        ++this.animFrame!;
        if (this.animFrame === 4*FRAMES_PER_IMG_WALK)
            this.animFrame = 0;
        
    }

}
