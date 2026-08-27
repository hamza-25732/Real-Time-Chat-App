import type { Socket } from 'socket.io-client';

/**
 * Client-side mirror of `server/sockets/socketEvents.ts`.
 *
 * The two files are one contract: when an event name or payload changes on the
 * server, change it here in the same edit or the listener goes silently dead.
 */
export const SOCKET_EVENTS = {
  /** Client -> server: this user sends a chat message. */
  MESSAGE_SEND: 'message:send',
  /** Server -> all clients: an accepted message, fanned out to everyone. */
  MESSAGE_BROADCAST: 'message:broadcast',
  /** Server -> this client: the last event it sent could not be handled. */
  SOCKET_ERROR: 'socket:error',
} as const;

/** The two chat modes. Mirrors `server/utils/conversation.ts`. */
export const CONVERSATION_MODES = ['global', 'ai'] as const;

export type ConversationMode = (typeof CONVERSATION_MODES)[number];

/**
 * Payload this client sends with `message:send`.
 *
 * The server takes the sender's identity from the authenticated handshake, so
 * there is nothing here to spoof. `conversationId` is a mode name, not a raw
 * id — the server resolves 'ai' against the signed-in user.
 */
export interface ChatMessagePayload {
  content: string;
  conversationId: ConversationMode;
}

/** What the server fans back out — the content plus server-owned metadata. */
export interface ChatMessageBroadcast {
  id: string;
  /** Resolved conversation, e.g. 'global' or 'ai_<userId>'. */
  conversationId: string;
  socketId: string;
  senderName: string;
  content: string;
  /** True for an assistant reply, which renders differently. */
  isBot: boolean;
  sentAt: string;
}

/** Payload of a `socket:error` event. */
export interface SocketErrorPayload {
  event: string;
  message: string;
}

export interface ServerToClientEvents {
  'message:broadcast': (payload: ChatMessageBroadcast) => void;
  'socket:error': (payload: SocketErrorPayload) => void;
}

export interface ClientToServerEvents {
  'message:send': (payload: ChatMessagePayload) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Connection lifecycle as a closed set of modes, not a bag of booleans. */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
