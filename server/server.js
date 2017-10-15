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
                io.emit('room info', this.rooms[roomName]);
            });
        });

    },

    printOnlinePlayers() {
        console.log('Online players: ' + Object.keys(this.players).length);
    }

};

module.exports = server;