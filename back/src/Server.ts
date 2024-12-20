import Player from "./models/Player";
import Room from "./models/Room";
import * as objectstorage from "oci-objectstorage";
import common = require("oci-common");
import { Server as SocketIOServer } from 'socket.io';

export default class Server {
    
    rooms: any;
    players: any;
    sockets: any;

    fps: number;
    timestep: number;
    lastFrameTimeMs: number;
    delta: number;

    fps2: number;
    timestep2: number;
    lastFrameTimeMs2: number;
    delta2: number;

    ociClient: objectstorage.ObjectStorageClient;

    constructor(io: SocketIOServer) {
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

        this.ociClient = this.ociInit();

        // Start server loop
        this.lastFrameTimeMs = Date.now();
        setImmediate(this.gameLoop.bind(this));
        this.lastFrameTimeMs2 = Date.now();
        setImmediate(this.sendLoop.bind(this));
    }

    ociInit() {
        const configurationFilePath = "./oci-config";
        const provider = new common.ConfigFileAuthenticationDetailsProvider(configurationFilePath);
        return new objectstorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
    }

    async getParUploadUrl(fileName: string) {
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1);

        const createPreauthenticatedRequestDetails = {
            name: "upload-"+fileName,
            objectName: fileName,
            accessType: objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite,
            timeExpires: expireDate,
        }
    
        const createPreauthenticatedRequestRequest = { 
            namespaceName: "axyrawf9bk3a",
            bucketName: "pixelchat-files",
            createPreauthenticatedRequestDetails: createPreauthenticatedRequestDetails
        }; 
    
        const createPreauthenticatedRequestResponse = await this.ociClient.createPreauthenticatedRequest(createPreauthenticatedRequestRequest);
        return createPreauthenticatedRequestResponse.preauthenticatedRequest.fullPath;
    }

    async getParDownloadUrl(fileName: string) {
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1);

        const createPreauthenticatedRequestDetails = {
            name: "download-"+fileName,
            objectName: fileName,
            accessType: objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
            timeExpires: expireDate,
        }
    
        const createPreauthenticatedRequestRequest = { 
            namespaceName: "axyrawf9bk3a",
            bucketName: "pixelchat-files",
            createPreauthenticatedRequestDetails: createPreauthenticatedRequestDetails
        }; 
    
        const createPreauthenticatedRequestResponse = await this.ociClient.createPreauthenticatedRequest(createPreauthenticatedRequestRequest);
        return createPreauthenticatedRequestResponse.preauthenticatedRequest.fullPath;
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
            array.push([] as any[]);
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

        let room: any = {
            name: name,
            size: size,
            array: array,
        };
        this.rooms[name] = new Room(room);

        name = 'Zulo';
        size = 5;
        array = [];
        for (let i=0; i<size; ++i){
            array.push([] as any[]);
            for (let j=0; j<size; ++j){
                array[i].push({ material: 'default', players: [] });
            }
        }

        room = {
            name: name,
            size: size,
            array: array,
        };
        this.rooms[name] = new Room(room);

        name = 'Garito';
        size = 15;
        array = [];
        for (let i=0; i<size; ++i){
            array.push([] as any[]);
            for (let j=0; j<size; ++j){
                array[i].push({ material: 'grass', players: [] });
            }
        }
        for (let i=10; i<size; ++i){
            for (let j=0; j<size; ++j){
                array[i][j] = null;
            }
        }

        room = {
            name: name,
            size: size,
            array: array,
            spawn: {x: 10, y:0},
        };
        this.rooms[name] = new Room(room);
    }

    bindEvents(io: SocketIOServer) {
        io.on('connection', (socket) => {
            let player: any = null;
            let room: any = null;
        
            socket.on('check name', (plName) => {
                let b: any = {name: plName, res: null, errno: 0};
                b.res = (plName.length >= 4 && plName.length <= 15);
                if (b.res) {
                    for (let id in this.players) {
                        if (this.players[id].name === plName){
                            b.res = false;
                            break;
                        }
                    }
                    if (!b.res) b.errno = 2;
                }
                else {
                    b.errno = 1;
                } 
                socket.emit('check name', b);
            });

            // Add player once he sends his name.
            // Client will send player name immediately after connect and check.
            socket.on('new player', (playerName) => {
                player = new Player({ name: playerName, id: socket.id });
                this.players[player.id] = player;
                this.sockets[player.id] = socket;

                // Server side terminal msgs
                console.log(player.name + ' joined.');
                this.printOnlinePlayers();

                // Send online players
                this.sendOnlinePlayers();
            });

            socket.on('chat message', (msg) => {
                msg.player = {
                    name: player.name,
                    id: player.id
                };

                // Server side terminal msgs
                console.log(msg.player.name + ': ' + msg.text);

                this.checkCmd(msg, player);

                // Send msg to room players
                for (let p in room.players){
                    if (p !== msg.player.id)
                        this.sockets[p].emit('chat message', msg);
                }
                
            });

            socket.on('par upload', async (fileName) => {
                console.log(player.name+' is requesting a PAR to upload the file:\n'+fileName);
                const url = await this.getParUploadUrl(fileName);
                socket.emit('par upload', {fileName, url});
            });

            socket.on('par download', async (fileName) => {
                const url = await this.getParDownloadUrl(fileName);
                const sender = { name: player.name, id: player.id };
                for (let p in room.players){
                    this.sockets[p].emit('par download', {fileName, url, player: sender});
                }
            });
        
            socket.on('disconnect', () => {
                // Avoid problems in the case a player connected but 
                // disconnected immediately without sending his name.
                if (player !== null) {
                    if (room !== null){
                        this.leave(room, player);
                        room = null;
                    }
                    delete this.players[player.id];
                    delete this.sockets[player.id]

                    // Server side terminal msgs
                    console.log(player.name + ' left.');
                    this.printOnlinePlayers();

                    // Send online players
                    this.sendOnlinePlayers();

                    player = null;
                }
            });

            socket.on('rooms list', () => {
                const rooms: any[] = [];
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
                    this.leave(room, player);
                }

                console.log(player.name+' joined '+roomName+'.');
                
                // Join room
                this.rooms[roomName].join(this.players[player.id]);
                room = this.rooms[roomName];

                // Notify room players
                for (let p in room.players){
                    let q = this.sockets[p];
                    if (p !== player.id)
                        q.emit('player join', player.name);
                }
            });

            socket.on('leave room', () => {
                this.leave(room, player);
                room = null;
                socket.emit('left room');
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

    leave(room: Room, player: Player) {
        room.leave(player.id);
        console.log(player.name+' left '+room.name+'.');

        // Notify room players
        for (let p in room.players){
            let q = this.sockets[p];
            q.emit('player left', player.name);
        }
    }

    checkCmd(msg: any, player: Player) {
        if (msg.text.substring(0,1) === ':'){
            let cmd = msg.text.substring(1, msg.text.length);
            switch (cmd) {
                case 'sit':
                    player.sit();
                    break;
            }
        }
        else if (msg.text === 'o/'){
            player.wave();
        }
    }

};