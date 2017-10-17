let Player = require('../client/js/Player');
let Room = require('../client/js/Room');

let server = {

    rooms: {},
    players: {},

    init(io) {
        this.createMockRooms();
        this.bindEvents(io);
    },

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
    },

    bindEvents(io) {
        io.on('connection', (socket) => {
            let playerName = null;
            let room = null;
        
            // For coherence I add the player once he sends his name, not before.
            // Client will send player name immediately after connect.
            socket.on('new player', (plName) => {
                playerName = plName;
                this.players[playerName] = new Player({ name: playerName });
                console.log(playerName + ' joined.');
                this.printOnlinePlayers();
                
                // Send available rooms
                socket.emit('rooms list', Object.keys(this.rooms));

                // Send online players
                io.emit('online players', Object.keys(this.players).length);
            });

            socket.on('chat message', (msg) => {
                console.log(playerName + ': ' + msg);
                let chatMsg = { 
                    player: playerName,
                    msg: msg
                };
                socket.broadcast.emit('chat message', chatMsg);
            });
        
            socket.on('disconnect', () => {
                // Avoid problems in the extreme case a player connected but 
                // disconnected immediately without sending his name.
                if (playerName !== null) {
                    let room = this.players[playerName].getRoom();
                    if (room !== null){
                        this.rooms[room].leave(playerName);
                        io.emit('room info', this.rooms[room]);
                    }
                    delete this.players[playerName];
                    console.log(playerName + ' left.');
                }
                this.printOnlinePlayers();
                // Send online players
                io.emit('online players', Object.keys(this.players).length);
            });

            socket.on('join room', (roomName) => {
                this.rooms[roomName].join(this.players[playerName]);
                room = this.rooms[roomName];
                io.emit('room info', this.rooms[roomName]);
            });

            socket.on('move', (player) => {
                let ct = room.cell(player.target.x, player.target.y);
                let cnp = room.cell(player.nextPos.x, player.nextPos.y);
                let p = room.getPlayer(playerName);
                p.direction = player.direction; 
                // Check target is empty 
                if (ct.players.length === 0){
                    // Start or keep moving
                    p.target = player.target;
                    p.nextPos = player.nextPos;
                    p.status = 'walk';
                }
                else {
                    // Stop
                    p.target = null;
                    p.nextPos = null;
                    p.status = 'stand';
                }

                // In case player changed of cell
                let c = room.cell(p.pos.x, p.pos.y);
                let i = c.players.indexOf(p.name);
                c.players.splice(i, 1);
                p.pos = player.pos;
                c = room.cell(p.pos.x, p.pos.y);
                c.players.push(p.name);

                io.emit('room info', room);
            });

            socket.on('end-move', () => {
                let p = room.getPlayer(playerName);
                let ct = room.cell(p.target.x, p.target.y);
                if (ct.players.length === 0){
                    let c = room.cell(p.pos.x, p.pos.y);
                    let i = c.players.indexOf(p.name);
                    c.players.splice(i, 1);
                    p.pos = p.target;
                    ct.players.push(p.name);
                }
                p.target = null;
                p.nextPos = null;
                p.status = 'stand';
                io.emit('room info', room);
            });

            socket.on('change direction', (d) => {
                let p = room.getPlayer(playerName);
                p.direction = d;
                io.emit('room info', room);
            })
        });

    },

    printOnlinePlayers() {
        console.log('Online players: ' + Object.keys(this.players).length);
    }

};

module.exports = server;