class Game {

    constructor() {
        console.log("Initializing Game...");
        // Vars
        this.socket = null;
        this.playerName = null;
        this.player = null;
        this.room = null;
        this.canvasCtx = null;

        // Misc
        this.lastFrameTimeMs = 0;
        this.d = { x:0, y:0 };
        this.initialPos = { x:0, y:0 };
        this.mouse = {cType: 'checked'};
        this.mousedown = false;
        this.disableClick = false; 
        
        this.getPlayerName();
    }

    init() {
        this.createChatPanel();
        this.socket = io();
        this.configureSocket();
        this.bindChatEvents();
        this.createCanvas();
        this.bindEvents();
        Assets.load();
    }

    startGame(){
        // Join room
        this.socket.emit('join room', this.roomsList[0]);
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timeStamp) {
        let fps = (1000 / (timeStamp - this.lastFrameTimeMs));
        this.fpsSpan.innerHTML = 'fps: ' + Math.ceil(fps);
        this.lastFrameTimeMs = timeStamp;
        this.update();
        this.draw();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        if (this.room !== null){
            this.mouse = this.room.updateLogic(this.mouse, this.playerName);
        }

        this.d = {x:0, y:0};

        // If canvas has been dragged
        if (this.mouse.cType === 'dragged') {
            this.d.x += this.mouse.clientX - this.initialPos.x;
            this.d.y += this.mouse.clientY - this.initialPos.y;
            Grid.move(this.d);
            Grid.createDrawOrder();
            this.initialPos.x = this.mouse.clientX;
            this.initialPos.y = this.mouse.clientY;
            this.mouse.cType = 'checked';
        }
    }

    draw() {
        let ctx = this.canvasCtx;

        // Draw background
        ctx.fillStyle = '#010101';
        ctx.fillRect(0, 0, 
            ctx.canvas.width, ctx.canvas.height);

        // Draw room
        if (this.room !== null) {
            this.room.draw(ctx);
        }
    }

    bindEvents() {
        let canvas = document.getElementsByClassName('game-canvas')[0];
        let body = document.getElementsByTagName('body')[0];
        body.onresize = () => {
            canvas.height = canvas.clientHeight;
            canvas.width = canvas.clientWidth;
            Grid.center(canvas.width,canvas.height);
            Grid.createDrawOrder();
        };
        
        canvas.onmousedown = (e) => {
            this.mousedown = true;
            this.initialPos.x = e.clientX;
            this.initialPos.y = e.clientY;
        };
        
        document.onmousemove = (e) => {
            if (this.mousedown){
                this.mouse = e;
                this.mouse.cType = 'dragged';
                // Disable click event after dragging
                this.disableClick = true;  
            }
        };

        document.onmouseup = (e) => {
            this.mousedown = false;
        };

        canvas.onclick = (e) => {
            if (!this.disableClick){
                this.mouse = e;
                this.mouse.cType = 'clicked';
            }
            this.disableClick = false;
        };
    }

    createCanvas() {
        let app = document.getElementById('app');
        let canvas = document.createElement('canvas');
        canvas.className = 'game-canvas';
        this.canvasCtx = canvas.getContext('2d');
        app.appendChild(canvas);
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;

        this.fpsSpan = document.createElement('span');
        this.fpsSpan.style = 'position: absolute; right: 0; color: #ffffff;';
        this.fpsSpan.innerHTML = 'XX';
        app.appendChild(this.fpsSpan);

        this.playersSpan = document.createElement('span');
        this.playersSpan.style = 'position: absolute; right: 0; color: #ffffff;' +
             ' top: ' + this.fpsSpan.clientHeight + 'px;';
        this.playersSpan.innerHTML = 'YY';
        app.appendChild(this.playersSpan);
    }

