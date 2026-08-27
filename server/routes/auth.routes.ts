import { Router } from 'express';

import { getMe, login, register } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

/** Routes under `/api/auth`. URL wiring only — no logic here. */
export const authRouter: Router = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, getMe);

export default authRouter;
