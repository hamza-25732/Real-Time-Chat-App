import type {
  AuthResponse,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth';

import { SERVER_URL } from './apiConfig';

/**
 * A failed auth request, carrying the server's own message so the form can
 * show it verbatim — "That email is already registered" is more useful than a
 * generic failure.
 */
export class AuthRequestError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthRequestError';
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Pulls the API's `{ error, message }` shape out of a failed response. */
const readErrorMessage = (body: unknown, status: number): string => {
  if (isRecord(body) && typeof body.message === 'string' && body.message !== '') {
    return body.message;
  }

  return `Request failed with status ${status}`;
};

const parseAuthResponse = (body: unknown): AuthResponse => {
  if (!isRecord(body) || typeof body.token !== 'string' || !isRecord(body.user)) {
    throw new AuthRequestError(500, 'The server returned an unexpected response.');
  }

  const { _id, username } = body.user;

  if (typeof _id !== 'string' || typeof username !== 'string') {
    throw new AuthRequestError(500, 'The server returned an unexpected user.');
  }

  return { token: body.token, user: { _id, username } };
};

const postAuth = async (path: string, payload: unknown): Promise<AuthResponse> => {
  let response: Response;

  try {
    response = await fetch(`${SERVER_URL}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // fetch only rejects when the request never reached the server.
    throw new AuthRequestError(0, 'Could not reach the server. Is it running?');
  }

  const body: unknown = await response.json().catch((): null => null);

  if (!response.ok) {
    throw new AuthRequestError(response.status, readErrorMessage(body, response.status));
  }

  return parseAuthResponse(body);
};

export const registerRequest = async (
  credentials: RegisterCredentials,
): Promise<AuthResponse> => postAuth('register', credentials);

export const loginRequest = async (credentials: LoginCredentials): Promise<AuthResponse> =>
  postAuth('login', credentials);

/**
 * Confirms a stored token is still good and returns who it belongs to.
 *
 * The server is the authority: a token that fails here means the session is
 * over, whatever `localStorage` still holds.
 */
export const fetchCurrentUser = async (
  token: string,
  signal: AbortSignal,
): Promise<AuthUser> => {
  let response: Response;

  try {
    response = await fetch(`${SERVER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
  } catch (cause: unknown) {
    // An aborted request is the caller unmounting, not a rejected session.
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause;
    }

    throw new AuthRequestError(0, 'Could not reach the server. Is it running?');
  }

  const body: unknown = await response.json().catch((): null => null);

  if (!response.ok) {
    throw new AuthRequestError(response.status, readErrorMessage(body, response.status));
  }

  if (!isRecord(body) || !isRecord(body.user)) {
    throw new AuthRequestError(500, 'The server returned an unexpected response.');
  }

  const { _id, username } = body.user;

  if (typeof _id !== 'string' || typeof username !== 'string') {
    throw new AuthRequestError(500, 'The server returned an unexpected user.');
  }

  return { _id, username };
};
