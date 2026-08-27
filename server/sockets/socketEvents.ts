import type { Server, Socket } from 'socket.io';

import type { AuthenticatedSocketUser } from '../types/auth.types.js';

/**
 * The socket contract, in one place. Client and server both import these names
 * instead of writing string literals, so a rename is a compile error rather
 * than a silently dead listener.
 */
export const SOCKET_EVENTS = {
  /** Client -> server: a user sends a chat message. */
  MESSAGE_SEND: 'message:send',
  /** Server -> all clients: an accepted message, fanned out to everyone. */
  MESSAGE_BROADCAST: 'message:broadcast',
  /** Server -> one client: the last event it sent could not be handled. */
  SOCKET_ERROR: 'socket:error',
} as const;

/**
 * Payload a client sends with `message:send`.
 *
 * Content only: the sender's identity comes from the verified handshake, never
 * from the wire, so a client cannot post as someone else.
 */
export interface ChatMessagePayload {
  content: string;
}

/** What the server fans back out — the content plus server-owned metadata. */
export interface ChatMessageBroadcast {
  id: string;
  socketId: string;
  senderName: string;
  content: string;
  sentAt: string;
}

/** Payload of a `socket:error` event. */
export interface SocketErrorPayload {
  event: string;
  message: string;
}

export interface ClientToServerEvents {
  'message:send': (payload: unknown) => void;
}

export interface ServerToClientEvents {
  'message:broadcast': (payload: ChatMessageBroadcast) => void;
  'socket:error': (payload: SocketErrorPayload) => void;
}

/** Per-connection server state, populated by the handshake middleware. */
export interface SocketData {
  user: AuthenticatedSocketUser;
}

export interface InterServerEvents {
  ping: () => void;
}

export type ChatServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type ChatSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
