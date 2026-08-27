import jwt, { type SignOptions } from 'jsonwebtoken';

import { config } from '../config/env.js';

/** Claims carried by a session token. `sub` is the user's `_id`. */
export interface AuthTokenPayload {
  sub: string;
}

/** Signs a session token for a user id. */
export const signAuthToken = (userId: string): string => {
  // `expiresIn` is a template-literal type in @types/jsonwebtoken; the value
  // comes from the environment as a plain string, so it is asserted here.
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>,
  };

  return jwt.sign({ sub: userId }, config.jwtSecret, options);
};

/**
 * Verifies a token and narrows the decoded claims.
 *
 * Returns `null` for anything unusable — expired, tampered with, or carrying a
 * payload that is not the shape we signed — so callers cannot accidentally
 * trust a malformed token.
 */
export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded: unknown = jwt.verify(token, config.jwtSecret);

    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }

    const { sub } = decoded as Record<string, unknown>;

    return typeof sub === 'string' ? { sub } : null;
  } catch {
    return null;
  }
};
