import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'
import Player from '@/models/entities/Player'
import { assets } from '@/models/others/Assets'
import Room from '@/models/entities/Room'
import { grid } from '@/models/logic/Grid'

import { gameEventEmitter } from '@/emitters/GameEventEmitter'
import { GameEvent } from '@/enums/GameEvent'
import { Pos } from '@/types/Pos'
import { Msg } from '@/types/Msg'
import { RoomListItem } from '@/types/RoomListItem'
import { wavRecorder } from '@/models/others/WavRecorder'
import { MAX_FILE_SIZE_BYTES } from '@/constants/constants'
import { appendBeforeExtension, timeString } from '@/utils/Utils'
import ociObjectStorageService from '@/services/ociObjectStorageService'
import { AuthUser } from '@/types/AuthUser'

export default class Game {

    player: Player | null;
    room: Room | null;

    delta: number;
    fps: number;
    timestep: number;
    lastFrameTimeMs: number;
    frame: number | null;

    socket: Socket | null;
    canvasCtx: CanvasRenderingContext2D | null;
    maskCanvasCtx: CanvasRenderingContext2D | null;
    d: Pos;
    initialPos: Pos;
    mouse: Pos | null;
    mousedown: boolean;
    disableClick: boolean;
    mouseCell: Pos | null;
    fpsSpan: HTMLSpanElement | undefined;
    playersSpan: HTMLSpanElement | undefined;
    xIni: number | undefined;
    defaultY?: number;
    allowedTypes: string[];
    filesToUpload: Map<string, File>;

    constructor() {
        // Vars
        this.player = null;
        this.room = null;

        // Game loop
        this.delta = 0;
        this.fps = 60;
        this.timestep = 1000 / this.fps;
        this.lastFrameTimeMs = 0;
        this.frame = null;

        // Misc
        this.socket = null;
        this.canvasCtx = null;
        this.maskCanvasCtx = null;
        this.d = { x: 0, y: 0 };
        this.initialPos = { x: 0, y: 0 };
        this.mouse = null;
        this.mousedown = false;
        this.disableClick = false;
        this.mouseCell = null;

        this.allowedTypes = [
            'image',
            'video',
            'audio',
        ];

        this.filesToUpload = new Map();

        this.setDragEvents();
    }

    connectSocket(): void {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(import.meta.env.VITE_WORLD_URL, {
            path: "/socket.io",
            reconnection: false,
            auth: { token }
        });

        this.socket.once('connect_error', (err) => {
            if (err.message === 'auth.token_expired') {
                gameEventEmitter.emit(GameEvent.TokenExpired);
            }
        });

        this.configureSocket();
    }

    updatePlayer(updated: AuthUser): void {
        this.player!.username = updated.username || '';
        this.player!.look = updated.look || '';
        this.player!.motto = updated.motto || '';
        assets.loadAvatarImages(this.player!.look, this.player);
        this.socket!.emit('update player', this.player!);
    }

    reset(): void {
        if (this.room !== null) this.leaveRoom();

        this.player = null;
        this.room = null;

        this.delta = 0;
        this.lastFrameTimeMs = 0;
        this.frame = null;

        this.canvasCtx = null;
        this.maskCanvasCtx = null;
        this.d = { x: 0, y: 0 };
        this.initialPos = { x: 0, y: 0 };
        this.mouse = null;
        this.mousedown = false;
        this.disableClick = false;
        this.mouseCell = null;

        this.allowedTypes = [
            'image',
            'video',
            'audio',
        ];

        this.filesToUpload = new Map();
    }

    logout(): void {
        this.socket!.disconnect();
        this.reset();
    }

    init(): void {
        let app = document.getElementById('app')!;
        this.defaultY = Math.floor(app.clientHeight / 3);
        this.connectSocket();
    }

    setDragEvents(): void {
        // Drag files / Prevent default drag action
        window.ondragover = (e) => {
            e.preventDefault();
        };

        window.ondragend = (e) => {
            e.preventDefault();
        };

        window.ondrop = (e) => {
            e.preventDefault();
            if (this.room !== null && e.dataTransfer) {
                // Just one file per drop to avoid spam
                const file: File = e.dataTransfer.files[0];
                this.checkFileAndRequestParUpload(file);
            }
        };
    }

