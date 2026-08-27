import type { CorsOptions } from 'cors';

import { config } from '../config/env.js';

/**
 * Shared CORS policy for the REST API and the Socket.IO handshake, so the two
 * can never drift apart on which frontends are allowed to talk to us.
 *
 * A request with no `Origin` (curl, Postman, server-to-server, Render's health
 * probe) is allowed: the header is only sent by browsers, and every private
 * route is behind a bearer token regardless of origin.
 */
export const isOriginAllowed = (origin: string | undefined): boolean =>
  origin === undefined || config.allowedOrigins.includes(origin.replace(/\/+$/, ''));

export const corsOptions: CorsOptions = {
  origin: (origin, callback): void => {
    // A disallowed origin is answered without the `Access-Control-Allow-Origin`
    // header, which is what makes the browser block it. Passing an Error here
    // instead would surface an unknown caller as a 500 from our own API.
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
};
