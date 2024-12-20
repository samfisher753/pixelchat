import { io, Socket } from 'socket.io-client'
import Player from '@/models/entities/Player'
import { assets } from '@/models/others/Assets'
import Room from '@/models/entities/Room'
import { grid } from '@/models/logic/Grid'

import { gameEventEmitter } from '@/emitters/GameEventEmitter'
import { GameEvent } from '@/enums/GameEvent'
import { Pos } from '@/types/Pos'
import { CheckNameResponse } from '@/types/CheckNameResponse'
import { Msg } from '@/types/Msg'
import { RoomListItem } from '@/types/RoomListItem'
import { wavRecorder } from '@/models/others/WavRecorder'
import { MAX_FILE_SIZE_BYTES } from '@/constants/constants'
import { appendBeforeExtension, timeString } from '@/utils/Utils'
import ociObjectStorageService from '@/services/ociObjectStorageService'

export default class Game {

    player: Player | null;
    room: Room | null;

    delta: number;
    fps: number;
    timestep: number;
    lastFrameTimeMs: number;
    frame: number | null;

    socket: Socket;
    canvasCtx: CanvasRenderingContext2D | null;
    maskCanvasCtx: CanvasRenderingContext2D | null;
    d: Pos;
    initialPos: Pos;
    mouse: MouseEvent | null;
    mousedown: boolean;
    disableClick: boolean;
    mouseCell: Pos | null;
    fpsSpan: HTMLSpanElement | undefined;
    playersSpan: HTMLSpanElement | undefined;
    xIni: number | undefined;
    roomsWindowOpen: boolean;
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
        this.socket = io(import.meta.env.VITE_SOCKETIO_BACKEND, {
            reconnection: false
        });
        this.canvasCtx = null;
        this.maskCanvasCtx = null;
        this.d = { x: 0, y: 0 };
        this.initialPos = { x: 0, y: 0 };
        this.mouse = null;
        this.mousedown = false;
        this.disableClick = false;
        this.mouseCell = null;

        this.roomsWindowOpen = false;
        let app = document.getElementById('app')!;
        this.defaultY = Math.floor(app.clientHeight / 3);

        this.allowedTypes = [
            'image',
            'video',
            'audio',
        ];

        this.filesToUpload = new Map();

