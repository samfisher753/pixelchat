// My player "constants"
let params = {};
params.velocity = 1.3;
params.framesPerImgWalk = 6;
params.adjustY = -84;
params.adjustX = 0;
params.X = [  0,  1, 1, 1, 0, -1, -1, -1 ];               
params.Y = [ -1, -1, 0, 1, 1,  1,  0, -1 ];

class Player {

    constructor(player){
        this.name = player.name;
        this.id = player.id;
        this.room = player.room || null;
        this.pos = player.pos || null;

        this.status = 'out';
        this.direction = player.direction || -1;
        this.animFrame = -1;
        this.walkd = {x:0, y:0};
        this.images = [];
        this.client = player.client || false;

        this.target = player.target || null;
        this.nextPos = player.nextPos || null

        this.click = null;
    }

    update(player, room) {
        if (this.direction !== player.direction
            || this.status !== player.status) {
            this.changeAnim(player.direction, player.status);
        }

        if (room !== null && this.pos !== null && 
            (this.pos.x !== player.pos.x || this.pos.y !== player.pos.y)){
            room.updatePlayerCell(this.pos, player.pos, this.id);
            this.walkd = {x:0, y:0};
        }

        this.pos = player.pos;
        this.target = player.target;
        this.nextPos = player.nextPos;
    }

    reset() {
        this.room = null;
        this.pos = null;
        this.status = 'out';
        this.direction = -1;
        this.animFrame = -1;
        this.walkd = {x:0, y:0};
        this.images = [];
        this.target = null;
        this.nextPos = null;
        this.click = null;
    }

    changeAnim(dir, status) {
        this.direction = dir;
        this.status = status;
        this.animFrame = -1;
        this.walkd = {x:0, y:0};
    }

    getPosDirection(a, b) {
        let u = {x: a.x-b.x, y: a.y-b.y};
        if (u.x === 0 && u.y === 0) return this.direction;
        if (u.x === 0 && u.y > 0) return 0;
        if (u.x < 0 && u.y > 0) return 1;
        if (u.x < 0 && u.y === 0) return 2;
        if (u.x < 0 && u.y < 0) return 3;
        if (u.x === 0 && u.y < 0) return 4;
        if (u.x > 0 && u.y < 0) return 5;
        if (u.x > 0 && u.y === 0) return 6;
        return 7;
    } 

    changeDirection(tgt) {
        if (this.status === 'stand'){
            let d = this.getPosDirection(this.pos, tgt);
            this.direction = d;
        }
    }

    move(tgt, room) {
        
        let X = params.X;                 
        let Y = params.Y;

        // BFS 
        let ini = this.pos;
        let n = room.size;
        let posBefore = [];
        for (let i=0; i<n; ++i){
            posBefore.push([]);
            for (let j=0; j<n; ++j) 
                posBefore[i].push({x: -1, y: -1});
        }
        posBefore[ini.y][ini.x] = {x: tgt.x, y: tgt.y};

        let nextPos = [ ini ];
        while (nextPos.length > 0){
            let p = nextPos[0];
            nextPos.splice(0, 1);
            if (p.x === tgt.x && p.y === tgt.y) break;
            let j = this.getPosDirection(p, tgt);
            for (let i=0; i<8; ++i){
                let k = (j+i)%8;
                let q = {x: p.x+X[k], y: p.y+Y[k]};
                // If not a valid pos
                if (q.x<0 || q.x>=n || q.y<0 || q.y>=n) continue;
                // If pos already visited
                if (posBefore[q.y][q.x].x >= 0) continue;
                // If void/out/dark/unused cell
                let c = room.cell(q.x,q.y);
                if (c === null) continue;
                // If cell not empty
                if (c.players.length > 0) continue;
                // If valid pos
                posBefore[q.y][q.x] = p;
                nextPos.push(q);
            }
        }

        if (posBefore[tgt.y][tgt.x].x !== -1){
            let b = posBefore[tgt.y][tgt.x];
            let next = tgt;
            while (b.x !== ini.x || b.y !== ini.y){
                next = posBefore[next.y][next.x];
                b = posBefore[b.y][b.x];
            }

            let d = this.getPosDirection(ini,next);
            let player = {
                pos: this.pos,
                target: tgt,
                nextPos: next,
                direction: d,
                status: 'walk'
            };

            this.update(player, room);
        }

    }

    stop() {
        this.target = null;
        this.nextPos = null;
        this.changeAnim(this.direction,'stand');
    }

    sit() {
        if (this.direction%2 !== 0) this.direction = (this.direction+1)%8;
        this.changeAnim(this.direction, 'sit');
    }

    wave() {
        this.changeAnim(this.direction, 'wave');
    }

