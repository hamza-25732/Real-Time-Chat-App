import { MESSAGE_MAX_LENGTH } from '../models/message.model.js';
import type { ChatMessagePayload } from '../sockets/socketEvents.js';

/** Result of parsing untrusted input — narrow on `ok` before using `value`. */
export type ParseResult<TValue> =
  | { ok: true; value: TValue }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readTrimmedString = (
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
): ParseResult<string> => {
  const rawValue = source[key];

  if (typeof rawValue !== 'string') {
    return { ok: false, error: `"${key}" must be a string` };
  }

  const trimmed = rawValue.trim();

  if (trimmed === '') {
    return { ok: false, error: `"${key}" must not be empty` };
  }

  if (trimmed.length > maxLength) {
    return { ok: false, error: `"${key}" must be at most ${maxLength} characters` };
  }

  return { ok: true, value: trimmed };
};

/**
 * Parses an untrusted `message:send` payload off the wire. Socket payloads are
 * arbitrary JSON from the client, so nothing downstream sees them until they
 * have been narrowed here.
 */
export const parseChatMessagePayload = (rawPayload: unknown): ParseResult<ChatMessagePayload> => {
  if (!isRecord(rawPayload)) {
    return { ok: false, error: 'Payload must be an object' };
  }

  const content = readTrimmedString(rawPayload, 'content', MESSAGE_MAX_LENGTH);

  if (!content.ok) {
    return content;
  }

  return { ok: true, value: { content: content.value } };
};
