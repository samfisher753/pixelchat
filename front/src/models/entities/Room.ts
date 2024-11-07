import { grid } from '@/models/logic/Grid'
import Player from '@/models/entities/Player'
import { assets } from '@/models/others/Assets'
import { RoomCell } from '@/types/RoomCell';
import { Pos } from '@/types/Pos';
import { PlayerCollection } from '@/types/PlayerCollection';
import { PlayerMovementProps } from '@/types/PlayerAnimations';
import { PlayerStatus } from '@/enums/PlayerStatus';
import { DEFAULT_AVATAR } from '@/constants/constants';

export default class Room {

    name: string;
    size: number;
    array: RoomCell[][];
    spawn: Pos;
    spawnDirection: number;
    players: PlayerCollection;


    constructor(room?: Room) {
        this.name = room?.name || 'New Room';
        this.size = room?.size || 10;
        this.array = room?.array || [];
        this.spawn = room?.spawn || {x:0, y:0};
        this.spawnDirection = room?.spawnDirection || 4;
        this.players = room?.players || {};
    }

    // Client side. Re-create/update Player objects.
    update(room: Room): void {
        const players: PlayerCollection = {};
        for (const p in room.players){
            let q: Player;
            if (typeof this.players[p] === 'undefined') {
                q = new Player(room.players[p]);
                
                if (typeof assets.avatars[q.name] === 'undefined'){
                    assets.loadAvatarImages(q.name, q);
                    q.images = assets.avatars[DEFAULT_AVATAR];
                }
                else {
                    q.images = assets.avatars[q.name];
                }
            }
            else {
                q = this.players[p];
            }
            const roomPlayer: Player = room.players[p];
            const playerMovementProps: PlayerMovementProps = {
                pos: roomPlayer.pos!,
                target: roomPlayer.target!,
                nextPos: roomPlayer.nextPos!,
                direction: roomPlayer.direction!,
                status: roomPlayer.status!
            };
            q.update(playerMovementProps, this);
            q.room = this.name;
            players[p] = q;
        }
        this.players = players;

        this.name = room.name;
        this.size = room.size;
        this.array = room.array;
        this.spawn = room.spawn;
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

    draw(ctx: CanvasRenderingContext2D, maskCtx: CanvasRenderingContext2D, mouseCell: Pos): void {
        // Draw room
        const drawO: Pos[] = grid.drawOrdered;
        for (const tile of drawO){
            const cell: RoomCell = this.array[tile.y][tile.x];
            if (cell !== null){
                const drawPos: Pos = grid.drawPos[tile.y][tile.x];
                const img: HTMLImageElement = assets.getImage(cell.material);
                ctx.drawImage(img, Math.floor(drawPos.x), Math.floor(drawPos.y));
            }
        }

        // Draw mouse tile
        if (mouseCell !== null && this.array[mouseCell.y][mouseCell.x] !== null){
            const drawPos: Pos = grid.drawPos[mouseCell.y][mouseCell.x];
            const mouseTileImg: HTMLImageElement = assets.getImage('mouse-tile');
            ctx.drawImage(mouseTileImg, Math.floor(drawPos.x), Math.floor(drawPos.y-3));
        }
        
        // Draw players of the room
        const playerIds: string[] = Object.keys(this.players);
        for (const tile of drawO){
            const cell: RoomCell = this.array[tile.y][tile.x];
            if (cell !== null && cell.players.length > 0){
                const drawPos: Pos = grid.drawPos[tile.y][tile.x];
                for (const player of cell.players){
                    const maskNum: number = playerIds.indexOf(player);
                    this.players[player].draw(ctx, drawPos, maskCtx, maskNum);
                }
            }
        }
    }

}
