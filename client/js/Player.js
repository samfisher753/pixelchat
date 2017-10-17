class Player {

    constructor(player){
        this.name = player.name;
        this.room = player.room || null;
        this.pos = player.pos || null;

        this.adjustY = -69;
        this.character = 'sam';
        this.status = 'out';
        this.direction = player.direction || -1;
        this.animFrame = 0;
        this.images = [];
        this.walkd = {x:0, y:0};

        // Move
        this.target = player.target || null;
        this.nextPos = player.nextPos || null;

        // Client only
        this.socket = null;

    }

    update(player) {
        if (this.direction !== player.direction
            || this.status !== player.status) {
            this.setDirAndStatus(player.direction, player.status);
        }

        this.pos = player.pos;
        this.target = player.target;
        this.nextPos = player.nextPos;
    }

    setRoom(room) {
        this.room = room;
    }

    setPos(pos) {
        this.pos = pos;
    }
    
    setSocket(socket) {
        this.socket = socket;
    }

    setDirection(dir) {
        this.direction = dir;
    }

    setStatus(status) {
        this.status = status;
    }

    setDirAndStatus(dir, status) {
        this.direction = dir;
        this.status = status;
        this.animFrame = 0;
        this.fetchImages();
    }

    getName() {
        return this.name;
    }

    getRoom() {
        return this.room;
    }

    getPos() {
        return this.pos;
    }

    getStatus() {
        return this.status;
    }

    getDirection() {
        return this.direction;
    }

    fetchImages() {
        let name = this.character+this.direction+this.status;
        this.images = Assets.getImgArray(name);
    }

    getPosDirection(a, b) {
        let u = {x: a.x-b.x, y: a.y-b.y};
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
            this.fetchImages();
            this.socket.emit('change direction', d);
        }
    }

    move(tgt, room) {
        // if (room.cell(tgt.x,tgt.y).players.length > 0) return;

        let X = Grid.X;                 
        let Y = Grid.Y;

        // BFS 
        let ini = this.pos;
        let n = room.getSize();
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
                direction: d
            };
            
            this.socket.emit('move', player);
        }

    }

    updateLogic(room) {
        let w = 64;
        let h = 32;

        if (this.status === 'walk'){
            let r = Math.abs(this.walkd.x/w) + Math.abs(this.walkd.y/h);
            // If arrived to next cell
            if (r > 1) {
                this.walkd.x = 0;
                this.walkd.y = 0;
                let c = room.cell(this.pos.x, this.pos.y);
                let i = c.players.indexOf(this.name);
                c.players.splice(i, 1);
                this.pos = this.nextPos;
                c = room.cell(this.pos.x, this.pos.y);
                c.players.push(this.name);
                
                // If next cell is the target
                if (this.nextPos.x === this.target.x 
                    && this.nextPos.y === this.target.y){
                    this.target = null;
                    this.nextPos = null;
                    this.setDirAndStatus(this.direction,'stand');
                    if (this.name === game.playerName)
                        this.socket.emit('end-move');
                }
                else {
                    if (this.name === game.playerName)
                        this.move(this.target, room);
                }
            }
            // If still at same cell
            else {
                let X = [ -2,  0,  2, 1, 2, 0, -2, -1 ];               
                let Y = [ -1, -1, -1, 0, 1, 1,  1,  0 ];

                let dirV = [ 0.5, 2, 0.5, 2, 0.5, 2, 0.5, 2 ];

                this.walkd.x += dirV[this.direction]*X[this.direction];
                this.walkd.y += dirV[this.direction]*Y[this.direction];
            }
        }
    }

    draw(ctx, drawPos) {
        switch(this.status){
            case 'stand':
                this.drawStand(ctx, drawPos); 
                break;
            case 'walk':
                this.drawWalk(ctx, drawPos);
                break;
        }
    }

    drawStand(ctx, drawPos) {
        let shadow = Assets.getImage('shadow');
        ctx.drawImage(shadow, drawPos.x, drawPos.y-6);
        if (this.images.length === 1){
            ctx.drawImage(this.images[0], drawPos.x, drawPos.y+this.adjustY);
        }
        else {
            if (this.animFrame < 240) ctx.drawImage(this.images[0], drawPos.x, drawPos.y+this.adjustY);
            else ctx.drawImage(this.images[1], drawPos.x, drawPos.y+this.adjustY);
            ++this.animFrame;
            if (this.animFrame === 246) this.animFrame = 0;
        }
    }

    drawWalk(ctx, drawPos) {
        let shadow = Assets.getImage('shadow');
        ctx.drawImage(shadow, drawPos.x+this.walkd.x, drawPos.y-6+this.walkd.y);
        let framesPerImg = 6;
        let img = this.images[parseInt(this.animFrame/framesPerImg)];
        ctx.drawImage(img, drawPos.x+this.walkd.x, drawPos.y+this.adjustY+this.walkd.y);
        ++this.animFrame;
        if (this.animFrame === this.images.length*framesPerImg){
            this.animFrame = 0;
        }
    }

}

if (typeof module !== 'undefined') {
    module.exports = Player;
}