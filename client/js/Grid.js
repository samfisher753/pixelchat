let Grid = {

    size: 40,
    originX: 0,
    originY: 0,
    tileW: 65,
    tileL: 39,
    dx: 32,
    dy: 16,
    drawOrdered: [],

    setSize(size) {
        this.size = size;
    },

    setOrigin(x, y){
        this.originX = x - this.dx;
        this.originY = y;
    },

    move(d) {
        this.originX += d.x;
        this.originY += d.y;
    },

    getDrawOrdered() {
        return this.drawOrdered;
    },

    createDrawOrder() {
        // Holy fucking awesome loop of the galaxy
        this.drawOrdered = [];

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
                let pos = {x: j, y: i, drawPos: {x: drawX, y: drawY}};
                this.drawOrdered.push(pos);
                ++i;
                ++j;
                drawX += this.tileW;
            }

            drawY += this.dy;
        }

    }

}