import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import dotenv from 'dotenv';
import { pubClient, subClient, setupRedis } from './redis';
import apiRoutes from './routes';
import { setupSockets } from './sockets';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST']
    }
});

// Setup Redis & Socket Adapter
setupRedis().then(() => {
    if (process.env.UPSTASH_REDIS_URL) {
        io.adapter(createAdapter(pubClient, subClient));
    }
});

// Socket Auth Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, process.env.SUPABASE_JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) return next(new Error('Authentication error'));
        socket.data.user = decoded; // Contains sub (user id)
        next();
    });
});

setupSockets(io);

// REST Routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
