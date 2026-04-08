import { Server, Socket } from 'socket.io';
import { supabase } from './supabase';

export const setupSockets = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const userId = socket.data.user?.sub;
        console.log(`User connected: ${userId} (${socket.id})`);

        // Mark user online
        if (userId) {
            socket.join(`user:${userId}`);
            io.emit('user_online', { userId });
        }

        socket.on('join_channel', (data: { channelId: string }) => {
            socket.join(`channel:${data.channelId}`);
            console.log(`User ${userId} joined channel ${data.channelId}`);
        });

        socket.on('leave_channel', (data: { channelId: string }) => {
            socket.leave(`channel:${data.channelId}`);
            console.log(`User ${userId} left channel ${data.channelId}`);
        });

        socket.on('typing_start', (data: { channelId: string }) => {
            socket.to(`channel:${data.channelId}`).emit('typing_start', { userId, channelId: data.channelId });
        });

        socket.on('typing_stop', (data: { channelId: string }) => {
            socket.to(`channel:${data.channelId}`).emit('typing_stop', { userId, channelId: data.channelId });
        });

        socket.on('send_message', async (data: { channelId: string, content: string, parentId?: string }) => {
            // Optimistic broadcast to other users
            // In a real scenario, you could also broadcast immediately, but writing to DB first ensures consistency
            try {
                const { data: dbMessage, error } = await supabase
                    .from('messages')
                    .insert({
                        channel_id: data.channelId,
                        content: data.content,
                        parent_id: data.parentId,
                        sender_id: userId
                    })
                    .select('*, profiles(id, full_name, avatar_url)')
                    .single();

                if (error) throw error;

                // Broadcast to the channel room
                io.to(`channel:${data.channelId}`).emit('message_received', dbMessage);
            } catch (err) {
                console.error('Error sending message:', err);
                // Optionally emit an error event back to sender
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId} (${socket.id})`);
            if (userId) {
                io.emit('user_offline', { userId });
            }
        });
    });
};
