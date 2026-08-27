import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import mongoose from 'mongoose';

import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { authRouter } from './routes/auth.routes.js';
import { messageRouter } from './routes/message.routes.js';
import { corsOptions } from './utils/cors.js';

/**
 * Builds the Express application: middleware, routes, error handling.
 * Kept free of `listen` and database calls so it can be imported by tests and
 * wrapped by the HTTP server that Socket.IO will later attach to.
 */
export const createApp = (): Express => {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_request: Request, response: Response): void => {
    const isDatabaseConnected = mongoose.connection.readyState === 1;

    response.status(isDatabaseConnected ? 200 : 503).json({
      status: isDatabaseConnected ? 'ok' : 'degraded',
      database: isDatabaseConnected ? 'connected' : 'disconnected',
      environment: config.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  // Nothing under /api may be served from a cache. Chat history and session
  // data change constantly, and a stale hit renders the wrong conversation.
  app.use('/api', (_request: Request, response: Response, next: NextFunction): void => {
    response.set('Cache-Control', 'no-store');
    next();
  });

  app.use('/api/auth', authRouter);
  app.use('/api/messages', messageRouter);

  // Further feature routers mount here: /api/conversations, /api/users, ...

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
