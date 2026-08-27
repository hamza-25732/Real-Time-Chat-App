import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { createServer, type Server as HttpServer } from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { config } from './config/env.js';
import { createSocketServer } from './sockets/socketServer.js';

/**
 * Process entry point: connect to MongoDB Atlas first, then start listening.
 * The bare `http.Server` is created explicitly so both Express and Socket.IO
 * share a single server and port.
 */
const startServer = async (): Promise<void> => {
  await connectDatabase();

  const httpServer: HttpServer = createServer(createApp());
  const io = createSocketServer(httpServer);

  httpServer.listen(config.port, (): void => {
    console.log(`[http] listening on http://localhost:${config.port} (${config.nodeEnv})`);
    console.log(`[socket] Socket.IO attached at ws://localhost:${config.port}/socket.io/`);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n[http] ${signal} received, shutting down`);

    // `io.close` disconnects every socket and closes the HTTP server it is
    // attached to, so the database is the last thing left to release.
    void io.close().then((): void => {
      void disconnectDatabase()
        .then((): void => process.exit(0))
        .catch((error: unknown): void => {
          console.error('[db] failed to close connection:', error);
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', (): void => shutdown('SIGINT'));
  process.on('SIGTERM', (): void => shutdown('SIGTERM'));
};

startServer().catch((error: unknown): void => {
  console.error('[startup] failed to start server:', error);
  process.exit(1);
});
