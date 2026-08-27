import type { ChatMessageBroadcast, ConversationMode } from '../types/socketEvents';

import { SERVER_URL } from './apiConfig';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Narrows one entry of the history response. An HTTP body is untrusted input
 * like any other, so a malformed row is dropped rather than rendered.
 */
const parseMessage = (raw: unknown): ChatMessageBroadcast | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const { id, conversationId, socketId, senderName, content, isBot, sentAt } = raw;

  if (
    typeof id !== 'string' ||
    typeof conversationId !== 'string' ||
    typeof socketId !== 'string' ||
    typeof senderName !== 'string' ||
    typeof content !== 'string' ||
    typeof sentAt !== 'string'
  ) {
    return null;
  }

  return { id, conversationId, socketId, senderName, content, isBot: isBot === true, sentAt };
};

/**
 * Loads recent history over REST — history is standard CRUD, so it does not go
 * over the socket.
 *
 * The route is behind `requireAuth`, so the session token travels in the
 * `Authorization` header. Pass the signal of an `AbortController` owned by the
 * caller so an unmount cancels the request in flight.
 */
export const fetchRecentMessages = async (
  token: string,
  mode: ConversationMode,
  signal: AbortSignal,
): Promise<ChatMessageBroadcast[]> => {
  const response = await fetch(`${SERVER_URL}/api/messages?conversationId=${mode}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(`History request failed with status ${response.status}`);
  }

  const body: unknown = await response.json();

  if (!isRecord(body) || !Array.isArray(body.messages)) {
    throw new Error('History response was not in the expected shape');
  }

  return body.messages
    .map(parseMessage)
    .filter((message): message is ChatMessageBroadcast => message !== null);
};
