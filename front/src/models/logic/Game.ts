import { io, Socket } from 'socket.io-client'
import { chat } from '@/models/logic/Chat'
import Player from '@/models/entities/Player'
import { assets } from '@/models/others/Assets'
import { canvasChat } from '@/models/logic/CanvasChat'
import Room from '@/models/entities/Room'
import { grid } from '@/models/logic/Grid'

import { gameEventEmitter } from '@/emitters/GameEventEmitter'
import { GameEvent } from '@/enums/GameEvent'
import { Pos } from '@/types/Pos'

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
    resizedown: boolean;
    mouseCell: Pos | null;
    fpsSpan: HTMLSpanElement | undefined;
    playersSpan: HTMLSpanElement | undefined;
    xIni: number | undefined;

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
        this.socket = io(import.meta.env.VITE_SOCKETIO_BACKEND, { reconnection: false });
        this.canvasCtx = null;
        this.maskCanvasCtx = null;
        this.d = { x:0, y:0 };
        this.initialPos = { x:0, y:0 };
        this.mouse = null;
        this.mousedown = false;
        this.disableClick = false; 
        this.resizedown = false;
        this.mouseCell = null;

        this.configureSocket();
        chat.socket = this.socket;
        this.setDragEvents();
        gameEventEmitter.emit(GameEvent.StartUi);
    }

    setDragEvents(){
        // Drag files / Prevent default drag action
        let app = document.getElementById('app')!;
        app.ondragover = (e) => {
            e.preventDefault();
        };

        app.ondragend = (e) => {
            e.preventDefault();
        };

        app.ondrop = (e) => {
            e.preventDefault();
            if (this.room !== null && e.dataTransfer) {
                // Just one file per drop to avoid spam
                const file: File = e.dataTransfer.files[0];
                chat.checkAndReadFile(file);
            }
        };
    }

    joinRoom(room) {
        gameEventEmitter.emit(GameEvent.RoomJoined);

        if (this.room === null) {
            chat.create();
            this.createCanvas();
            this.bindEvents();
            canvasChat.init();
            let app = document.getElementById('app')!;
            app.style.backgroundImage = 'none';
            app.style.backgroundColor = '#010101';

            this.frame = requestAnimationFrame(this.gameLoop.bind(this));
        }
        else {
            chat.addInfoMsg('Saliste de '+this.room.name);
        }

        this.mouseCell = null;
        this.room = new Room();
        this.room.update(room);
        this.player = this.room.players[this.player!.id];
        // Update Grid
        grid.size = this.room.size;
        grid.center(this.canvasCtx!.canvas.width,this.canvasCtx!.canvas.height);
        grid.createDrawOrder();
        // Clear canvas chat
        canvasChat.clear();

        chat.addInfoMsg('Te uniste a '+this.room.name);
    }

    leaveRoom() {
        this.room = null;
        gameEventEmitter.emit(GameEvent.RoomLeft);
        cancelAnimationFrame(this.frame!);
        this.frame = null;
        this.fpsSpan!.innerHTML = 'fps: 0';
        chat.remove();
        this.hidePlayerInfo();
        let app = document.getElementById('app')!;
        let maskCanvas = document.getElementsByClassName('game-canvas')[0];
        let canvas = document.getElementsByClassName('game-canvas')[1];
        app.removeChild(maskCanvas);
        app.removeChild(canvas);
        app.removeChild(canvasChat.chat!);
        app.style.backgroundImage = 'url("/assets/misc/background.jpg")';
        app.style.backgroundColor = '#2e2e2c';
    }

    startGame(){
        chat.init();
    }

    gameLoop(timeStamp) {
        let t = timeStamp - this.lastFrameTimeMs;
        this.delta += t;
        this.lastFrameTimeMs = timeStamp;

        if (this.delta >= this.timestep) {
            let fps = 1000 / t;
            this.fpsSpan!.innerHTML = 'fps: ' + Math.floor(fps);
            while (this.delta >= this.timestep){
                this.update();
                this.delta -= this.timestep;
            }
            this.draw();
        }
        
        this.frame = requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        if (this.room !== null){
            this.room.updateLogic();
            canvasChat.update();
        }

        this.d = {x:0, y:0};

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

    draw() {
        let ctx = this.canvasCtx!;
        let maskCtx = this.maskCanvasCtx!;

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
            canvasChat.draw();
        }
    }

    bindEvents() {
        let maskCanvas = document.getElementsByClassName('game-canvas')[0] as HTMLCanvasElement;
        let canvas = document.getElementsByClassName('game-canvas')[1] as HTMLCanvasElement;
        let body = document.getElementsByTagName('body')[0];
        body.onresize = () => {
            if (this.room !== null){
                // Resize Mask Canvas
                maskCanvas.height = maskCanvas.clientHeight;
                maskCanvas.width = maskCanvas.clientWidth;
                // Resize canvas
                canvas.height = canvas.clientHeight;
                canvas.width = canvas.clientWidth;
                // Update Grid
                grid.center(canvas.width,canvas.height);
                grid.createDrawOrder();
                // Resize over canvas chat
                canvasChat.chat!.style.height = canvas.height + 'px';; 
                canvasChat.chat!.style.width = canvas.width + 'px';;
                canvasChat.defaultY = canvas.height/3;
            }
        };

        let r = document.getElementsByClassName('game-chatResize')[0] as HTMLDivElement;
        let c = document.getElementsByClassName('game-chat')[0] as HTMLDivElement;
        let b = document.getElementsByClassName('game-hideChatButton')[0] as HTMLButtonElement;
        let chatC = document.getElementsByClassName('game-chatMessagesContainer')[0] as HTMLDivElement;
        r.onmousedown = (e) => {
            this.resizedown = true;
            this.xIni = e.clientX;
        };
        
        canvas.onmousedown = (e) => {
            this.mousedown = true;
            this.initialPos.x = e.clientX;
            this.initialPos.y = e.clientY;
        };
        
        document.onmousemove = (e) => {
            if (this.room !== null){
                if (this.mousedown){
                    // Prevent from selecting text while dragging
                    //window.getSelection().removeAllRanges();
                    this.mouse = e;
                    // Disable click event after dragging
                    this.disableClick = true;  
                }
                else if (this.resizedown){
                    c.style.transition = 'none';
                    b.style.transition = 'none';
                    //window.getSelection().removeAllRanges();
                    let rdx = e.clientX - this.xIni!;
                    let pc = c.getBoundingClientRect().width + rdx;
                    if (pc < chat.minChatWidth) pc = chat.minChatWidth;
                    else if (pc+5 > body.clientWidth) pc = body.clientWidth-5;
                    let pr = pc - 5;
                    c.style.width = pc + 'px';
                    r.style.left = pr + 'px';
                    b.style.left = pc + 'px';
                    chatC.scrollTop = chatC.scrollHeight;
                    this.xIni = e.clientX;
                }
            }
        };

        document.onmouseup = () => {
            if (this.room !== null) {
                this.mousedown = false;
                this.resizedown = false;
            }
        };

        canvas.onclick = (e) => {
            if (!this.disableClick){
                // Check player
                let p = this.playerAt(e.clientX, e.clientY);
                if (p!==null) {
                    this.socket.emit('click', p.pos);
                    this.showPlayerInfo(p);
                }
                // Check cell
                else {
                    const c: Pos | null = grid.cellAt(e.clientX, e.clientY);
                    if (c!==null) {
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

    playerAt(x, y){
        let mask = this.maskCanvasCtx!;
        let pixel = mask.getImageData(x, y, 1, 1);
        if (pixel.data[0]===0){
            let index = pixel.data[2];
            let playerNames = Object.keys(this.room!.players);
            let player = this.room!.players[playerNames[index]];
            return player;
        }
        return null;
    }

    createCanvas() {
        let app = document.getElementById('app')!;

        // Mask Canvas
        let maskCanvas = document.createElement('canvas');
        maskCanvas.className = 'game-canvas';
        this.maskCanvasCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        app.appendChild(maskCanvas);
        maskCanvas.height = maskCanvas.clientHeight;
        maskCanvas.width = maskCanvas.clientWidth;

        //Game Canvas
        let canvas = document.createElement('canvas');
        canvas.className = 'game-canvas';
        this.canvasCtx = canvas.getContext('2d');
        app.appendChild(canvas);
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;
    }

    configureSocket() {
        // Check player name
        this.socket.on('check name', async (b) => {
            if (b.res){
                this.player = new Player({ name: b.name as string, id: this.socket.id! } as Player);
                chat.playerName = this.player.name;
                chat.playerId = this.player.id;
                gameEventEmitter.emit(GameEvent.PlayerLoggedIn);
                let app = document.getElementById('app')!;
                app.innerHTML = '';
                this.createInfoSpans();
                assets.load(this.player);
                // Send player name
                this.socket.emit('new player', this.player.name);
                this.startGame();
                this.openRoomsList();
            }
            else {
                gameEventEmitter.emit(GameEvent.ErrorOnPlayerLogin, b.errno)
            }
        });

        // Event: Receive chat message
        this.socket.on('chat message', (msg) => {
            chat.addMsg(msg);
        });

        // Event: Receive file message
        this.socket.on('file message', (msg) => {
            chat.addFileMsg(msg);
        });

        // Event: Receive number of players
        this.socket.on('online players', (num_players) => {
            this.playersSpan!.innerHTML = 'online: ' + num_players;
        });

        // Event: Receive rooms list
        this.socket.on('rooms list', (rooms) => {
            gameEventEmitter.emit(GameEvent.OpenRoomsList, rooms);
        });

        // Event: Receive room info
        this.socket.on('room info', (room) => {
            // If join room or change room
            if (this.room===null || room.name !== this.room.name) this.joinRoom(room);
            // If still in the same room
            else this.room.update(room);
            // Update canvas chat players
            canvasChat.players = this.room!.players;
        });

        // Successfully left a room
        this.socket.on('left room', () => {
            this.leaveRoom();
        });

        this.socket.on('player join', (name) => {
            chat.addInfoMsg(name+' se ha unido a la sala');
        });

        this.socket.on('player left', (name) => {
            chat.addInfoMsg(name+' abandonó la sala');
        });

        this.socket.on('disconnect', () => {
            alert('Desconectado del servidor.');
        });
    }

    showPlayerInfo(player){
        this.hidePlayerInfo();
        let app = document.getElementById('app')!;
        let pi = document.createElement('div');
        pi.className = 'game-playerInfo';
        let p = document.createElement('p');
        p.innerHTML = player.name;
        let di = document.createElement('div');
        let img = document.createElement('img');
        let storedImg = player.images['stand'][6][0];
        img.src = storedImg.src;
        img.onload = () => {
            pi.appendChild(p);
            di.appendChild(img);
            pi.appendChild(di);
            app.appendChild(pi);
        }
    }

    hidePlayerInfo() {
        let pis = document.getElementsByClassName('game-playerInfo');
        if (pis.length > 0){
            let pi = pis[0];
            let app = document.getElementById('app')!;
            app.removeChild(pi);
        }
    }

    sendJoinRoom(roomName: string): void {
        this.socket.emit('join room', roomName);
    }

    openRoomsList() {
        this.socket.emit('rooms list');
    }

    createInfoSpans() {
        let app = document.getElementById('app')!;
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

    login(nickname) {
        this.socket.emit('check name', nickname);
    } 

    sendLeaveRoom() {
        this.socket.emit('leave room');
    }

}