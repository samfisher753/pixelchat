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
        this.walkd = {x:0, y:0};
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
                direction: d,
                status: 'walk'
            };

            this.update(player);

            this.socket.emit('move', player);
        }

    }

    stop(localPlayer) {
        this.target = null;
        this.nextPos = null;
        this.setDirAndStatus(this.direction,'stand');
        if (this.name === localPlayer) this.socket.emit('end-move');
    }

    updateLogic(room, mouse, localPlayer) {
        let w = 64;
        let h = 32;

        if (this.status === 'walk'){
            // Update pos offset
            let X = [ -2,  0,  2, 1, 2, 0, -2, -1 ];               
            let Y = [ -1, -1, -1, 0, 1, 1,  1,  0 ];

            let dirV = [ 0.5, 1, 0.5, 2, 0.5, 1, 0.5, 2 ];

            this.walkd.x += dirV[this.direction]*X[this.direction];
            this.walkd.y += dirV[this.direction]*Y[this.direction];

            let r = Math.abs(this.walkd.x/w) + Math.abs(this.walkd.y/h);
            // If arrived to next cell
            if (r > 1) {
                this.walkd.x = 0;
                this.walkd.y = 0;
                room.updatePlayerCell(this.pos,this.nextPos,this.name);
                this.pos = this.nextPos;
                
                // If local player clicked somewhere
                if (mouse.cType === 'clicked' && this.name === localPlayer) {
                    let target = Grid.cellAt(mouse.clientX, mouse.clientY);
                    // If there is a grid cell there
                    if (target !== null){
                        let cell = room.cell(target.x,target.y);
                        // If it's a valid room cell without players
                        if (cell !== null && cell.players.length === 0){
                            this.move(target, room);
                            mouse.cType = 'checked';
                            return mouse;
                        }
                    }
                    mouse.cType = 'checked';
                }

                // If invalid or unavailable pos clicked
                // If next cell is the target or there is a player on the target cell
                if ((this.nextPos.x === this.target.x && this.nextPos.y === this.target.y)
                    || room.cell(this.target.x,this.target.y).players.length > 0) {
                    this.stop(localPlayer);
                }
                else {
                    if (this.name === localPlayer)
                        this.move(this.target, room);
                }   
            }
        }
        else if (this.status === 'stand'){
            if (mouse.cType === 'clicked' && this.name === localPlayer) {
                let target = Grid.cellAt(mouse.clientX, mouse.clientY);
                // If there is a grid cell there
                if (target !== null){
                    let cell = room.cell(target.x,target.y);
                    // If there is a room cell there
                    if (cell !== null){
                        // If player on the cell, change direction
                        if (cell.players.length > 0) {
                            this.changeDirection(target);
                        }
                        // If not, move to cell
                        else {
                            this.move(target, room);
                        }
                    }
                }
                mouse.cType = 'checked';
            }
        }

        return mouse;
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