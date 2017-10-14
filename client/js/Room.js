class Room {

    constructor(room) {
        this.name = room.name;
        this.width = room.width;
        this.length = room.length;
        this.spawn = room.spawn || [0, 0];
        this.players = room.players || {};
        this.initPos = room.initPos;
    }

    setName(name) {
        this.name = name;
    }

    setWidth(width) {
        this.width = width;
    }

    setLength(length) {
        this.length = length;
    }

    setSpawn(x, y) {
        this.spawn = [x, y];
    }

    join(player) {
        this.players[player.getName()] = player;
        player.setRoom(this.name);
        player.setPos(this.spawn);
    }

    leave(playerName) {
        this.players[playerName].setRoom(null);
        this.players[playerName].setPos(null);
        delete this.players[playerName];
    }

    clear() {
        for(let player in this.players){
            this.leave(player);
        }
    }

    getName() {
        return this.name;
    }

    getWidth() {
        return this.width;
    }

    getLength() {
        return this.length;
    }

    getSpawn() {
        return this.spawn;
    }
    
    getPlayers() {
        return this.players;
    }

    draw(ctx, d, tile) {
        let w = 65;
        let l = 39;
        // Horizontal increment. X axis.
        let xdx = 0;
        let xdy = 0;
        // Vertical increment. Y axis.
        let ydx = 32;
        let ydy = 16;
        // Coord
        this.initPos.x += d.x;
        this.initPos.y += d.y;
        let x0 = this.initPos.x;
        let y0 = this.initPos.y;

        for (let i=0; i<this.width; ++i){
            let x = x0 - i*ydx;
            let y = y0 + i*ydy;
            for(let j=0; j<=i; ++j){
                ctx.drawImage(tile, x, y, w, l);
                x += w;
            }
        }
        let nx = x0 - 8*ydx;
        let ny = y0 + 10*ydy;
        for (let i=0; i<this.width-1; ++i){
            let x = nx + i*ydx;
            let y = ny + i*ydy;
            for(let j=0; j<this.width-1-i; ++j){
                ctx.drawImage(tile, x, y, w, l);
                x += w;
            }
        }  
        
    }

}

if (typeof module !== 'undefined') {
    module.exports = Room;
}