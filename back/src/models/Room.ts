import Player from '../models/Player'
import { RoomCell } from '../types/RoomCell';
import { Pos } from '../types/Pos';
import { PlayerCollection } from '../types/PlayerCollection';
import { PlayerStatus } from '../enums/PlayerStatus';

export default class Room {

    name: string;
    size: number;
    array: RoomCell[][];
    spawn: Pos;
    spawnDirection: number;
    players: PlayerCollection;


    constructor(room?: any) {
        this.name = room?.name || 'New Room';
        this.size = room?.size || 10;
        this.array = room?.array || [];
        this.spawn = room?.spawn || {x:0, y:0};
        this.spawnDirection = room?.spawnDirection || 4;
        this.players = room?.players || {};
    }

    setPlayersRoom(): void {
        for (const p in this.players)
            this.players[p].room = this.name;
    }

    cell(x: number, y: number): RoomCell {
        const c: RoomCell = this.array[y][x];
        if (c!==null) c.pos = {x: x, y: y};
        return c;
    }

    join(player: Player): void {
        this.players[player.id] = player;
        player.room = this.name;
        player.pos = this.spawn;
        player.changeAnim(this.spawnDirection, PlayerStatus.Stand);
        // Add to this.array.players
        const tile: RoomCell = this.array[this.spawn.y][this.spawn.x];
        tile.players.push(player.id);
        this.array[this.spawn.y][this.spawn.x] = tile;
    }

    leave(playerId: string): void {
        // Delete from this.array.players
        const p: Player = this.players[playerId];
        const tile: RoomCell = this.array[p.pos!.y][p.pos!.x];
        const i: number = tile.players.indexOf(playerId);
        tile.players.splice(i, 1);
        this.players[playerId].reset();
        delete this.players[playerId];
    }

    clear(): void {
        for(const playerId in this.players){
            this.leave(playerId);
        }
    }

    updatePlayerCell(a: Pos, b: Pos, id: string): void {
        let cell: RoomCell = this.array[a.y][a.x];
        const i: number = cell.players.indexOf(id);
        cell.players.splice(i, 1);
        cell = this.array[b.y][b.x];
        cell.players.push(id);
    }

    updateLogic(): void{
        for (const p in this.players)
            this.players[p].updateLogic(this);
    }

}
