import { Router } from 'express';

import { getMessages } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

/** Routes under `/api/messages`. URL wiring only — no logic here. */
export const messageRouter: Router = Router();

// Conversation history is private: the socket already requires a session, and
// so does reading what was said before you connected.
messageRouter.get('/', requireAuth, getMessages);

export default messageRouter;
