import mongoose from 'mongoose';

import { config } from './env.js';

/**
 * Opens the single shared Mongoose connection to MongoDB Atlas.
 * Called once from the process entry point before the HTTP server starts
 * listening, so the app never accepts traffic it cannot serve.
 */
export const connectDatabase = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', (): void => {
    console.log(`[db] connected to ${mongoose.connection.name}`);
  });

  mongoose.connection.on('disconnected', (): void => {
    console.warn('[db] disconnected');
  });

  mongoose.connection.on('error', (error: unknown): void => {
    console.error('[db] connection error:', error);
  });

  await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 10_000,
  });
};

/** Closes the connection during graceful shutdown. */
export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
};
