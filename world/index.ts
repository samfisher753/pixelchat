import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Server from './src/Server';
import cors from 'cors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { apiService } from './src/services/apiService';
import { UserInfo } from './src/types/UserInfo';

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());

const app = express();
app.use(cors({ origin: corsOrigins, methods: ['GET', 'POST'] }));

// ---------------------------------------------------------------------------
// Avatar proxy
// ---------------------------------------------------------------------------
app.get('/api/avatarimage', async (req, res) => {
    try {
        const urlParams = new URLSearchParams(req.query as any).toString();
        const response = await fetch(`https://www.habbo.es/habbo-imaging/avatarimage?${urlParams}`);

        if (!response.ok) {
            res.status(response.status).send(response.statusText);
            return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error('Error fetching avatar image:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ---------------------------------------------------------------------------
// Socket.IO
// ---------------------------------------------------------------------------
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
    maxHttpBufferSize: 300 * 1024 * 1024,
    cors: { origin: corsOrigins, methods: ['GET', 'POST'] }
});

// ---------------------------------------------------------------------------
// JWT public key: env var en producción, archivo local en desarrollo
// En .env / Docker suele ir en una línea con \n entre bloques; dotenv no
// convierte eso a saltos reales, así que normalizamos aquí.
// ---------------------------------------------------------------------------
function pemFromEnv(value: string | undefined): string | undefined {
    const v = value?.trim();
    if (!v) return undefined;
    return v.includes('\\n') ? v.replace(/\\n/g, '\n') : v;
}

const jwtPublicKey: string =
    pemFromEnv(process.env.JWT_PUBLIC_KEY)
    || fs.readFileSync(path.resolve(__dirname, '../../api/src/main/resources/publicKey.pem'), 'utf-8');

// ---------------------------------------------------------------------------
// Middleware de autenticación
// ---------------------------------------------------------------------------
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
        return next(new Error('auth.missing_token'));
    }

    // Validar JWT
    let payload: JwtPayload;
    try {
        payload = jwt.verify(token, jwtPublicKey, { algorithms: ['RS256'] }) as JwtPayload;
    } catch (err) {
        const code = err instanceof jwt.TokenExpiredError
            ? 'auth.token_expired'
            : 'auth.invalid_token';
        return next(new Error(code));
    }

    // Obtener datos completos del usuario desde la API
    try {
        const user = await apiService.get<UserInfo>(`/internal/users/${payload.sub}`);
        socket.data.user = user;
        next();
    } catch {
        next(new Error('auth.user_fetch_failed'));
    }
});

// ---------------------------------------------------------------------------
// Inicializar servidor de juego
// ---------------------------------------------------------------------------
const server = new Server(io);

const port: number = Number(process.env.PORT) || 3000;
httpServer.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