    joinRoom(room: Room): void {
        gameEventEmitter.emit(GameEvent.RoomJoined);

        if (this.room === null) {
            this.createCanvas();
            this.bindEvents();
            this.frame = requestAnimationFrame(this.gameLoop.bind(this));
        }
        else {
            this.addInfoMsg('Saliste de ' + this.room.name);
        }

        this.mouseCell = null;
        this.room = new Room();
        this.room.update(room);
        this.player = this.room.players[this.player!.id];
        // Update Grid
        grid.size = this.room.size;
        grid.center(this.canvasCtx!.canvas.width, this.canvasCtx!.canvas.height);
        grid.createDrawOrder();

        this.addInfoMsg('Te uniste a ' + this.room.name);

        wavRecorder.init();
    }

    leaveRoom(): void {
        this.addInfoMsg('Saliste de ' + this.room!.name);
        this.room = null;
        gameEventEmitter.emit(GameEvent.RoomLeft);
        cancelAnimationFrame(this.frame!);
        this.frame = null;
        this.fpsSpan!.innerHTML = 'fps: 0';
        this.hidePlayerInfo();
        const app = document.getElementById('app')! as HTMLDivElement;
        const maskCanvas = document.getElementsByClassName('game-canvas')[0] as HTMLCanvasElement;
        const canvas = document.getElementsByClassName('game-canvas')[1] as HTMLCanvasElement;
        app.removeChild(maskCanvas);
        app.removeChild(canvas);
        wavRecorder.close();
    }

