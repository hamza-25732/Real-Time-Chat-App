import {
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../models/user.model.js';

import type { ParseResult } from './chatMessage.validator.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MAX_LENGTH = 200;

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (source: Record<string, unknown>, key: string): ParseResult<string> => {
  const rawValue = source[key];

  if (typeof rawValue !== 'string') {
    return { ok: false, error: `"${key}" must be a string` };
  }

  return { ok: true, value: rawValue };
};

const parseEmail = (source: Record<string, unknown>): ParseResult<string> => {
  const email = readString(source, 'email');

  if (!email.ok) {
    return email;
  }

  const normalized = email.value.trim().toLowerCase();

  if (normalized.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: 'Enter a valid email address' };
  }

  return { ok: true, value: normalized };
};

/**
 * Only checks that a password is present and of a sane length.
 *
 * Deliberately never trims: leading and trailing spaces are legitimate
 * password characters, and trimming here would silently change credentials.
 */
const parsePassword = (source: Record<string, unknown>): ParseResult<string> => {
  const password = readString(source, 'password');

  if (!password.ok) {
    return password;
  }

  if (password.value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }

  if (password.value.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` };
  }

  return { ok: true, value: password.value };
};

const parseUsername = (source: Record<string, unknown>): ParseResult<string> => {
  const username = readString(source, 'username');

  if (!username.ok) {
    return username;
  }

  const trimmed = username.value.trim();

  if (trimmed.length < USERNAME_MIN_LENGTH || trimmed.length > USERNAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`,
    };
  }

  return { ok: true, value: trimmed };
};

/** Parses an untrusted `POST /api/auth/register` body. */
export const parseRegisterInput = (rawBody: unknown): ParseResult<RegisterInput> => {
  if (!isRecord(rawBody)) {
    return { ok: false, error: 'Request body must be an object' };
  }

  const email = parseEmail(rawBody);

  if (!email.ok) {
    return email;
  }

  const username = parseUsername(rawBody);

  if (!username.ok) {
    return username;
  }

  const password = parsePassword(rawBody);

  if (!password.ok) {
    return password;
  }

  return {
    ok: true,
    value: { email: email.value, username: username.value, password: password.value },
  };
};

/** Parses an untrusted `POST /api/auth/login` body. */
export const parseLoginInput = (rawBody: unknown): ParseResult<LoginInput> => {
  if (!isRecord(rawBody)) {
    return { ok: false, error: 'Request body must be an object' };
  }

  const email = parseEmail(rawBody);

  if (!email.ok) {
    return email;
  }

  const password = readString(rawBody, 'password');

  if (!password.ok) {
    return password;
  }

  return { ok: true, value: { email: email.value, password: password.value } };
};
