import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
export async function connectDB() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onekeyrelease';
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            process.exit(0);
        });
    }
    catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}
export async function disconnectDB() {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB disconnected');
    }
    catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
}
