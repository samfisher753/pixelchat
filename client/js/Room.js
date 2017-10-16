class Room {

    constructor(room) {
        this.name = room.name;
        this.size = room.size;
        this.array = room.array;
        this.spawn = room.spawn || {x:0, y:0};
        this.players = room.players || {};
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

    getSize() {
        return this.size;
    }

    getSpawn() {
        return this.spawn;
    }
    
    getPlayers() {
        return this.players;
    }

    createPlayers() {
        for (let p in this.players){
            this.players[p] = new Player(this.players[p]);
        }
    }

    adaptGrid() {
        Grid.setSize(this.size);
        Grid.createDrawOrder();
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
            if (cell !== null && Array.isArray(cell.players) ){
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