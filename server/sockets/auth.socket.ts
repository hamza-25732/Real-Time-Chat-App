import { User } from '../models/user.model.js';
import type { AuthenticatedSocketUser } from '../types/auth.types.js';
import { verifyAuthToken } from '../utils/jwt.js';

import type { ChatServer, ChatSocket } from './socketEvents.js';

/** Reads `socket.handshake.auth.token` without trusting its type. */
const readHandshakeToken = (socket: ChatSocket): string | null => {
  const { token } = socket.handshake.auth;

  return typeof token === 'string' && token.trim() !== '' ? token.trim() : null;
};

/**
 * Handshake gate for the whole namespace.
 *
 * A connection is only established once its token verifies and the user still
 * exists; the resolved identity is stashed on `socket.data.user`, which is the
 * single source of truth for who a socket belongs to. Everything after this
 * point can assume an authenticated sender.
 */
export const registerSocketAuth = (io: ChatServer): void => {
  io.use((socket, next): void => {
    void (async (): Promise<void> => {
      try {
        const token = readHandshakeToken(socket);

        if (token === null) {
          next(new Error('Authentication required'));
          return;
        }

        const claims = verifyAuthToken(token);

        if (claims === null) {
          next(new Error('Invalid or expired token'));
          return;
        }

        // The username is read from the database, not the token, so a renamed
        // or deleted account is reflected on the next connection.
        const user = await User.findById(claims.sub);

        if (user === null) {
          next(new Error('That account no longer exists'));
          return;
        }

        const authenticated: AuthenticatedSocketUser = {
          _id: user.id,
          username: user.username,
        };

        socket.data.user = authenticated;
        next();
      } catch (error: unknown) {
        console.error('[socket] handshake failed:', error);
        next(new Error('Could not verify your session'));
      }
    })();
  });
};
