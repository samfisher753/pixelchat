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
        this.rooms[name] = new Room({ name: name, width: 10, length: 10});
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
                    delete this.players[playerName];
                    console.log(playerName + ' left.');
                }
                this.printOnlinePlayers();
                // Send online players
                io.emit('online players', Object.keys(this.players).length);
            });

            socket.on('join room', (roomName) => {
                this.rooms[roomName].join(this.players[playerName]);
                socket.emit('room info', this.rooms[roomName]);
            });
        });

    },

    printOnlinePlayers() {
        console.log('Online players: ' + Object.keys(this.players).length);
    }

};

module.exports = server;