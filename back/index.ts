import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Server from './src/Server';
import cors from 'cors';

const app = express();

const whitelist = ["http://localhost:5173", "https://www.pixelchat.es"];
app.use(cors({
    origin: whitelist,
    methods: ["GET", "POST"]
}));

app.get('/api/avatarimage', async (req, res) => {
    try {
        const urlParams = new URLSearchParams(req.query as any).toString();
        const response = await fetch(`https://www.habbo.es/habbo-imaging/avatarimage?${urlParams}`);
        
        if (!response.ok) {
            res.status(response.status).send(response.statusText);
            return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error('Error fetching avatar image:', error);
        res.status(500).send('Internal Server Error');
    }
});

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
    maxHttpBufferSize: 300 * 1024 * 1024, // 300MB
    cors: {
        origin: whitelist,
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
