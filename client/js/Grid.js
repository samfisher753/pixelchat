let Grid = {

    size: 40,
    originX: 0,
    originY: 0,
    tileW: 64,
    tileL: 40,
    dx: 32,
    dy: 16,
    drawOrdered: [],
    drawPos: [],

    setOrigin(x, y) {
        this.originX = x - this.dx;
        this.originY = y;
    },

    center(w, h) {
        let d = 2*this.size - 1;
        let gh = d*this.dy;
        this.originX = w/2 - this.dx;
        this.originY = (h-gh)/2;
    }, 

    move(d) {
        this.originX += d.x;
        this.originY += d.y;
    },

    cellAt(x, y) {
        for(let cell of this.drawOrdered){
            let drawPos = this.drawPos[cell.y][cell.x];
            let qx = drawPos.x + this.dx;
            let qy = drawPos.y + this.dy;
            let px = x - qx;
            let py = y - qy;
            let r = (Math.abs(px)/this.dx) + (Math.abs(py)/this.dy);
            if (r <= 1) return cell;
        }
        return null;
    },

    createDrawOrder() {
        // Holy fucking awesome loop of the galaxy
        this.drawOrdered = [];
        this.drawPos = [];

        for (let i=0; i<this.size; ++i){
            this.drawPos.push([]);
            for (let j=0; j<this.size; ++j)
                this.drawPos[i].push({});
        }

        let x0 = this.originX;
        let y0 = this.originY;
        
        let drawX;
        let drawY = y0;
        let i;
        let j;

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
                let pos = {x: j, y: i};
                let drawPos = {x: drawX, y: drawY};
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