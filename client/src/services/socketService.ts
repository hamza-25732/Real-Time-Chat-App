import { io } from 'socket.io-client';

import type { ChatSocket } from '../types/socketEvents';

import { SERVER_URL } from './apiConfig';

/**
 * Creates the app's Socket.IO connection.
 *
 * The session token travels in the handshake, where the server's `io.use`
 * gate verifies it before the connection is established.
 *
 * `autoConnect` is off so the provider decides when to open and close it —
 * without that, the socket would connect at import time and outlive React's
 * lifecycle. Call this once, from `SocketProvider`; never from a component.
 */
export const createChatSocket = (token: string): ChatSocket =>
  io(SERVER_URL, {
    auth: { token },
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
