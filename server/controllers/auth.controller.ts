import type { RequestHandler } from 'express';

import { HttpError } from '../middleware/error.middleware.js';
import { getUserById, loginUser, registerUser } from '../services/auth.service.js';
import { parseLoginInput, parseRegisterInput } from '../validators/auth.validator.js';

/**
 * POST /api/auth/register — create an account and start a session.
 *
 * Validates the body, then hands off to the service; no business logic here.
 */
export const register: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const parsed = parseRegisterInput(request.body);

    if (!parsed.ok) {
      throw new HttpError(400, parsed.error);
    }

    const result = await registerUser(parsed.value);
    response.status(201).json(result);
  } catch (error: unknown) {
    next(error);
  }
};

/** POST /api/auth/login — exchange credentials for a session token. */
export const login: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const parsed = parseLoginInput(request.body);

    if (!parsed.ok) {
      throw new HttpError(400, parsed.error);
    }

    const result = await loginUser(parsed.value);
    response.status(200).json(result);
  } catch (error: unknown) {
    next(error);
  }
};

/**
 * GET /api/auth/me — the caller's own account.
 *
 * `requireAuth` runs first, so `req.user` is set; the check below is a type
 * narrowing, not a second authorisation check.
 */
export const getMe: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const authenticated = request.user;

    if (authenticated === undefined) {
      throw new HttpError(401, 'Authentication required');
    }

    const user = await getUserById(authenticated._id);
    response.status(200).json({ user });
  } catch (error: unknown) {
    next(error);
  }
};
