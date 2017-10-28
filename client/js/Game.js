class Game {

    constructor() {
        // Vars
        this.player = null;
        this.room = null;
        this.roomsList = null;
        this.maxMsgLength = 136;
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
        this.minChatWidth = 150;
        this.maxFileSize = 300 * 1024 * 1024; // 300MB
        this.d = { x:0, y:0 };
        this.initialPos = { x:0, y:0 };
        this.mouse = null;
        this.mousedown = false;
        this.disableClick = false; 
        this.resizedown = false;
        this.receiveRoom = false;

        this.configureSocket();
        this.getPlayerName();
    }

    joinRoom(name) {
        if (this.room === null) {
            this.createChatPanel(); 
            this.bindChatEvents();
            this.createCanvas();
            this.bindEvents();
            this.canvasChat = new CanvasChat();
            let app = document.getElementById('app');
            app.style.backgroundImage = 'none';
            app.style.backgroundColor = '#010101';
            this.leaveB.style.display = 'inline-block';
            this.receiveRoom = true;

            this.frame = requestAnimationFrame(this.gameLoop.bind(this));
        }
        else {
            this.addChatInfoMsg('You left '+this.room.name);
        }

        this.socket.emit('join room', name);
        this.addChatInfoMsg('You joined '+name);
    }

    leaveRoom() {
        this.socket.emit('leave room');
        this.receiveRoom = false;
        this.canvasChat = null;
        this.room = null;
        this.leaveB.style.display = 'none';
        cancelAnimationFrame(this.frame);
        this.frame = null;
        this.fpsSpan.innerHTML = 'fps: 0';
        let app = document.getElementById('app');
        let chat = document.getElementsByClassName('game-chat')[0];
        let chatR = document.getElementsByClassName('game-chatResize')[0];
        let hideB = document.getElementsByClassName('game-hideChatButton')[0];
        let canvas = document.getElementsByClassName('game-canvas')[0];
        let chatIn = document.getElementsByClassName('game-chatInput')[0];
        let menu = document.getElementsByClassName('game-menu')[0];
        let cChat = document.getElementById('canvasChat');
        app.removeChild(chat);
        app.removeChild(chatR);
        app.removeChild(hideB);
        app.removeChild(canvas);
        menu.removeChild(chatIn);
        app.removeChild(cChat);
        app.style.backgroundImage = 'url("../textures/misc/background.jpg")';
        app.style.backgroundColor = '#10436f';
    }

    startGame(){
        this.createMenu();
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
            this.canvasChat.update();
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

        // Draw background
        ctx.fillStyle = '#010101';
        ctx.fillRect(0, 0, 
            ctx.canvas.width, ctx.canvas.height);

        // Draw room
        if (this.room !== null) {
            this.room.draw(ctx);
            this.canvasChat.draw();
        }
    
    }

    bindEvents() {
        let canvas = document.getElementsByClassName('game-canvas')[0];
        let body = document.getElementsByTagName('body')[0];
        body.onresize = () => {
            // Resize canvas
            canvas.height = canvas.clientHeight;
            canvas.width = canvas.clientWidth;
            // Update Grid
            Grid.center(canvas.width,canvas.height);
            Grid.createDrawOrder();
            // Resize over canvas chat
            this.canvasChat.chat.height = canvas.height;
            this.canvasChat.chat.width = canvas.width;
            this.canvasChat.defaultY = canvas.height/3;
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
            if (this.mousedown){
                // Prevent from selecting text while dragging
                window.getSelection().removeAllRanges();
                this.mouse = e;
                // Disable click event after dragging
                this.disableClick = true;  
            }
            else if (this.resizedown){
                c.style.transition = 'none';
                b.style.transition = 'none';
                window.getSelection().removeAllRanges();
                let rdx = e.clientX - this.xIni;
                let pc = c.getBoundingClientRect().width + rdx;
                if (pc < this.minChatWidth) pc = this.minChatWidth;
                else if (pc+5 > body.clientWidth) pc = body.clientWidth-5;
                let pr = pc - 5;
                c.style.width = pc + 'px';
                r.style.left = pr + 'px';
                b.style.left = pc + 'px';
                chat.scrollTop = chat.scrollHeight;
                this.xIni = e.clientX;
            }
        };

        document.onmouseup = (e) => {
            this.mousedown = false;
            this.resizedown = false;
        };

        canvas.onclick = (e) => {
            if (!this.disableClick){
                let c = Grid.cellAt(e.clientX, e.clientY);
                if (c!==null) this.socket.emit('click', c);
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
    }

    configureSocket() {
        // Check player name
        this.socket.on('check name', (b) => {
            if (b.res){
                this.player = new Player({ name: b.name, client: true });
                let app = document.getElementById('app');
                app.innerHTML = '';
                this.createInfoSpans();
                Assets.load();
                // Send player name
                this.socket.emit('new player', this.player.name);
            }
            else {
                if (b.errno === 1) 
                    alert('Name must be 4 to 15 characters long.');
                else if (b.errno === 2) 
                    alert('Your name can only contain characters: a-Z, 0-9, '
                        + '- , _ , : and .');
                else if (b.errno === 3)
                    alert('Your name is being used by another player.');
            }
        });

        // Event: Receive chat message
        this.socket.on('chat message', (msg) => {
            this.addChatMsg(msg);
        });

        // Event: Receive file message
        this.socket.on('file message', (msg) => {
            this.addFileMsg(msg);
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
            if (this.receiveRoom){
                // If join room or change room
                if (this.room===null || room.name !== this.room.name) {
                    this.room = new Room({client: true});
                    this.room.update(room);
                    this.player = this.room.players[this.player.name];
                    // Update Grid
                    Grid.size = this.room.size;
                    Grid.center(this.canvasCtx.canvas.width,this.canvasCtx.canvas.height);
                    Grid.createDrawOrder();
                    // Clear canvas chat
                    this.canvasChat.clear();
                    
                }
                else this.room.update(room);
                // Update canvas chat players
                this.canvasChat.players = this.room.players;
            }
        });

        this.socket.on('player join', (name) => {
            this.addChatInfoMsg(name+' joined the room');
        });

        this.socket.on('player left', (name) => {
            this.addChatInfoMsg(name+' left the room');
        });

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
        this.fpsSpan.style = 'position: absolute; right: 0; color: #ffffff;' + 
            ' z-index: 1;';
        this.fpsSpan.innerHTML = 'fps: 0';
        app.appendChild(this.fpsSpan);

        this.playersSpan = document.createElement('span');
        this.playersSpan.style = 'position: absolute; right: 0;'+
            ' color: #ffffff; z-index: 1; top: ' + this.fpsSpan.clientHeight + 'px;';
        this.playersSpan.innerHTML = 'online: 0';
        app.appendChild(this.playersSpan);
    }

    createChatPanel() {
        let app = document.getElementById('app');
        let chatC = document.createElement('div');
        chatC.className = 'game-chat';
        let chatMessagesC = document.createElement('div');
        chatMessagesC.className = 'game-chatMessagesContainer';
        let chatR = document.createElement('div');
        chatR.className = 'game-chatResize';
        let chatB = document.createElement('button');
        chatB.className = 'game-hideChatButton';
        chatB.innerHTML = '<';

        chatC.appendChild(chatMessagesC);
        app.appendChild(chatC);
        app.appendChild(chatR);
        app.appendChild(chatB);

        // Add chat input to menu bar
        let menuBar = document.getElementsByClassName('game-menu')[0];
        let chatInputC = document.createElement('div');
        chatInputC.className = 'game-chatInput';
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.maxlength = this.maxMsgLength;
        chatInputC.appendChild(this.chatInput);
        menuBar.appendChild(chatInputC);
    }

    bindChatEvents() {
        this.chatInput.onkeypress = (e) => {
            let msg = this.chatInput.value.trim();
            if (msg.length >= this.maxMsgLength &&
                e.keyCode !== 46 && e.keyCode !== 8 && e.keyCode !== 13){
                e.preventDefault();
            }
            else if (e.keyCode === 13 && msg !== ''){
                this.chatInput.value = '';
                msg = msg.slice(0,this.maxMsgLength);
                let m = { type: 'text', text: msg };
                this.socket.emit('chat message', m);
                m.player = this.player.name;
                this.addChatMsg(m);
            }
        };

        let b = document.getElementsByClassName('game-hideChatButton')[0];
        let c = document.getElementsByClassName('game-chat')[0];
        let r = document.getElementsByClassName('game-chatResize')[0];
        b.onclick = () => {
            c.style.transition = '0.5s';
            b.style.transition = '0.5s';
            let pc = c.getBoundingClientRect();
            if (pc.left < 0){
                b.innerHTML = '<';
                c.style.left = '0';
                b.style.left = pc.width + 'px';
                r.style.display = 'block';
            }
            else {
                b.innerHTML = '>';
                c.style.left = -pc.width + 'px';
                b.style.left = '0';
                r.style.display = 'none';
            }
        };

        // Drag files
        let app = document.getElementById('app');
        app.ondragover = (e) => {
            e.preventDefault();
        };

        app.ondragend = (e) => {
            e.preventDefault();
        };

        app.ondrop = (e) => {
            e.preventDefault();
            // Just one file per drop to avoid spam
            let file = e.dataTransfer.files[0];
            if (this.allowedFile(file)){
                // Read and send file
                this.readFile(file);
            }
        };
    }

    readFile(file) {
        let fr = new FileReader();
        fr.onload = (e) => {
            let data = e.target.result;
            let type = data.substring(5,10);
            let msg = { type: type, data: data };
            this.socket.emit('file message', msg);
            msg.player = this.player.name;
            this.addFileMsg(msg);
        };
        fr.readAsDataURL(file);
    }

    addFileMsg(msg) {
        if (msg.type === 'image'){
            this.addImageMsg(msg);
        }
        else if (msg.type === 'video'){

        }
        else if (msg.type === 'audio'){

        }
    }

    addImageMsg(msg){
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage';
        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.style.float = 'left';
        nameSpan.textContent = msg.player + ':';

        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];

        let img = new Image();
        img.style.maxWidth = '100%';
        img.style.maxHeight = '150px';
        img.style.marginTop = '5px';
        img.onload = () => {
            chat.appendChild(msgC);
            chat.scrollTop = chat.scrollHeight;
            delete msg.data;
            msg.html = msgC.cloneNode(true);
            this.canvasChat.add(msg);
        }
        img.src = msg.data;

        msgD.appendChild(nameSpan);
        msgD.appendChild(img);
        msgC.appendChild(msgD);
    }

    addChatMsg(msg) {
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage';
        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.textContent = msg.player + ':';

        // Check for urls
        let msgSpan = document.createElement('span');
        let reg = new RegExp('(https?:\/\/[^<>\\s]+)', 'gi');
        let r = reg.exec(msg.text);
        let i = 0;
        while (r !== null){
            if (r.index > i){
                let txt = document.createTextNode(msg.text.substring(i,r.index));
                msgSpan.appendChild(txt);
            }
            i = reg.lastIndex;
            let link = document.createElement('a');
            let l = document.createTextNode(r[0]);
            link.appendChild(l);
            link.setAttribute('href', r[0]);
            link.setAttribute('target', '_blank');
            msgSpan.appendChild(link);
            r = reg.exec(msg.text);
        }
        if (msg.text.length > i){
            let txt = document.createTextNode(msg.text.substring(i,msg.text.length));
            msgSpan.appendChild(txt);
        }

        msgD.appendChild(nameSpan);
        msgD.appendChild(msgSpan);
        msgC.appendChild(msgD);
        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];
        chat.appendChild(msgC);
        chat.scrollTop = chat.scrollHeight;

        msg.html = msgC.cloneNode(true);
        this.canvasChat.add(msg);
    }

    addChatInfoMsg(msg) {
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage game-chatInfoMessage game-boldText';
        msgD.textContent = msg;

        msgC.appendChild(msgD);
        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];
        chat.appendChild(msgC);
        chat.scrollTop = chat.scrollHeight;
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
                e.keyCode !== 46 && e.keyCode !== 8 && e.keyCode !== 13){
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
            if (e.keyCode === 13) {
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

    allowedFile(file) {
        let allowedTypes = [
            'image',
            'video',
            'audio',
        ];

        if (file.size > this.maxFileSize) return false;

        for (let i=0; i<allowedTypes.length; ++i)
            if (file.type.split('/')[0] === allowedTypes[i])
                return true;

        return false;
    }

}