    configureSocket() {
        // Send player name
        this.socket.emit('new player', this.playerName);

        // Event: Receive chat message
        this.socket.on('chat message', (chatMsg) => {
            this.addChatMessage(chatMsg.player, chatMsg.msg);
        });

        // Event: Receive rooms list
        this.socket.on('rooms list', (rooms) => {
            this.roomsList = rooms;
        });

        // Event: Receive room info
        this.socket.on('room info', (room) => {
            if (this.room===null) {
                this.room = new Room({a: 0});
                this.room.update(room);
                this.player = this.room.getPlayer(this.playerName);
                this.player.setSocket(this.socket);
                // Update Grid
                Grid.setSize(this.room.getSize());
                Grid.center(this.canvasCtx.canvas.width,this.canvasCtx.canvas.height);
                Grid.createDrawOrder();
            }
            else this.room.update(room);
        });

        this.socket.on('player join', (player) => {
            let p = new Player({name: player.name});
            p.update(player);
            this.room.join(p);
        });

        this.socket.on('player left', (playerName) => {
            this.room.leave(playerName);
        });

        this.socket.on('player info', (player) => {
            let p = this.room.getPlayer(player.name);
            p.update(player);
        });

        // Event: Receive number of players
        this.socket.on('online players', (num_players) => {
            this.playersSpan.innerHTML = 'online: ' + num_players;
        });
    }

    createChatPanel() {
        let app = document.getElementById('app');
        let chatC = document.createElement('div');
        chatC.className = 'game-chat';
        let chatMessagesC = document.createElement('div');
        chatMessagesC.className = 'game-chatMessagesContainer';
        let chatInputC = document.createElement('div');
        chatInputC.className = 'game-chatInput';
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';

        chatInputC.appendChild(this.chatInput);
        chatC.appendChild(chatMessagesC);
        chatC.appendChild(chatInputC);
        app.appendChild(chatC);
    }

    bindChatEvents() {
        this.chatInput.onkeypress = (e) => {
            let msg = this.chatInput.value.trim();
            if (e.keyCode === 13 && msg !== ''){
                this.chatInput.value = '';
                this.socket.emit('chat message', msg);
                this.addChatMessage(this.playerName,msg);
            }
        };
    }

    addChatMessage(player, msg) {
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessage';

        let msgSpan = document.createElement('span');
        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.textContent = player + ': ';
        let msgNode = document.createTextNode(msg);

        msgSpan.appendChild(nameSpan);
        msgSpan.appendChild(msgNode);
        msgC.appendChild(msgSpan);
        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];
        chat.appendChild(msgC);
        chat.scrollTop = chat.scrollHeight;
    }

    getPlayerName(){
        let app = document.getElementById('app');

        let menu = document.createElement('div');
        menu.className = 'game-centered';

        let nickContainer = document.createElement('div');
        nickContainer.className = 'game-horizontalLayout';

        let nickLabel = document.createElement('div');
        nickLabel.className = 'game-horizontalLayout';

        let nickSpan = document.createElement('span');
        nickSpan.className = 'game-label';
        nickSpan.innerHTML = 'Nickname:';
        
        let nickInputContainer = document.createElement('div');
        nickInputContainer.className = 'game-horizontalLayout';

        let nickInput = document.createElement('input');
        nickInput.type = 'text';

        let buttonC = document.createElement('div');
        buttonC.className = 'game-horizontalLayout';

        let button = document.createElement('button');
        button.className = 'game-horizontalCentered';
        button.innerHTML = 'Play';
        button.onclick = () => {
            let nick = nickInput.value.trim();
            if (nick !== '') {
                this.playerName = nick;
                app.innerHTML = '';
                this.init();
            }
        };

        menu.onkeydown = (e) => {
            if (e.keyCode === 13) {
                button.onclick();
            }
        };

        nickLabel.appendChild(nickSpan);
        nickInputContainer.appendChild(nickInput);
        nickContainer.appendChild(nickLabel);
        nickContainer.appendChild(nickInputContainer);
        buttonC.appendChild(button);
        menu.appendChild(nickContainer);
        menu.appendChild(buttonC);
        app.appendChild(menu);

        nickInput.focus();
    }

}