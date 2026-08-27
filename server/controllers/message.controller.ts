import type { RequestHandler } from 'express';

import { listRecentMessages, MESSAGE_HISTORY_LIMIT } from '../services/message.service.js';

/**
 * GET /api/messages — the most recent messages, oldest first.
 *
 * Errors are forwarded to the central error middleware rather than handled
 * here; the controller only shapes the response.
 */
export const getMessages: RequestHandler = async (_request, response, next): Promise<void> => {
  try {
    const messages = await listRecentMessages();
    response.status(200).json({ messages, limit: MESSAGE_HISTORY_LIMIT });
  } catch (error: unknown) {
    next(error);
  }
};