    gameLoop(timeStamp: number): void {
        const t: number = timeStamp - this.lastFrameTimeMs;
        this.delta += t;
        this.lastFrameTimeMs = timeStamp;

        if (this.delta >= this.timestep) {
            let i = 0;
            while (this.delta >= this.timestep) {
                this.update(i === 0);
                this.delta -= this.timestep;
                ++i;
            }
        }

        const fps: number = 1000 / t;
        this.fpsSpan!.innerHTML = 'fps: ' + Math.floor(fps);
        this.draw();

        this.frame = requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(updateOverlayChat: boolean): void {
        if (this.room !== null) {
            this.room.updateLogic();
            if (updateOverlayChat) {
                gameEventEmitter.emit(GameEvent.UpdateOverlayChat);
            }
        }

        this.d = { x: 0, y: 0 };

        // If canvas has been dragged
        if (this.mouse !== null) {
            this.d.x += this.mouse.x - this.initialPos.x;
            this.d.y += this.mouse.y - this.initialPos.y;
            grid.move(this.d);
            grid.createDrawOrder();
            this.initialPos.x = this.mouse.x;
            this.initialPos.y = this.mouse.y;
            this.mouse = null;
        }
    }

    draw(): void {
        const ctx = this.canvasCtx!;
        const maskCtx = this.maskCanvasCtx!;

        // Draw background
        ctx.fillStyle = '#010101';
        ctx.fillRect(0, 0,
            ctx.canvas.width, ctx.canvas.height);
        maskCtx.fillStyle = '#ffffff';
        maskCtx.fillRect(0, 0,
            maskCtx.canvas.width, maskCtx.canvas.height);

        // Draw room
        if (this.room !== null) {
            this.room.draw(ctx, maskCtx, this.mouseCell!);
            gameEventEmitter.emit(GameEvent.DrawOverlayChat);
        }
    }

    bindEvents(): void {
        const maskCanvas = document.getElementsByClassName('game-canvas')[0] as HTMLCanvasElement;
        const canvas = document.getElementsByClassName('game-canvas')[1] as HTMLCanvasElement;
        const body = document.getElementsByTagName('body')[0] as HTMLBodyElement;
        const canvasSize = canvas.getBoundingClientRect();
           
        body.onresize = () => {
            if (this.room !== null) {
                // Resize Mask Canvas
                maskCanvas.height = maskCanvas.clientHeight;
                maskCanvas.width = maskCanvas.clientWidth;
                // Resize canvas
                canvas.height = canvas.clientHeight;
                canvas.width = canvas.clientWidth;
                // Update Grid
                grid.center(canvas.width, canvas.height);
                grid.createDrawOrder();
                // Update defaultY used by OverlayChat
                this.defaultY = Math.floor(canvas.height / 3);
            }
        };

        canvas.onmousedown = (e) => {
            const x = e.clientX - canvasSize.left;
            const y = e.clientY - canvasSize.top;
            this.mousedown = true;
            this.initialPos.x = x;
            this.initialPos.y = y;
        };

        document.onmousemove = (e) => {
            if (this.room !== null) {
                if (this.mousedown) {
                    // Prevent from selecting text while dragging
                    //window.getSelection().removeAllRanges();
                    const x = e.clientX - canvasSize.left;
                    const y = e.clientY - canvasSize.top;
                    this.mouse = { x, y };
                    // Disable click event after dragging
                    this.disableClick = true;
                }
            }
        };

        document.onmouseup = () => {
            if (this.room !== null) {
                this.mousedown = false;
            }
        };

        canvas.onclick = (e) => {
            if (!this.disableClick) {
                const x = e.clientX - canvasSize.left;
                const y = e.clientY - canvasSize.top;
                // Check player
                const p: Player | null = this.playerAt(x, y);
                if (p !== null) {
                    this.socket!.emit('click', p.pos);
                    this.showPlayerInfo(p);
                }
                // Check cell
                else {
                    const c: Pos | null = grid.cellAt(x, y);
                    if (c !== null) {
                        this.socket!.emit('click', c);
                        this.hidePlayerInfo();
                    }
                }
            }
            this.disableClick = false;
        };

        canvas.onmousemove = (e) => {
            const x = e.clientX - canvasSize.left;
            const y = e.clientY - canvasSize.top;
            this.mouseCell = grid.cellAt(x, y);
        }

    }

    playerAt(x: number, y: number): Player | null {
        const mask: CanvasRenderingContext2D = this.maskCanvasCtx!;
        const pixel: ImageData = mask.getImageData(x, y, 1, 1);
        if (pixel.data[0] === 0) {
            const index: number = pixel.data[2];
            const playerNames: string[] = Object.keys(this.room!.players);
            const player: Player = this.room!.players[playerNames[index]];
            return player;
        }
        return null;
    }

    createCanvas(): void {
        const app = document.getElementById('app')! as HTMLDivElement;

        // Mask Canvas
        const maskCanvas = document.createElement('canvas');
        maskCanvas.className = 'game-canvas';
        this.maskCanvasCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        app.appendChild(maskCanvas);
        maskCanvas.height = maskCanvas.clientHeight;
        maskCanvas.width = maskCanvas.clientWidth;

        //Game Canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'game-canvas';
        this.canvasCtx = canvas.getContext('2d');
        app.appendChild(canvas);
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;
    }

    configureSocket(): void {

        this.socket!.on('connected', async (player: Player) => {
            this.player = new Player(player);
            gameEventEmitter.emit(GameEvent.Loading, true);
            await assets.load();
            gameEventEmitter.emit(GameEvent.Loading, false);
            assets.loadAvatarImages(this.player.look, this.player);
            gameEventEmitter.emit(GameEvent.SocketReady);
        });

        // Event: Receive chat message
        this.socket!.on('chat message', (msg: Msg) => {
            this.addMsg(msg);
        });

        this.socket!.on('par upload', async (data: any) => {
            const fileName: string = data.fileName;
            const uploadUrl: string = data.url;
            const file: File = this.filesToUpload.get(fileName)!;
            await ociObjectStorageService.putFile(uploadUrl, file);
            this.filesToUpload.delete(fileName);
            this.socket!.emit('par download', fileName);
        });

        this.socket!.on('par download', async (data: any) => {   
            const fileName: string = data.fileName;
            const downloadUrl: string = data.url;
            const file: File = await ociObjectStorageService.getFile(downloadUrl, fileName);
            const sender = data.player;
            const dataUrl: string = await this.readFileAsDataUrl(file);
            let msg: Msg = { type: file.type, data: dataUrl, filename: file.name };
            msg.player = sender;
            this.addMsg(msg);
        })

        // Event: Receive number of players
        this.socket!.on('online players', (numPlayers: number) => {
            this.playersSpan!.innerHTML = 'online: ' + numPlayers;
        });

        // Event: Receive rooms list
        this.socket!.on('rooms list', (rooms: RoomListItem[]) => {
            gameEventEmitter.emit(GameEvent.UpdateRoomsList, rooms);
        });

        // Event: Receive room info
        this.socket!.on('room info', (room: Room) => {
            // If join room or change room
            if (this.room === null || room.name !== this.room.name) this.joinRoom(room);
            // If still in the same room
            else this.room.update(room);
        });

        // Successfully left a room
        this.socket!.on('left room', () => {
            this.leaveRoom();
        });

        this.socket!.on('player join', (name: string) => {
            this.addInfoMsg(name + ' se ha unido a la sala');
        });

        this.socket!.on('player left', (name: string) => {
            this.addInfoMsg(name + ' abandonó la sala');
        });

        this.socket!.on('disconnect', (reason) => {
            if (reason === "io server disconnect") {
                toast.error('Desconectado. Te has conectado desde otro lugar.', {
                    duration: Infinity,
                    closeButton: true,
                });
            } else if (reason !== 'io client disconnect') {
                toast.error('Se ha perdido la conexión con el servidor.', {
                    duration: Infinity,
                    closeButton: true,
                });
            }
        });
    }

    showPlayerInfo(player: Player): void {
        gameEventEmitter.emit(GameEvent.ShowPlayerInfo, player);
    }

    hidePlayerInfo(): void {
        gameEventEmitter.emit(GameEvent.HidePlayerInfo);
    }

    sendJoinRoom(roomName: string): void {
        this.socket!.emit('join room', roomName);
    }

    requestRoomsList(): void {
        this.socket!.emit('rooms list');
    }

    createInfoSpans(): void {
        const app = document.getElementById('app')! as HTMLDivElement;
        app.innerHTML = '';

        this.fpsSpan = document.createElement('span');
        this.fpsSpan.className = 'game-infoSpan';
        this.fpsSpan.innerHTML = 'fps: 0';
        app.appendChild(this.fpsSpan);

        this.playersSpan = document.createElement('span');
        this.playersSpan.className = 'game-infoSpan';
        this.playersSpan.style.top = this.fpsSpan.clientHeight + 'px';
        this.playersSpan.innerHTML = 'online: 0';
        app.appendChild(this.playersSpan);
    }

    sendLeaveRoom(): void {
        this.socket!.emit('leave room');
    }

    allowedFile(file: File): boolean {
        if (file.size > MAX_FILE_SIZE_BYTES) return false;

        for (let i = 0; i < this.allowedTypes.length; ++i)
            if (file.type.split('/')[0] === this.allowedTypes[i])
                return true;

        return false;
    }

    checkFileAndRequestParUpload(file: File) {
        if (this.allowedFile(file))
            this.requestParUpload(file);
    }

    requestParUpload(file: File) {
        const fileName: string = appendBeforeExtension(file.name, "-"+timeString());
        this.filesToUpload.set(fileName, file);
        this.socket!.emit('par upload', fileName);
    }

    readFileAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve) => {
            let fr = new FileReader();
            fr.onload = (e) => {
                let data = e.target!.result as string;
                resolve(data);
            };
            fr.readAsDataURL(file);
        });
    }

    addMsg(msg: Msg): void {
        gameEventEmitter.emit(GameEvent.AddMessage, msg);
    }

    addInfoMsg(text: string): void {
        const msg: Msg = { type: "info", text: text };
        this.addMsg(msg);
    }

    sendMsg(msgText: string): void {
        const msg: Msg = { type: 'text', text: msgText };
        this.socket!.emit('chat message', msg);
        msg.player = {
            name: this.player!.username,
            id: this.player!.id
        };
        this.addMsg(msg);
    }

    sendVoiceNote(file: any): void {
        file.name = 'PixelChat-' + this.player!.username + '.wav';
        this.requestParUpload(file);
    }

}