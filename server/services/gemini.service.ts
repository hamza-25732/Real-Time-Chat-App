import { GoogleGenerativeAI, type Content } from '@google/generative-ai';

import { config } from '../config/env.js';
import { HttpError } from '../middleware/error.middleware.js';

/** Display name stored on every assistant reply. */
export const BOT_SENDER_NAME = 'Cortex AI';

/** How many earlier turns are replayed to the model for context. */
const CONTEXT_TURN_LIMIT = 20;

const SYSTEM_INSTRUCTION =
  'You are Cortex AI, a concise assistant inside a chat app. ' +
  'Answer in plain text with no markdown formatting. ' +
  'Keep replies under 150 words unless the user asks for more detail.';

/** One earlier turn of the conversation, in the order it was said. */
export interface ConversationTurn {
  content: string;
  isBot: boolean;
}

// Built lazily so the server starts without a key and only fails when the
// assistant is actually used.
let client: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  if (!config.isAiEnabled) {
    throw new HttpError(503, 'The AI assistant is not configured on this server.');
  }

  client ??= new GoogleGenerativeAI(config.geminiApiKey);
  return client;
};

/**
 * Maps stored turns onto Gemini's history format.
 *
 * Gemini requires the history to start with a user turn, so any leading bot
 * messages are dropped rather than sent and rejected.
 */
const toGeminiHistory = (turns: ConversationTurn[]): Content[] => {
  const recent = turns.slice(-CONTEXT_TURN_LIMIT);
  const firstUserIndex = recent.findIndex((turn): boolean => !turn.isBot);

  if (firstUserIndex === -1) {
    return [];
  }

  return recent.slice(firstUserIndex).map(
    (turn): Content => ({
      role: turn.isBot ? 'model' : 'user',
      parts: [{ text: turn.content }],
    }),
  );
};

/**
 * Asks Gemini for a reply to `prompt`, given the earlier turns for context.
 *
 * Network and quota failures surface as an `HttpError` so the socket handler
 * can report something useful to the sender instead of a raw SDK message.
 */
export const generateAssistantReply = async (
  prompt: string,
  history: ConversationTurn[],
): Promise<string> => {
  const model = getClient().getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  try {
    const chat = model.startChat({ history: toGeminiHistory(history) });
    const result = await chat.sendMessage(prompt);
    const text = result.response.text().trim();

    if (text === '') {
      throw new HttpError(502, 'The assistant returned an empty reply.');
    }

    return text;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      throw error;
    }

    console.error('[gemini] request failed:', error);
    throw new HttpError(502, 'The assistant could not answer right now.');
  }
};
