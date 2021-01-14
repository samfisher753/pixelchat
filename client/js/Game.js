class Game {

    constructor() {
        // Vars
        this.player = null;
        this.room = null;
        this.roomsList = null;
        this.maxNickLength = 15;

        // Game loop
        this.delta = 0;
        this.fps = 60;
        this.timestep = 1000 / this.fps;
        this.lastFrameTimeMs = 0;
        this.frame = null;

        // Misc
        this.socket = io({reconnection: false});
        this.canvasCtx = null;
        this.maskCanvasCtx = null;
        this.d = { x:0, y:0 };
        this.initialPos = { x:0, y:0 };
        this.mouse = null;
        this.mousedown = false;
        this.disableClick = false; 
        this.resizedown = false;
        this.inRoom = false;

        this.configureSocket();
        Chat.socket = this.socket;
        this.getPlayerName();
    }

    joinRoom(name) {
        if (this.room === null) {
            Chat.create();
            this.createCanvas();
            this.bindEvents();
            CanvasChat.init();
            let app = document.getElementById('app');
            app.style.backgroundImage = 'none';
            app.style.backgroundColor = '#010101';
            this.leaveB.style.display = 'inline-block';
            this.inRoom = true;

            this.frame = requestAnimationFrame(this.gameLoop.bind(this));
        }
        else {
            Chat.addInfoMsg('You left '+this.room.name);
        }

        Chat.chatInput.focus();
        this.socket.emit('join room', name);
        Chat.addInfoMsg('You joined '+name);
    }

    leaveRoom() {
        this.socket.emit('leave room');
        this.inRoom = false;
        this.room = null;
        this.leaveB.style.display = 'none';
        cancelAnimationFrame(this.frame);
        this.frame = null;
        this.fpsSpan.innerHTML = 'fps: 0';
        Chat.remove();
        this.hidePlayerInfo();
        let app = document.getElementById('app');
        let maskCanvas = document.getElementsByClassName('game-canvas')[0];
        let canvas = document.getElementsByClassName('game-canvas')[1];
        app.removeChild(maskCanvas);
        app.removeChild(canvas);
        app.removeChild(CanvasChat.chat);
        app.style.backgroundImage = 'url("../textures/misc/background.jpg")';
        app.style.backgroundColor = '#10436f';
    }

    startGame(){
        this.createMenu();
        Chat.init();
    }

    gameLoop(timeStamp) {
        let t = timeStamp - this.lastFrameTimeMs;
        this.delta += t;
        this.lastFrameTimeMs = timeStamp;

        if (this.delta >= this.timestep) {
            let fps = 1000 / t;
            this.fpsSpan.innerHTML = 'fps: ' + parseInt(fps);
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
            CanvasChat.update();
        }

        this.d = {x:0, y:0};

        // If canvas has been dragged
        if (this.mouse !== null) {
            this.d.x += this.mouse.clientX - this.initialPos.x;
            this.d.y += this.mouse.clientY - this.initialPos.y;
            Grid.move(this.d);
            Grid.createDrawOrder();
            this.initialPos.x = this.mouse.clientX;
            this.initialPos.y = this.mouse.clientY;
            this.mouse = null;
        }
    }

    draw() {
        let ctx = this.canvasCtx;
        let maskCtx = this.maskCanvasCtx;

        // Draw background
        ctx.fillStyle = '#010101';
        ctx.fillRect(0, 0, 
            ctx.canvas.width, ctx.canvas.height);
        maskCtx.fillStyle = '#ffffff';
        maskCtx.fillRect(0, 0, 
            maskCtx.canvas.width, maskCtx.canvas.height);

        // Draw room
        if (this.room !== null) {
            this.room.draw(ctx, maskCtx);
            CanvasChat.draw();
        }
    }

    bindEvents() {
        let maskCanvas = document.getElementsByClassName('game-canvas')[0];
        let canvas = document.getElementsByClassName('game-canvas')[1];
        let body = document.getElementsByTagName('body')[0];
        body.onresize = () => {
            if (this.inRoom){
                // Resize Mask Canvas
                maskCanvas.height = maskCanvas.clientHeight;
                maskCanvas.width = maskCanvas.clientWidth;
                // Resize canvas
                canvas.height = canvas.clientHeight;
                canvas.width = canvas.clientWidth;
                // Update Grid
                Grid.center(canvas.width,canvas.height);
                Grid.createDrawOrder();
                // Resize over canvas chat
                CanvasChat.chat.height = canvas.height;
                CanvasChat.chat.width = canvas.width;
                CanvasChat.defaultY = canvas.height/3;
            }
        };

        let r = document.getElementsByClassName('game-chatResize')[0];
        let c = document.getElementsByClassName('game-chat')[0];
        let b = document.getElementsByClassName('game-hideChatButton')[0];
        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];
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
            if (this.inRoom){
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
                    let rdx = e.clientX - this.xIni;
                    let pc = c.getBoundingClientRect().width + rdx;
                    if (pc < Chat.minChatWidth) pc = Chat.minChatWidth;
                    else if (pc+5 > body.clientWidth) pc = body.clientWidth-5;
                    let pr = pc - 5;
                    c.style.width = pc + 'px';
                    r.style.left = pr + 'px';
                    b.style.left = pc + 'px';
                    chat.scrollTop = chat.scrollHeight;
                    this.xIni = e.clientX;
                }
            }
        };

        document.onmouseup = (e) => {
            if (this.inRoom) {
                this.mousedown = false;
                this.resizedown = false;
                Chat.chatInput.focus();
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
                    let c = Grid.cellAt(e.clientX, e.clientY);
                    if (c!==null) {
                        this.socket.emit('click', c);
                        this.hidePlayerInfo();
                    }
                }
            }
            this.disableClick = false;
        };

        // Drag files
        let app = document.getElementById('app');
        app.ondragover = (e) => {
            if (this.inRoom) e.preventDefault();
        };

        app.ondragend = (e) => {
            if (this.inRoom) e.preventDefault();
        };

        app.ondrop = (e) => {
            if (this.inRoom) {
                e.preventDefault();
                // Just one file per drop to avoid spam
                let file = e.dataTransfer.files[0];
                Chat.checkAndReadFile(file);
            }
        };

    }

    playerAt(x, y){
        let mask = this.maskCanvasCtx;
        let pixel = mask.getImageData(x, y, 1, 1);
        if (pixel.data[0]===0){
            let index = pixel.data[2];
            let playerNames = Object.keys(this.room.players);
            let player = this.room.players[playerNames[index]];
            return player;
        }
        return null;
    }

    createCanvas() {
        let app = document.getElementById('app');

        // Mask Canvas
        let maskCanvas = document.createElement('canvas');
        maskCanvas.className = 'game-canvas';
        this.maskCanvasCtx = maskCanvas.getContext('2d');
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
        this.socket.on('check name', (b) => {
            if (b.res){
                this.player = new Player({ name: b.name, id: this.socket.id, client: true });
                Chat.playerName = this.player.name;
                Chat.playerId = this.player.id;
                let app = document.getElementById('app');
                app.innerHTML = '';
                this.createInfoSpans();
                Assets.load();
                Assets.loadAvatarImages(this.player.name, false, this.player);
                // Send player name
                this.socket.emit('new player', this.player.name);
            }
            else {
                if (b.errno === 1) 
                    alert('Name must be 4 to 15 characters long.');
                else if (b.errno === 2)
                    alert('Your name is being used by another player.');
            }
        });

        // Event: Receive chat message
        this.socket.on('chat message', (msg) => {
            Chat.addMsg(msg);
        });

        // Event: Receive file message
        this.socket.on('file message', (msg) => {
            Chat.addFileMsg(msg);
        });

        // Event: Receive number of players
        this.socket.on('online players', (num_players) => {
            this.playersSpan.innerHTML = 'online: ' + num_players;
        });

        // Event: Receive rooms list
        this.socket.on('rooms list', (rooms) => {
            this.roomsList = rooms;
            this.createRoomsWindow();
        });

        // Event: Receive room info
        this.socket.on('room info', (room) => {
            // If we already are in a room, joining or changing room
            if (this.inRoom){
                // If join room or change room
                if (this.room===null || room.name !== this.room.name) {
                    this.room = new Room({client: true});
                    this.room.update(room);
                    this.player = this.room.players[this.player.id];
                    // Update Grid
                    Grid.size = this.room.size;
                    Grid.center(this.canvasCtx.canvas.width,this.canvasCtx.canvas.height);
                    Grid.createDrawOrder();
                    // Clear canvas chat
                    CanvasChat.clear();
                }
                else this.room.update(room);
                // Update canvas chat players
                CanvasChat.players = this.room.players;
            }
        });

        this.socket.on('player join', (name) => {
            Chat.addInfoMsg(name+' joined the room');
        });

        this.socket.on('player left', (name) => {
            Chat.addInfoMsg(name+' left the room');
        });

    }

    showPlayerInfo(player){
        this.hidePlayerInfo();
        let app = document.getElementById('app');
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
            let app = document.getElementById('app');
            app.removeChild(pi);
        }
    }

    createRoomsWindow() {
        let app = document.getElementById('app');
        let rw = document.createElement('div');
        rw.className = 'game-window';
        let closeB = document.createElement('button');
        closeB.className = 'game-closeButton';
        closeB.innerHTML = 'X';
        closeB.onclick = ()=>{app.removeChild(rw);};
        let ul = document.createElement('ul');
        this.roomsList.forEach((r) => {
            let li = document.createElement('li');
            let s = document.createElement('span');
            s.innerHTML = r.name + ' | Players: ' + r.players;
            let joinB = document.createElement('button');
            joinB.innerHTML = 'Join';
            joinB.onclick = (() => {
                this.joinRoom(r.name);
                app.removeChild(rw);
            }).bind(r);
            li.appendChild(s);
            li.appendChild(joinB);
            ul.appendChild(li);
        })

        rw.appendChild(closeB);
        rw.appendChild(ul);
        app.appendChild(rw);
    }

    createMenu() {
        let app = document.getElementById('app');
        let menuBar = document.createElement('div');
        menuBar.className = 'game-menu';
        this.leaveB = document.createElement('button');
        this.leaveB.style.display = 'none';
        let lImg = document.createElement('img');
        lImg.src = 'textures/icons/back.png';
        let roomsB = document.createElement('button');
        let rImg = document.createElement('img');
        rImg.src = 'textures/icons/rooms.png';

        this.leaveB.onclick = () => {
            this.leaveRoom();
        };
        roomsB.onclick = () => {
            this.socket.emit('rooms list');
        };

        this.leaveB.appendChild(lImg);
        roomsB.appendChild(rImg);
        menuBar.appendChild(this.leaveB);
        menuBar.appendChild(roomsB);
        app.appendChild(menuBar);
    }

    createInfoSpans() {
        let app = document.getElementById('app');
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

    getPlayerName(){
        let app = document.getElementById('app');

        let menu = document.createElement('div');
        menu.className = 'game-login';

        let nickContainer = document.createElement('div');
        let nickInput = document.createElement('input');
        nickInput.type = 'text';
        nickInput.placeholder = 'Nickname'
        nickInput.onkeydown = (e) => {
            let nick = nickInput.value.trim();
            if (nick.length >= this.maxNickLength &&
                e.code !== 'Delete' && e.code !== 'Backspace' && 
                e.code !== 'Enter' && e.code !== 'NumpadEnter'){
                e.preventDefault();
            }
        };

        let buttonC = document.createElement('div');
        let button = document.createElement('button');
        button.innerHTML = '<span>PLAY</span>';
        button.onclick = () => {
            let nick = nickInput.value.trim();
            if (nick !== '') {
                this.socket.emit('check name', nick);
            }
        };

        menu.onkeydown = (e) => {
            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                button.onclick();
            }
        };

        nickContainer.appendChild(nickInput);
        buttonC.appendChild(button);
        menu.appendChild(nickContainer);
        menu.appendChild(buttonC);
        app.appendChild(menu);

        nickInput.focus();
    }

}