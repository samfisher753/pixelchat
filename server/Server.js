let Player = require('../client/js/Player');
let Room = require('../client/js/Room');

class Server {
    
    constructor(io) {
        this.rooms = {};
        this.players = {};
        this.sockets = {};

        // Game Loop
        // setImmediate achieves less fps than I set it to
        this.fps = 61; // so I set one fps more
        this.timestep = 1000/this.fps;
        this.lastFrameTimeMs = 0;
        this.delta = 0;

        // Send Loop
        this.fps2 = 22;
        this.timestep2 = 1000/this.fps2;
        this.lastFrameTimeMs2 = 0;
        this.delta2 = 0;

        this.createMockRooms();
        this.bindEvents(io);

        // Start server loop
        this.lastFrameTimeMs = Date.now();
        setImmediate(this.gameLoop.bind(this));
        this.lastFrameTimeMs2 = Date.now();
        setImmediate(this.sendLoop.bind(this));
    }

    gameLoop() {
        let timestamp = Date.now();
        let t = timestamp - this.lastFrameTimeMs;
        this.delta += t;
        
        if (this.delta >= this.timestep){
            this.update();
            
            // process.stdout.write('\x1Bc');
            // console.log('Game fps: '+(1000/this.delta));
            
            this.delta -= this.timestep;
        }

        this.lastFrameTimeMs = timestamp;

        setImmediate(this.gameLoop.bind(this));
    }

    update() {
        // Update rooms
        for (let r in this.rooms){
            this.rooms[r].updateLogic();
        }
    }

    sendLoop() {
        let timestamp = Date.now();
        let t = timestamp - this.lastFrameTimeMs2;
        this.delta2 += t;

        if (this.delta2 >= this.timestep2){
            for (let p in this.players){
                let q = this.players[p];
                if (q.room !== null){
                    let s = this.sockets[p];
                    s.emit('room info', this.rooms[q.room]);
                }
            }
            
            this.delta2 -= this.timestep2;
        }

        this.lastFrameTimeMs2 = timestamp;
        
        setImmediate(this.sendLoop.bind(this));
    }

    createMockRooms() {
        let name = 'DefaultRoom';
        let size = 11;
        let array = [];
        for (let i=0; i<size; ++i){
            array.push([]);
            for (let j=0; j<size; ++j){
                array[i].push({ material: 'grass', players: [] });
            }
        }
        for (let i=0; i<4; ++i){
            for (let j=6; j<size; ++j){
                array[i][j] = null;
            }
        }
        for (let i=0; i<size; ++i){
            array[i][10] = null;
        }

        let room = {
            name: name,
            size: size,
            array: array,
        };
        this.rooms[name] = new Room(room);

        name = 'Zulo';
        size = 5;
        array = [];
        for (let i=0; i<size; ++i){
            array.push([]);
            for (let j=0; j<size; ++j){
                array[i].push({ material: 'grass', players: [] });
            }
        }

        room = {
            name: name,
            size: size,
            array: array,
        };
        this.rooms[name] = new Room(room);
    }

    bindEvents(io) {
        io.on('connection', (socket) => {
            let player = null;
            let room = null;
        
            socket.on('check name', (plName) => {
                let b = {name: plName, res: null, errno: 0};
                b.res = (plName.length >= 4 && plName.length <= 15);
                if (b.res) {
                    let reg = new RegExp('[^\\w:.-]+');
                    b.res = !reg.test(plName);
                    if (b.res) {
                        b.res = (typeof this.players[plName] === 'undefined');
                        if (!b.res) b.errno = 3;
                    }
                    else {
                        b.errno = 2;
                    }
                }
                else {
                    b.errno = 1;
                } 
                socket.emit('check name', b);
            });

            // Add player once he sends his name.
            // Client will send player name immediately after connect and check.
            socket.on('new player', (playerName) => {
                player = new Player({ name: playerName });
                this.players[player.name] = player;
                this.sockets[player.name] = socket;

                // Server side terminal msgs
                console.log(player.name + ' joined.');
                this.printOnlinePlayers();

                // Send online players
                this.sendOnlinePlayers();
            });

            socket.on('chat message', (msg) => {
                let chatMsg = { 
                    player: player.name,
                    msg: msg
                };

                // Server side terminal msgs
                console.log(player.name + ': ' + msg);

                // Send msg to room players
                for (let p in room.players){
                    let q = room.players[p];
                    if (q.name !== player.name)
                        this.sockets[q.name].emit('chat message', chatMsg);
                }
            });
        
            socket.on('disconnect', () => {
                // Avoid problems in the case a player connected but 
                // disconnected immediately without sending his name.
                if (player !== null) {
                    if (room !== null){
                        this.leave(room, player.name);
                        room = null;
                    }
                    delete this.players[player.name];
                    delete this.sockets[player.name]

                    // Server side terminal msgs
                    console.log(player.name + ' left.');
                    this.printOnlinePlayers();

                    // Send online players
                    this.sendOnlinePlayers();

                    player = null;
                }
            });

            socket.on('rooms list', () => {
                let rooms = [];
                Object.keys(this.rooms).forEach((name) => {
                    rooms.push({
                        name: name, 
                        players: Object.keys(this.rooms[name].players).length,
                    });
                })
                socket.emit('rooms list', rooms);
            });

            socket.on('join room', (roomName) => {
                // If player already on a room
                if (room !== null) {
                    this.leave(room, player.name);
                }

                console.log(player.name+' joined '+roomName+'.');
                
                // Join room
                this.rooms[roomName].join(this.players[player.name]);
                room = this.rooms[roomName];

                // Notify room players
                for (let p in room.players){
                    let q = this.sockets[p];
                    if (p !== player.name)
                        q.emit('player join', player.name);
                }
            });

            socket.on('leave room', () => {
                this.leave(room, player.name);
                room = null;

                // Send available rooms
                socket.emit('rooms list', Object.keys(this.rooms));
            });

            socket.on('click', (pos) => {
                player.click = pos;
            });
        });

    }

    printOnlinePlayers() {
        console.log('Online players: ' + Object.keys(this.players).length);
    }

    sendOnlinePlayers() {
        for (let p in this.sockets){
            let q = this.sockets[p];
            q.emit('online players', Object.keys(this.players).length);
        }
    }

    leave(room, playerName) {
        console.log(playerName+' left '+room.name+'.');
        room.leave(playerName);

        // Notify room players
        for (let p in room.players){
            let q = this.sockets[p];
            q.emit('player left', playerName);
        }
    }

};

module.exports = Server;