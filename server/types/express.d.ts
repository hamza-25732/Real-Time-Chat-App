import type { AuthenticatedUser } from './auth.types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Set by `requireAuth`. Present only on routes behind that middleware —
       * everywhere else it is `undefined`.
       */
      user?: AuthenticatedUser;
    }
  }
}

export {};
