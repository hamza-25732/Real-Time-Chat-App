import type { Request, RequestHandler } from 'express';

import type { AuthenticatedUser } from '../types/auth.types.js';
import { verifyAuthToken } from '../utils/jwt.js';

import { HttpError } from './error.middleware.js';

const BEARER_PREFIX = 'Bearer ';

/**
 * Pulls the raw token out of an `Authorization: Bearer <token>` header.
 * Returns `null` for a missing or malformed header rather than throwing, so
 * the caller decides what a missing token means.
 */
export const readBearerToken = (request: Request): string | null => {
  const header = request.headers.authorization;

  if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  return token === '' ? null : token;
};

/**
 * Gate for routes that need a signed-in caller.
 *
 * Verifies the bearer token and attaches `{ _id }` to `req.user`. Nothing
 * downstream has to re-check the token — if the handler runs, the caller is
 * authenticated.
 */
export const requireAuth: RequestHandler = (request, _response, next): void => {
  const token = readBearerToken(request);

  if (token === null) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  const claims = verifyAuthToken(token);

  if (claims === null) {
    next(new HttpError(401, 'Your session has expired. Sign in again.'));
    return;
  }

  const user: AuthenticatedUser = { _id: claims.sub };
  request.user = user;
  next();
};