    updateLogic(room) {
        if (this.status === 'walk'){
            this.updateLogicWalk(room);
        }
        else {
            // Check mouse click
            if (this.click !== null) {
                let c = room.cell(this.click.x, this.click.y);
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

            if (this.status === 'stand' || this.status === 'sit'){
                this.updateLogicStand();
            }
            // Wave
            else {
                this.updateLogicWave();
            }
        }
    }

    updateLogicWave() {
        ++this.animFrame;
        if (this.animFrame === 250) this.changeAnim(this.direction,'stand');
    }

    updateLogicStand() {
        ++this.animFrame;
        if (this.animFrame === 246) this.animFrame = 0;
    }

    updateLogicWalk(room) {
        let w = 64;
        let h = 32;

        // Update pos offset
        let X = [ -2,  0,  2, 1, 2, 0, -2, -1 ];               
        let Y = [ -1, -1, -1, 0, 1, 1,  1,  0 ];

        let dirV = [ 0.5, 1, 0.5, 2, 0.5, 1, 0.5, 2 ];

        this.walkd.x += dirV[this.direction]*X[this.direction]*params.velocity;
        this.walkd.y += dirV[this.direction]*Y[this.direction]*params.velocity;

        let r = Math.abs(this.walkd.x/w) + Math.abs(this.walkd.y/h);
        // If arrived to next cell
        if (r > 1) {
            this.walkd.x = 0;
            this.walkd.y = 0;
            room.updatePlayerCell(this.pos,this.nextPos,this.id);
            this.pos = this.nextPos;

            let moved = false;
            // If player clicked somewhere
            if (this.click !== null) {
                let c = room.cell(this.click.x, this.click.y);
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
                if ((this.nextPos.x === this.target.x && this.nextPos.y === this.target.y)
                    || room.cell(this.target.x,this.target.y).players.length > 0) {
                    this.stop();
                }
                else {
                    this.move(this.target, room);
                } 
            } 
        }

        // Update animFrame
        ++this.animFrame;
        if (this.animFrame === 4*params.framesPerImgWalk)
            this.animFrame = 0;
        
    }

    draw(ctx, drawPos, maskCtx, maskNum) {
        switch(this.status){
            case 'stand':
                this.drawStand(ctx, drawPos, maskCtx, maskNum); 
                break;
            case 'walk':
                this.drawWalk(ctx, drawPos, maskCtx, maskNum);
                break;
            case 'sit':
                this.drawSit(ctx, drawPos, maskCtx, maskNum);
                break;
            case 'wave':
                this.drawWave(ctx, drawPos, maskCtx, maskNum);
                break;
        }
    }

    drawStand(ctx, drawPos, maskCtx, maskNum) {
        let images = this.images[this.status][this.direction];
        let shadow = Assets.getImage('shadow');
        ctx.drawImage(shadow, parseInt(drawPos.x), parseInt(drawPos.y-6));
        if (images.length === 1 || this.animFrame < 240){
            ctx.drawImage(images[0], parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY));
            this.drawMask(images[0], maskCtx, maskNum, parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY));
        }
        else {
            ctx.drawImage(images[1], parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY));
            this.drawMask(images[1], maskCtx, maskNum, parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY));
        }
    }

    drawSit(ctx, drawPos, maskCtx, maskNum) {
        let images = this.images[this.status][this.direction/2];
        let shadow = Assets.getImage('shadow');
        ctx.drawImage(shadow, parseInt(drawPos.x), parseInt(drawPos.y-6));
        if (images.length === 1 || this.animFrame < 240){
            ctx.drawImage(images[0], parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY+15));
            this.drawMask(images[0], maskCtx, maskNum, parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY+15));
        }
        else {
            ctx.drawImage(images[1], parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY+15));
            this.drawMask(images[1], maskCtx, maskNum, parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY+15));
        }
    }

    drawWalk(ctx, drawPos, maskCtx, maskNum) {
        let images = this.images[this.status][this.direction];
        let shadow = Assets.getImage('shadow');
        ctx.drawImage(shadow, parseInt(drawPos.x+this.walkd.x), parseInt(drawPos.y-6+this.walkd.y));
        let img = images[parseInt(this.animFrame/params.framesPerImgWalk)];
        ctx.drawImage(img, parseInt(drawPos.x+params.adjustX+this.walkd.x), parseInt(drawPos.y+params.adjustY+this.walkd.y));
        this.drawMask(img, maskCtx, maskNum, parseInt(drawPos.x+params.adjustX+this.walkd.x), parseInt(drawPos.y+params.adjustY+this.walkd.y));
    }

    drawWave(ctx, drawPos, maskCtx, maskNum) {
        let images = this.images[this.status][this.direction];
        let shadow = Assets.getImage('shadow');
        ctx.drawImage(shadow, parseInt(drawPos.x), parseInt(drawPos.y-6));
        let f = parseInt((this.animFrame%10) / 5);
        ctx.drawImage(images[f], parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY));
        this.drawMask(images[f], maskCtx, maskNum, parseInt(drawPos.x+params.adjustX), parseInt(drawPos.y+params.adjustY));
    }

    drawMask(img, maskCtx, maskNum, posX, posY) {
        let playerMask = this.createPlayerMask(img, maskNum);
        maskCtx.drawImage(playerMask, posX, posY);
    }

    createPlayerMask(img, maskNum){
        let auxCanvas = document.createElement('canvas');
        auxCanvas.width = img.width;
        auxCanvas.height = img.height;
        let auxCtx = auxCanvas.getContext('2d');
        auxCtx.fillStyle = "rgba(0,0,0,0)";
        auxCtx.fillRect(0, 0, auxCanvas.width, auxCanvas.height);
        auxCtx.drawImage(img, 0, 0);

        let id = auxCtx.getImageData(0, 0, auxCanvas.width, auxCanvas.height);
        for (let i=0; i<id.data.length; i+=4){
            if (id.data[i+3] === 255){
                id.data[i] = 0;
                id.data[i+1] = 0;
                id.data[i+2] = maskNum;
            }
        }
        auxCtx.putImageData(id, 0, 0);

        return auxCanvas;
    }

}

if (typeof module !== 'undefined') {
    module.exports = Player;
}
