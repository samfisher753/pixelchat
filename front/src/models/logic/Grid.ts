import { Pos } from "@/types/Pos";

class Grid {

    size: number;
    originX: number;
    originY: number;
    tileW: number;
    tileL: number;
    dx: number;
    dy: number;
    drawOrdered: Pos[];
    drawPos: Pos[][];

    constructor() {
        this.size = 40;
        this.originX = 0;
        this.originY = 0;
        this.tileW = 64;
        this.tileL = 40;
        this.dx = 32;
        this.dy = 16;
        this.drawOrdered = [];
        this.drawPos = [];
    }
    

    setOrigin(x: number, y: number): void {
        this.originX = x - this.dx;
        this.originY = y;
    }

    center(w: number, h: number): void {
        const d: number = 2*this.size - 1;
        const gh: number = d*this.dy;
        this.originX = w/2 - this.dx;
        this.originY = (h-gh)/2;
    }

    move(d: Pos): void {
        this.originX += d.x;
        this.originY += d.y;
    }

    cellAt(x: number, y: number): Pos | null {
        for(let cell of this.drawOrdered){
            const drawPos: Pos = this.drawPos[cell.y][cell.x];
            const qx: number = drawPos.x + this.dx;
            const qy: number = drawPos.y + this.dy;
            const px: number = x - qx;
            const py: number = y - qy;
            const r: number = (Math.abs(px)/this.dx) + (Math.abs(py)/this.dy);
            if (r <= 1) return cell;
        }
        return null;
    }

    createDrawOrder(): void {
        // Holy fucking awesome loop of the galaxy
        this.drawOrdered = [];
        this.drawPos = [];

        for (let i=0; i<this.size; ++i){
            this.drawPos.push([]);
            for (let j=0; j<this.size; ++j)
                this.drawPos[i].push({x: 0, y: 0});
        }

        const x0: number = this.originX;
        const y0: number = this.originY;
        
        let drawX: number;
        let drawY: number = y0;
        let i: number;
        let j: number;

        for (let n=0; n<(2*this.size)-1; ++n){
            // Upper half
            if (n < this.size){
                i = 0;
                j = this.size-1-n;
                drawX = x0 - n*this.dx;
            }
            // Lower half
            else {
                i = n-this.size+1;
                j = 0;
                drawX = x0 - (2*this.size-n-2)*this.dx;
            }

            while (i < this.size && j < this.size){
                const pos: Pos = {x: j, y: i};
                const drawPos: Pos = {x: drawX, y: drawY};
                this.drawOrdered.push(pos);
                this.drawPos[i][j] = drawPos;
                ++i;
                ++j;
                drawX += this.tileW;
            }

            drawY += this.dy;
        }

    }

}

export const grid = new Grid();