/**
 * The two chat modes a client may ask for.
 *
 * A client never sends a raw conversation id: it names a mode, and the server
 * resolves it against the authenticated user. That is what stops one user
 * reading another user's private assistant history.
 */
export const CONVERSATION_MODES = ['global', 'ai'] as const;

export type ConversationMode = (typeof CONVERSATION_MODES)[number];

/** Conversation key for the public room. */
export const GLOBAL_CONVERSATION = 'global';

/** Narrows an untrusted value to a known mode. */
export const parseConversationMode = (value: unknown): ConversationMode | null =>
  typeof value === 'string' && CONVERSATION_MODES.includes(value as ConversationMode)
    ? (value as ConversationMode)
    : null;

/**
 * Turns a mode into the stored conversation id.
 *
 * `ai` becomes a per-user key, so every user's assistant thread is a separate
 * conversation that only they can address.
 */
export const resolveConversationId = (mode: ConversationMode, userId: string): string =>
  mode === 'global' ? GLOBAL_CONVERSATION : `ai_${userId}`;
