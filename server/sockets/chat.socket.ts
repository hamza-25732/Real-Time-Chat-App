import { BOT_SENDER_NAME, generateAssistantReply } from '../services/gemini.service.js';
import {
  createMessage,
  listConversationTurns,
} from '../services/message.service.js';
import type { AuthenticatedSocketUser } from '../types/auth.types.js';
import { resolveConversationId, type ConversationMode } from '../utils/conversation.js';
import { parseChatMessagePayload } from '../validators/chatMessage.validator.js';

import { SOCKET_EVENTS, type ChatServer, type ChatSocket } from './socketEvents.js';

/** Earlier turns replayed to the model so the assistant follows the thread. */
const AI_CONTEXT_LIMIT = 20;

/**
 * Public room: everyone connected sees the message, the sender included, so
 * every client renders the same stored copy.
 */
const handleGlobalMessage = async (
  io: ChatServer,
  socket: ChatSocket,
  sender: AuthenticatedSocketUser,
  content: string,
): Promise<void> => {
  const stored = await createMessage({
    conversationId: resolveConversationId('global', sender._id),
    senderId: sender._id,
    senderName: sender.username,
    content,
    socketId: socket.id,
  });

  io.emit(SOCKET_EVENTS.MESSAGE_BROADCAST, stored);
  console.log(`[socket] global ${sender.username}: ${content}`);
};

/**
 * Private assistant thread: the user's message and the model's reply are both
 * stored under `ai_<userId>` and echoed back to this socket only. Nothing here
 * ever reaches `io.emit`.
 */
const handleAssistantMessage = async (
  socket: ChatSocket,
  sender: AuthenticatedSocketUser,
  content: string,
): Promise<void> => {
  const conversationId = resolveConversationId('ai', sender._id);

  // Context is read before the new message is stored, so the prompt is not
  // duplicated as both history and prompt.
  const history = await listConversationTurns(conversationId, AI_CONTEXT_LIMIT);

  const stored = await createMessage({
    conversationId,
    senderId: sender._id,
    senderName: sender.username,
    content,
    socketId: socket.id,
  });

  socket.emit(SOCKET_EVENTS.MESSAGE_BROADCAST, stored);

  const reply = await generateAssistantReply(content, history);

  const storedReply = await createMessage({
    conversationId,
    senderId: null,
    senderName: BOT_SENDER_NAME,
    content: reply,
    socketId: socket.id,
    isBot: true,
  });

  socket.emit(SOCKET_EVENTS.MESSAGE_BROADCAST, storedReply);
  console.log(`[socket] ai ${sender.username}: ${content.slice(0, 60)}`);
};

const HANDLERS: Record<
  ConversationMode,
  (io: ChatServer, socket: ChatSocket, sender: AuthenticatedSocketUser, content: string) => Promise<void>
> = {
  global: handleGlobalMessage,
  ai: (_io, socket, sender, content): Promise<void> =>
    handleAssistantMessage(socket, sender, content),
};

/**
 * Registers the chat listeners for one connected socket: `message:send` in,
 * `message:broadcast` out.
 *
 * Called once per connection, after the handshake middleware has authenticated
 * it. Handlers never throw into Socket.IO's void callback: failures are caught
 * and reported back to the sender as a typed `socket:error` event instead of
 * being swallowed.
 */
export const registerChatHandlers = (io: ChatServer, socket: ChatSocket): void => {
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, (rawPayload: unknown): void => {
    void (async (): Promise<void> => {
      try {
        // Identity comes from the handshake, never from the payload — the
        // client cannot choose who it posts as, nor whose assistant it reads.
        const sender = socket.data.user;

        if (sender === undefined) {
          socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
            event: SOCKET_EVENTS.MESSAGE_SEND,
            message: 'Your session is no longer valid. Sign in again.',
          });
          socket.disconnect(true);
          return;
        }

        const parsed = parseChatMessagePayload(rawPayload);

        if (!parsed.ok) {
          console.warn(
            `[socket] rejected ${SOCKET_EVENTS.MESSAGE_SEND} from ${socket.id}: ${parsed.error}`,
          );
          socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
            event: SOCKET_EVENTS.MESSAGE_SEND,
            message: parsed.error,
          });
          return;
        }

        await HANDLERS[parsed.value.conversationId](io, socket, sender, parsed.value.content);
      } catch (error: unknown) {
        console.error(`[socket] failed to handle ${SOCKET_EVENTS.MESSAGE_SEND}:`, error);
        socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
          event: SOCKET_EVENTS.MESSAGE_SEND,
          // The assistant path attaches a usable message to its errors; other
          // failures fall back to something generic.
          message:
            error instanceof Error && error.name === 'HttpError'
              ? error.message
              : 'Could not send your message. Try again.',
        });
      }
    })();
  });
};
