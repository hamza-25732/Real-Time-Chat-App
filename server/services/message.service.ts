import {
  GLOBAL_CONVERSATION_ID,
  Message,
  type MessageDocument,
} from '../models/message.model.js';
import type { ChatMessageBroadcast } from '../sockets/socketEvents.js';

/** How many messages `GET /api/messages` returns. */
export const MESSAGE_HISTORY_LIMIT = 50;

export interface CreateMessageInput {
  senderId: string;
  senderName: string;
  content: string;
  socketId: string;
  conversationId?: string;
}

/**
 * Maps a stored message onto the wire shape shared by REST and Socket.IO, so a
 * message looks identical whether it arrives live or as history.
 */
export const toChatMessage = (document: MessageDocument): ChatMessageBroadcast => ({
  id: document.id,
  socketId: document.socketId,
  senderName: document.senderName,
  content: document.content,
  sentAt: document.createdAt.toISOString(),
});

/** Persists one message and returns it in wire shape. */
export const createMessage = async (input: CreateMessageInput): Promise<ChatMessageBroadcast> => {
  const created = await Message.create({
    conversationId: input.conversationId ?? GLOBAL_CONVERSATION_ID,
    senderId: input.senderId,
    senderName: input.senderName,
    content: input.content,
    socketId: input.socketId,
  });

  return toChatMessage(created);
};

/**
 * Returns the most recent messages in chronological order.
 *
 * The query sorts newest-first so the index does the limiting, then the page is
 * reversed in memory — reading oldest-first would scan the whole conversation.
 */
export const listRecentMessages = async (
  limit: number = MESSAGE_HISTORY_LIMIT,
  conversationId: string = GLOBAL_CONVERSATION_ID,
): Promise<ChatMessageBroadcast[]> => {
  const documents = await Message.find({ conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit);

  return documents.reverse().map(toChatMessage);
};
