import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { corsOptions } from '../utils/cors.js';

import { registerSocketAuth } from './auth.socket.js';
import { registerChatHandlers } from './chat.socket.js';
import { type ChatServer, type ChatSocket } from './socketEvents.js';

/**
 * Number of sockets currently in the default namespace.
 *
 * Read from the namespace map rather than `io.engine.clientsCount`: the engine
 * decrements its counter asynchronously, so it still counts a socket that is
 * already gone while a `disconnect` handler runs.
 */
const countOnline = (io: ChatServer): number => io.sockets.sockets.size;

/**
 * Attaches Socket.IO to the existing Express HTTP server — one process, one
 * port, shared with the REST API.
 *
 * The handshake uses the same origin allowlist as the REST API, so a page on
 * an unknown host cannot open a socket even before the token is checked.
 */
export const createSocketServer = (httpServer: HttpServer): ChatServer => {
  const io: ChatServer = new Server(httpServer, {
    cors: corsOptions,
  });

  // Runs before any 'connection' event: an unauthenticated handshake never
  // becomes a connected socket.
  registerSocketAuth(io);

  io.on('connection', (socket: ChatSocket): void => {
    const username = socket.data.user?.username ?? 'unknown';
    console.log(`[socket] connected: ${socket.id} as ${username} (${countOnline(io)} online)`);

    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason: string): void => {
      console.log(`[socket] disconnected: ${socket.id} (${reason}) (${countOnline(io)} online)`);
    });
  });

  return io;
};
