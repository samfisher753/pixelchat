import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Server from './src/Server';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
    maxHttpBufferSize: 300 * 1024 * 1024, // 300MB
    cors: {
        origin: ["http://localhost:5173", "https://www.pixelchat.es"],  // Replace with your client’s address
        methods: ["GET", "POST"]
    }
});

// Initialize your custom Server with Socket.IO
const server = new Server(io);

const port: number = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

// Avoid server idling
if (process.env.APP_URL) {
    setInterval(() => {
        http.get(process.env.APP_URL as string);
    }, 13 * 60 * 1000);
}
