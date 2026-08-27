import { Message, type MessageDocument } from '../models/message.model.js';
import type { ChatMessageBroadcast } from '../sockets/socketEvents.js';
import { GLOBAL_CONVERSATION } from '../utils/conversation.js';

import type { ConversationTurn } from './gemini.service.js';

/** How many messages `GET /api/messages` returns. */
export const MESSAGE_HISTORY_LIMIT = 50;

export interface CreateMessageInput {
  conversationId: string;
  /** The author, or `null` for an assistant reply. */
  senderId: string | null;
  senderName: string;
  content: string;
  socketId: string;
  isBot?: boolean;
}

/**
 * Maps a stored message onto the wire shape shared by REST and Socket.IO, so a
 * message looks identical whether it arrives live or as history.
 */
export const toChatMessage = (document: MessageDocument): ChatMessageBroadcast => ({
  id: document.id,
  conversationId: document.conversationId,
  socketId: document.socketId,
  senderName: document.senderName,
  content: document.content,
  isBot: document.isBot,
  sentAt: document.createdAt.toISOString(),
});

/** Persists one message and returns it in wire shape. */
export const createMessage = async (input: CreateMessageInput): Promise<ChatMessageBroadcast> => {
  const created = await Message.create({
    conversationId: input.conversationId,
    senderId: input.senderId,
    senderName: input.senderName,
    content: input.content,
    socketId: input.socketId,
    isBot: input.isBot ?? false,
  });

  return toChatMessage(created);
};

/**
 * Returns the most recent messages of one conversation, oldest first.
 *
 * The query sorts newest-first so the index does the limiting, then the page is
 * reversed in memory — reading oldest-first would scan the whole conversation.
 */
export const listRecentMessages = async (
  conversationId: string = GLOBAL_CONVERSATION,
  limit: number = MESSAGE_HISTORY_LIMIT,
): Promise<ChatMessageBroadcast[]> => {
  const documents = await Message.find({ conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit);

  return documents.reverse().map(toChatMessage);
};

/**
 * Recent turns of one conversation, oldest first, for replaying as model
 * context. Reads the same index as the history endpoint.
 */
export const listConversationTurns = async (
  conversationId: string,
  limit: number,
): Promise<ConversationTurn[]> => {
  const documents = await Message.find({ conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('content isBot');

  return documents
    .reverse()
    .map((document): ConversationTurn => ({ content: document.content, isBot: document.isBot }));
};
