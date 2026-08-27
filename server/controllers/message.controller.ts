import type { RequestHandler } from 'express';

import { HttpError } from '../middleware/error.middleware.js';
import { listRecentMessages, MESSAGE_HISTORY_LIMIT } from '../services/message.service.js';
import { parseConversationMode, resolveConversationId } from '../utils/conversation.js';

/**
 * GET /api/messages?conversationId=global|ai — recent messages, oldest first.
 *
 * The query names a mode, not a stored id: `ai` resolves against the
 * authenticated caller, so a user can only ever read their own assistant
 * thread. Errors are forwarded to the central error middleware.
 */
export const getMessages: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const authenticated = request.user;

    if (authenticated === undefined) {
      throw new HttpError(401, 'Authentication required');
    }

    const rawMode = request.query.conversationId ?? 'global';
    const mode = parseConversationMode(rawMode);

    if (mode === null) {
      throw new HttpError(400, '"conversationId" must be "global" or "ai"');
    }

    const conversationId = resolveConversationId(mode, authenticated._id);
    const messages = await listRecentMessages(conversationId);

    response.status(200).json({ messages, conversationId, limit: MESSAGE_HISTORY_LIMIT });
  } catch (error: unknown) {
    next(error);
  }
};
