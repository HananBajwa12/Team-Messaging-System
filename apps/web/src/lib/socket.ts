import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token: string) => {
    if (!socket) {
        // Adjust URL for production
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080', {
            auth: {
                token
            }
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
