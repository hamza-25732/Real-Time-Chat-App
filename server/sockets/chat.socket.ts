import { createMessage } from '../services/message.service.js';
import { parseChatMessagePayload } from '../validators/chatMessage.validator.js';

import { SOCKET_EVENTS, type ChatServer, type ChatSocket } from './socketEvents.js';

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
        // client cannot choose who it posts as.
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

        // Persist first: a message that failed to save must not appear in
        // anyone's window, or history and live view disagree on reload.
        const broadcast = await createMessage({
          senderId: sender._id,
          senderName: sender.username,
          content: parsed.value.content,
          socketId: socket.id,
        });

        // Fan out to every connected client, the sender included, so all
        // clients render the same stored message.
        io.emit(SOCKET_EVENTS.MESSAGE_BROADCAST, broadcast);

        console.log(`[socket] ${socket.id} ${broadcast.senderName}: ${broadcast.content}`);
      } catch (error: unknown) {
        console.error(`[socket] failed to handle ${SOCKET_EVENTS.MESSAGE_SEND}:`, error);
        socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
          event: SOCKET_EVENTS.MESSAGE_SEND,
          message: 'Could not save your message. Try again.',
        });
      }
    })();
  });
};
