import Player from "./models/Player";
import Room from "./models/Room";
import { apiService } from './services/apiService';
import { Server as SocketIOServer } from 'socket.io';
import { FriendshipChanged } from './types/FriendshipChanged';

// Nombre de un archivo del chat en el bucket: chat-<id del usuario>-<id aleatorio>-<nombre original>
const CHAT_FILE_PREFIX = /^chat-[0-9a-f-]{36}-[0-9a-f-]{36}-/;
// Tipos de archivo que admite el chat
const CHAT_FILE_TYPE = /^(image|video|audio)\/[A-Za-z0-9.+-]+$/;

export default class Server {

    rooms: any;
    players: any;
    sockets: any;
    // Ids de los amigos de cada jugador conectado (todos, conectados o no). Se carga de la api al
    // conectarse y se mantiene al día con los avisos de la api (onFriendshipChanged)
    friends: Map<string, Set<string>>;

    engineFps: number;
    engineTimestep: number;
    fps: number;
    timestep: number;
    lastFrameTimeMs: number;
    accumulator: number;

    fps2: number;
    timestep2: number;

    constructor(io: SocketIOServer) {
        this.rooms = {};
        this.players = {};
        this.sockets = {};
        this.friends = new Map();

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

        // Start server loop
        this.lastFrameTimeMs = Date.now();
        this.accumulator = 0;
        this.gameLoop();
        this.sendLoop();
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
            this.friends.set(player.id, new Set(socket.data.friends));

            // Server side terminal msgs
            console.log(player.username + ' joined.');
            this.printOnlinePlayers();

            // Send online players
            this.sendOnlinePlayers();

            socket.emit('connected', player);

            // Cuáles de tus amigos están conectados, y a ellos, que te acabas de conectar
            socket.emit('friends online', this.onlineFriends(player.id).map(id => this.presenceOf(id)));
            this.sendPresenceToFriends(player.id);

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

            // El navegador ha subido un archivo del chat (con la URL que le dio la api) y lo anuncia.
            // Solo se aceptan archivos de este jugador: su nombre empieza por chat-<su id>-.
            // La api vuelve a comprobarlo antes de dar el enlace de lectura, que se reparte a la sala
            // junto con el tipo (para que cada navegador lo muestre sin tener que descargarlo).
            socket.on('file uploaded', async (data: { objectName?: unknown; contentType?: unknown }) => {
                const objectName = data?.objectName, contentType = data?.contentType;
                if (typeof objectName !== 'string' || !objectName.startsWith('chat-' + player.id + '-') || !room) return;
                if (typeof contentType !== 'string' || !CHAT_FILE_TYPE.test(contentType)) return;
                const fileName = objectName.replace(CHAT_FILE_PREFIX, '');
                try {
                    const { url } = await apiService.get<{ url: string }>('/internal/chat-files/read-url'
                        + '?userId=' + encodeURIComponent(player.id) + '&objectName=' + encodeURIComponent(objectName));
                    if (!room) return;
                    console.log(player.username + ' shared the file: ' + fileName);
                    const sender = { name: player.username, id: player.id };
                    for (const p in room.players) {
                        this.sockets[p]?.emit('par download', { fileName, url, contentType, player: sender });
                    }
                } catch (err) {
                    console.error('Could not share the file ' + objectName + ':', err);
                    socket.emit('file failed', fileName);
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
                this.sendPresenceToFriends(player.id);

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
                    this.sendPresenceToFriends(player.id);
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
            this.sendPresenceToFriends(player.id);
            this.friends.delete(player.id);

            // Server side terminal msgs
            console.log(player.username + ' left.');
            this.printOnlinePlayers();

            // Send online players
            this.sendOnlinePlayers();
        }
    }

    // -------------------------------------------------------------------------
    // Amigos
    // -------------------------------------------------------------------------

    // Los amigos de un jugador que están conectados ahora mismo
    onlineFriends(playerId: string): string[] {
        return [...this.friends.get(playerId) ?? []].filter(id => this.players[id]);
    }

    // Si un usuario está conectado y en qué sala (sus amigos la pueden ver siempre)
    presenceOf(id: string) {
        const player: Player | undefined = this.players[id];
        return { id, online: !!player, room: player?.room ?? null };
    }

    // Cuenta a los amigos conectados de un jugador cómo está ahora (conectado o no, y su sala)
    sendPresenceToFriends(playerId: string) {
        const presence = this.presenceOf(playerId);
        for (const id of this.onlineFriends(playerId)) {
            this.sockets[id]?.emit('friend presence', presence);
        }
    }

    // La api avisa de que ha cambiado una amistad: se actualizan las listas de los dos (si están
    // conectados) y se les avisa para que el navegador recargue sus listas de amigos
    onFriendshipChanged(event: FriendshipChanged) {
        const { type, fromId, toId } = event;
        if (type === 'REQUEST_ACCEPTED') {
            this.friends.get(fromId)?.add(toId);
            this.friends.get(toId)?.add(fromId);
        } else if (type === 'FRIEND_REMOVED') {
            this.friends.get(fromId)?.delete(toId);
            this.friends.get(toId)?.delete(fromId);
        }

        for (const [me, other] of [[fromId, toId], [toId, fromId]]) {
            const socket = this.sockets[me];
            if (!socket) continue;
            socket.emit('friends changed', event);
            // Al haceros amigos, cada uno ve si el otro está conectado; al dejar de serlo, deja de verlo
            if (type === 'REQUEST_ACCEPTED') socket.emit('friend presence', this.presenceOf(other));
            if (type === 'FRIEND_REMOVED') socket.emit('friend presence', { id: other, online: false, room: null });
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