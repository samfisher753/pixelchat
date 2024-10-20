import Grid from '@/game/Grid'
import Player from '@/game/Player'
import Assets from '@/game/Assets'

export default class Room {

    constructor(room) {
        this.name = room.name || 'New Room';
        this.size = room.size || 10;
        this.array = room.array || [];
        this.spawn = room.spawn || {x:0, y:0};
        this.spawnDirection = room.spawnDirection || 4;
        this.players = room.players || {};
        this.client = room.client || false;
    }

    // Client side. Re-create/update Player objects.
    update(room) {
        let players = {};
        for (let p in room.players){
            let q;
            if (typeof this.players[p] === 'undefined') {
                q = new Player(room.players[p]);
                
                if (typeof Assets.avatars[q.name] === 'undefined'){
                    Assets.loadAvatarImages(q.name, false, q);
                    q.images = Assets.avatars['defaultAvatar'];
                }
                else {
                    q.images = Assets.avatars[q.name];
                }
            }
            else {
                q = this.players[p];
            }
            q.client = true;
            q.update(room.players[p], this);
            q.room = this.name;
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
            this.players[p].room = this.name;
    }

    cell(x, y){
        let c = this.array[y][x];
        if (c!==null) c.pos = {x: x, y: y};
        return c;
    }

    join(player) {
        this.players[player.id] = player;
        player.room = this.name;
        player.pos = this.spawn;
        player.changeAnim(this.spawnDirection, 'stand');
        // Add to this.array.players
        let tile = this.array[this.spawn.y][this.spawn.x];
        tile.players.push(player.id);
        this.array[this.spawn.y][this.spawn.x] = tile;
    }

    leave(playerId) {
        // Delete from this.array.players
        let p = this.players[playerId];
        let tile = this.array[p.pos.y][p.pos.x];
        let i = tile.players.indexOf(playerId);
        tile.players.splice(i, 1);
        this.array[p.pos.y][p.pos.x] = tile;
        this.players[playerId].reset();
        delete this.players[playerId];
    }

    clear() {
        for(let playerId in this.players){
            this.leave(playerId);
        }
    }

    updatePlayerCell(a, b, id) {
        let cell = this.array[a.y][a.x];
        let i = cell.players.indexOf(id);
        cell.players.splice(i, 1);
        cell = this.array[b.y][b.x];
        cell.players.push(id);
    }

    updateLogic(){
        for (let p in this.players)
            this.players[p].updateLogic(this);
    }

    draw(ctx, maskCtx, mouseCell) {
        // Draw room
        let drawO = Grid.drawOrdered;
        for (let tile of drawO){
            let cell = this.array[tile.y][tile.x];
            if (cell !== null){
                let drawPos = Grid.drawPos[tile.y][tile.x];
                let img = Assets.getImage(cell.material);
                ctx.drawImage(img, parseInt(drawPos.x), parseInt(drawPos.y));
            }
        }

        // Draw mouse tile
        if (mouseCell !== null && this.array[mouseCell.y][mouseCell.x] !== null){
            let drawPos = Grid.drawPos[mouseCell.y][mouseCell.x];
            let mouseTileImg = Assets.getImage('mouse-tile');
            ctx.drawImage(mouseTileImg, parseInt(drawPos.x), parseInt(drawPos.y-3));
        }
        
        // Draw players of the room
        let playerIds = Object.keys(this.players);
        for (let tile of drawO){
            let cell = this.array[tile.y][tile.x];
            if (cell !== null && cell.players.length > 0){
                let drawPos = Grid.drawPos[tile.y][tile.x];
                for (let player of cell.players){
                    let maskNum = playerIds.indexOf(player);
                    this.players[player].draw(ctx, drawPos, maskCtx, maskNum);
                }
            }
        }
    }

}
