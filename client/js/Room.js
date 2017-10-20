class Room {

    constructor(room) {
        this.name = room.name || 'New Room';
        this.size = room.size || 10;
        this.array = room.array || [];
        this.spawn = room.spawn || {x:0, y:0};
        this.spawnDirection = room.spawnDirection || 4;
        this.players = room.players || {};
    }

    update(room) {
        let players = {};
        for (let p in room.players){
            let q;
            if (typeof this.players[p] === 'undefined') {
                q = new Player(room.players[p]);
            }
            else {
                q = this.players[p];
            }
            q.update(room.players[p]);
            q.setRoom(this);
            players[p] = q;
        }
        this.players = players;

        this.name = room.name;
        this.size = room.size;
        this.array = room.array;
        this.spawn = room.spawn;
    }

    setPlayersRoom() {
        for (let p in this.players)
            this.players[p].setRoom(this);
    }

    cell(x, y){
        return this.array[y][x];
    }

    cellAt(x, y){
        let c = Grid.cellAt(x,y);
        if (c === null) return c;
        let cp = this.array[c.y][c.x];
        if (cp !== null) cp.pos = c;
        return cp;
    }

    setName(name) {
        this.name = name;
    }

    setSize(size) {
        this.size = size;
    }

    setSpawn(x, y) {
        this.spawn = {x: x,y: y};
    }

    join(player) {
        this.players[player.getName()] = player;
        player.setRoom(this.name);
        player.setPos(this.spawn);
        player.setStatus('stand');
        player.setDirection(this.spawnDirection);
        // Add to this.array.players
        let tile = this.array[this.spawn.y][this.spawn.x];
        tile.players.push(player.getName());
        this.array[this.spawn.y][this.spawn.x] = tile;
    }

    leave(playerName) {
        // Delete from this.array.players
        let p = this.players[playerName];
        let tile = this.array[p.getPos().y][p.getPos().x];
        let i = tile.players.indexOf(playerName);
        tile.players.splice(i, 1);
        this.array[p.getPos().y][p.getPos().x] = tile;
        this.players[playerName].reset();
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

    getSize() {
        return this.size;
    }

    getSpawn() {
        return this.spawn;
    }

    getPlayer(name) {
        return this.players[name];
    }
    
    getPlayers() {
        return this.players;
    }

    updatePlayerCell(a, b, name) {
        let cell = this.array[a.y][a.x];
        let i = cell.players.indexOf(name);
        cell.players.splice(i, 1);
        cell = this.array[b.y][b.x];
        cell.players.push(name);
    }

    updateLogic(mouse, localPlayer){
        for (let p in this.players)
            mouse = this.players[p].updateLogic(mouse, localPlayer);
        return mouse;
    }

    draw(ctx) {
        // Draw room
        let drawO = Grid.getDrawOrdered();
        for (let tile of drawO){
            let cell = this.array[tile.y][tile.x];
            if (cell !== null){
                let img = Assets.getImage(cell.material);
                ctx.drawImage(img, tile.drawPos.x, tile.drawPos.y);
            }
        }
        
        // Draw players of the room
        for (let tile of drawO){
            let cell = this.array[tile.y][tile.x];
            if (cell !== null && cell.players.length > 0){
                for (let player of cell.players){
                    this.players[player].draw(ctx, tile.drawPos);
                }
            }
        }
    }

}

if (typeof module !== 'undefined') {
    module.exports = Room;
}