        this.configureSocket();
        this.setDragEvents();
        gameEventEmitter.emit(GameEvent.StartUi);
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
            const app = document.getElementById('app')! as HTMLDivElement;
            app.style.backgroundImage = 'none';
            app.style.backgroundColor = '#010101';

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
        app.style.backgroundImage = 'url("/assets/misc/background.jpg")';
        app.style.backgroundColor = '#2e2e2c';
    }

    startGame(): void {
        wavRecorder.init();
    }

    gameLoop(timeStamp: number): void {
        const t: number = timeStamp - this.lastFrameTimeMs;
        this.delta += t;
        this.lastFrameTimeMs = timeStamp;

        if (this.delta >= this.timestep) {
            const fps: number = 1000 / t;
            this.fpsSpan!.innerHTML = 'fps: ' + Math.floor(fps);
            let i = 0;
            while (this.delta >= this.timestep) {
                this.update(i === 0);
                this.delta -= this.timestep;
                ++i;
            }
            this.draw();
        }

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
            this.d.x += this.mouse.clientX - this.initialPos.x;
            this.d.y += this.mouse.clientY - this.initialPos.y;
            grid.move(this.d);
            grid.createDrawOrder();
            this.initialPos.x = this.mouse.clientX;
            this.initialPos.y = this.mouse.clientY;
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
            this.mousedown = true;
            this.initialPos.x = e.clientX;
            this.initialPos.y = e.clientY;
        };

        document.onmousemove = (e) => {
            if (this.room !== null) {
                if (this.mousedown) {
                    // Prevent from selecting text while dragging
                    //window.getSelection().removeAllRanges();
                    this.mouse = e;
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
                // Check player
                const p: Player | null = this.playerAt(e.clientX, e.clientY);
                if (p !== null) {
                    this.socket.emit('click', p.pos);
                    this.showPlayerInfo(p);
                }
                // Check cell
                else {
                    const c: Pos | null = grid.cellAt(e.clientX, e.clientY);
                    if (c !== null) {
                        this.socket.emit('click', c);
                        this.hidePlayerInfo();
                    }
                }
            }
            this.disableClick = false;
        };

        canvas.onmousemove = (e) => {
            this.mouseCell = grid.cellAt(e.clientX, e.clientY);
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
        // Check player name
        this.socket.on('check name', async (b: CheckNameResponse) => {
            if (b.res) {
                this.player = new Player({ name: b.name, id: this.socket.id! } as Player);
                gameEventEmitter.emit(GameEvent.PlayerLoggedIn);
                const app = document.getElementById('app')! as HTMLDivElement;
                app.innerHTML = '';
                this.createInfoSpans();
                assets.load(this.player);
                // Send player name
                this.socket.emit('new player', this.player.name);
                this.startGame();
            }
            else {
                gameEventEmitter.emit(GameEvent.ErrorOnPlayerLogin, b.errno)
            }
        });

        // Event: Receive chat message
        this.socket.on('chat message', (msg: Msg) => {
            this.addMsg(msg);
        });

        this.socket.on('par upload', async (data: any) => {
            const fileName: string = data.fileName;
            const uploadUrl: string = data.url;
            const file: File = this.filesToUpload.get(fileName)!;
            await ociObjectStorageService.putFile(uploadUrl, file);
            this.filesToUpload.delete(fileName);
            this.socket.emit('par download', fileName);
        });

        this.socket.on('par download', async (data: any) => {   
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
        this.socket.on('online players', (numPlayers: number) => {
            this.playersSpan!.innerHTML = 'online: ' + numPlayers;
        });

        // Event: Receive rooms list
        this.socket.on('rooms list', (rooms: RoomListItem[]) => {
            gameEventEmitter.emit(GameEvent.UpdateRoomsList, rooms);
        });

        // Event: Receive room info
        this.socket.on('room info', (room: Room) => {
            // If join room or change room
            if (this.room === null || room.name !== this.room.name) this.joinRoom(room);
            // If still in the same room
            else this.room.update(room);
        });

        // Successfully left a room
        this.socket.on('left room', () => {
            this.leaveRoom();
        });

        this.socket.on('player join', (name: string) => {
            this.addInfoMsg(name + ' se ha unido a la sala');
        });

        this.socket.on('player left', (name: string) => {
            this.addInfoMsg(name + ' abandonó la sala');
        });

        this.socket.on('disconnect', () => {
            alert('Desconectado del servidor.');
        });
    }

    showPlayerInfo(player: Player): void {
        gameEventEmitter.emit(GameEvent.ShowPlayerInfo, player);
    }

    hidePlayerInfo(): void {
        gameEventEmitter.emit(GameEvent.HidePlayerInfo);
    }

    sendJoinRoom(roomName: string): void {
        this.socket.emit('join room', roomName);
    }

    toggleRoomsListWindow(): void {
        this.roomsWindowOpen = !this.roomsWindowOpen;
        gameEventEmitter.emit(GameEvent.ToggleRoomsListWindow, this.roomsWindowOpen);
    }

    requestRoomsList(): void {
        this.socket.emit('rooms list');
    }

    createInfoSpans(): void {
        const app = document.getElementById('app')! as HTMLDivElement;
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

    login(nickname: string): void {
        this.socket.emit('check name', nickname);
    }

    sendLeaveRoom(): void {
        this.socket.emit('leave room');
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
        this.socket.emit('par upload', fileName);
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
            name: this.player!.name,
            id: this.player!.id
        };
        this.addMsg(msg);
    }

    sendVoiceNote(file: any): void {
        file.name = 'PixelChat-' + this.player!.name + '.wav';
        this.requestParUpload(file);
    }

}