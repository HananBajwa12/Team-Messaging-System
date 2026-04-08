import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const redisUrl = process.env.UPSTASH_REDIS_URL;

export const pubClient = createClient({ url: redisUrl });
export const subClient = pubClient.duplicate();

export const setupRedis = async () => {
    try {
        if (redisUrl) {
            await pubClient.connect();
            await subClient.connect();
            console.log('Redis connected');
        }
    } catch (e) {
        console.error('Redis connection failed:', e);
    }
};
