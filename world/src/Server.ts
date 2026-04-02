import Player from "./models/Player";
import Room from "./models/Room";
import * as objectstorage from "oci-objectstorage";
import common = require("oci-common");
import { Server as SocketIOServer } from 'socket.io';

export default class Server {

    rooms: any;
    players: any;
    sockets: any;

    engineFps: number;
    engineTimestep: number;
    fps: number;
    timestep: number;
    lastFrameTimeMs: number;
    accumulator: number;

    fps2: number;
    timestep2: number;

    ociClient: objectstorage.ObjectStorageClient;

    constructor(io: SocketIOServer) {
        this.rooms = {};
        this.players = {};
        this.sockets = {};

        // Game Loop
        this.engineFps = 60;
        this.engineTimestep = 1000 / this.engineFps;
        this.fps = 60;
        this.timestep = 1000 / this.fps;

        // Send Loop
        this.fps2 = 20;
        this.timestep2 = 1000 / this.fps2;

        this.createMockRooms();
        this.bindEvents(io);

        this.ociClient = this.ociInit();

        // Start server loop
        this.lastFrameTimeMs = Date.now();
        this.accumulator = 0;
        this.gameLoop();
        this.sendLoop();
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
            name: "upload-" + fileName,
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
            name: "download-" + fileName,
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
        const start = Date.now();
        const delta = start - this.lastFrameTimeMs;
        this.lastFrameTimeMs = start;
        this.accumulator += delta;
        while (this.accumulator >= this.engineTimestep) {
            this.update();
            this.accumulator -= this.engineTimestep;
        }
        const duration = Date.now() - start;
        setTimeout(() => {
            this.gameLoop();
        }, Math.max(0, this.timestep - duration));
    }

    update() {
        // Update rooms
        for (let r in this.rooms) {
            this.rooms[r].updateLogic();
        }
    }

    sendLoop() {
        const start = Date.now();

        for (let p in this.players) {
            let q = this.players[p];
            if (q.room !== null) {
                let s = this.sockets[p];
                s.emit('room info', this.rooms[q.room]);
            }
        }

        const duration = Date.now() - start;

        setTimeout(() => {
            this.sendLoop();
        }, Math.max(0, this.timestep2 - duration));
    }

    createMockRooms() {
        let name = 'DefaultRoom';
        let size = 11;
        let array = [];
        for (let i = 0; i < size; ++i) {
            array.push([] as any[]);
            for (let j = 0; j < size; ++j) {
                array[i].push({ material: 'grass', players: [] });
            }
        }
        for (let i = 0; i < 4; ++i) {
            for (let j = 6; j < size; ++j) {
                array[i][j] = null;
            }
        }
        for (let i = 0; i < size; ++i) {
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
        for (let i = 0; i < size; ++i) {
            array.push([] as any[]);
            for (let j = 0; j < size; ++j) {
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
        for (let i = 0; i < size; ++i) {
            array.push([] as any[]);
            for (let j = 0; j < size; ++j) {
                array[i].push({ material: 'grass', players: [] });
            }
        }
        for (let i = 10; i < size; ++i) {
            for (let j = 0; j < size; ++j) {
                array[i][j] = null;
            }
        }

        room = {
            name: name,
            size: size,
            array: array,
            spawn: { x: 10, y: 0 },
        };
        this.rooms[name] = new Room(room);
    }

    bindEvents(io: SocketIOServer) {
        io.on('connection', (socket) => {
            let room: any = null;

            const player = new Player({ 
                username: socket.data.user.username,
                displayName: socket.data.user.displayName,
                id: socket.data.user.id,
                socketId: socket.id,
                look: socket.data.user.look,
                avatarUrl: socket.data.user.avatarUrl,
                motto: socket.data.user.motto,
            });

            if (this.players[player.id]) {
                this.sockets[player.id].disconnect();
            }
            
            this.players[player.id] = player;
            this.sockets[player.id] = socket;

            // Server side terminal msgs
            console.log(player.username + ' joined.');
            this.printOnlinePlayers();

            // Send online players
            this.sendOnlinePlayers();

            socket.emit('connected', player);

            socket.on('update player', (updated: Player) => {
                player.username = updated.username;
                player.motto = updated.motto;
                player.look = updated.look;
            });

            socket.on('chat message', (msg) => {
                msg.player = {
                    name: player.username,
                    id: player.id
                };

                // Server side terminal msgs
                console.log(msg.player.name + ': ' + msg.text);

                this.checkCmd(msg, player);

                // Send msg to room players
                for (let p in room.players) {
                    if (p !== msg.player.id)
                        this.sockets[p].emit('chat message', msg);
                }

            });

            socket.on('par upload', async (fileName) => {
                console.log(player.username + ' is requesting a PAR to upload the file:\n' + fileName);
                const url = await this.getParUploadUrl(fileName);
                socket.emit('par upload', { fileName, url });
            });

            socket.on('par download', async (fileName) => {
                const url = await this.getParDownloadUrl(fileName);
                const sender = { name: player.username, id: player.id };
                for (let p in room.players) {
                    this.sockets[p].emit('par download', { fileName, url, player: sender });
                }
            });

            socket.on('disconnect', () => {
                this.logout(player, room);
                room = null;
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

                console.log(player.username + ' joined ' + roomName + '.');

                // Join room
                this.rooms[roomName].join(this.players[player.id]);
                room = this.rooms[roomName];

                // Notify room players
                for (let p in room.players) {
                    let q = this.sockets[p];
                    if (p !== player.id)
                        q.emit('player join', player.username);
                }
            });

            socket.on('leave room', () => {
                if (room !== null) {
                    this.leave(room, player);
                    room = null;
                }
                socket.emit('left room');
            });

            socket.on('click', (pos) => {
                player.click = pos;
            });
        });

    }

    logout(player: Player, room: Room) {
        if (player !== null) {
            if (room !== null) {
                this.leave(room, player);
            }
            delete this.players[player.id];
            delete this.sockets[player.id]

            // Server side terminal msgs
            console.log(player.username + ' left.');
            this.printOnlinePlayers();

            // Send online players
            this.sendOnlinePlayers();
        }
    }

    printOnlinePlayers() {
        console.log('Online players: ' + Object.keys(this.players).length);
    }

    sendOnlinePlayers() {
        for (let p in this.sockets) {
            let q = this.sockets[p];
            q.emit('online players', Object.keys(this.players).length);
        }
    }

    leave(room: Room, player: Player) {
        room.leave(player.id);
        console.log(player.username + ' left ' + room.name + '.');

        // Notify room players
        for (let p in room.players) {
            let q = this.sockets[p];
            q.emit('player left', player.username);
        }
    }

    checkCmd(msg: any, player: Player) {
        if (msg.text.substring(0, 1) === ':') {
            let cmd = msg.text.substring(1, msg.text.length);
            switch (cmd) {
                case 'sit':
                    player.sit();
                    break;
            }
        }
        else if (msg.text === 'o/') {
            player.wave();
        }
    }

};