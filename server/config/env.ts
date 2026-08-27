import 'dotenv/config';

/**
 * Typed, validated view of `process.env`.
 *
 * Environment variables are untrusted input: every value is read through one of
 * the helpers below so a missing or malformed value fails loudly at startup
 * rather than surfacing as `undefined` deep inside a request handler.
 */
export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly port: number;
  readonly mongodbUri: string;
  readonly clientOrigin: string;
  /**
   * Every origin allowed to call the API: the deployed frontend plus the local
   * dev servers. Frontend and backend live on different hosts in production,
   * so this is what makes the split deployment work.
   */
  readonly allowedOrigins: readonly string[];
  readonly bcryptSaltRounds: number;
  /** Signing key for session tokens. Never leaves the server. */
  readonly jwtSecret: string;
  /** Token lifetime in a form `jsonwebtoken` accepts, e.g. `7d` or `12h`. */
  readonly jwtExpiresIn: string;
  /** Gemini credentials. Empty when the AI assistant is not configured. */
  readonly geminiApiKey: string;
  readonly geminiModel: string;
  /** False when `GEMINI_API_KEY` is absent — AI mode reports itself as off. */
  readonly isAiEnabled: boolean;
  readonly isProduction: boolean;
}

const readRequired = (key: string): string => {
  const rawValue = process.env[key];

  if (rawValue === undefined || rawValue.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}. Copy server/.env.example to server/.env and fill it in.`,
    );
  }

  return rawValue.trim();
};

const readOptional = (key: string, fallback: string): string => {
  const rawValue = process.env[key];
  return rawValue === undefined || rawValue.trim() === '' ? fallback : rawValue.trim();
};

const readNumber = (key: string, fallback: number): number => {
  const parsedValue = Number(readOptional(key, String(fallback)));

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer.`);
  }

  return parsedValue;
};

const readNodeEnv = (): AppConfig['nodeEnv'] => {
  const rawValue = readOptional('NODE_ENV', 'development');

  if (rawValue !== 'development' && rawValue !== 'test' && rawValue !== 'production') {
    throw new Error(`NODE_ENV must be one of: development, test, production. Received: ${rawValue}`);
  }

  return rawValue;
};

/** Origins that are always allowed, so local development needs no config. */
const LOCAL_ORIGINS: readonly string[] = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

/**
 * Builds the allowlist from `CLIENT_ORIGIN`, which may hold several
 * comma-separated origins (e.g. a GitHub Pages URL and a custom domain).
 * Trailing slashes are stripped because browsers never send one in `Origin`.
 */
const readAllowedOrigins = (clientOrigin: string): readonly string[] => {
  const configured = clientOrigin
    .split(',')
    .map((origin): string => origin.trim().replace(/\/+$/, ''))
    .filter((origin): boolean => origin !== '');

  return [...new Set([...configured, ...LOCAL_ORIGINS])];
};

const nodeEnv = readNodeEnv();
const clientOrigin = readOptional('CLIENT_ORIGIN', 'http://localhost:5173');
// Optional on purpose: a missing key disables the assistant rather than
// stopping the server, so global chat keeps working without one.
const geminiApiKey = readOptional('GEMINI_API_KEY', '');

export const config: AppConfig = {
  nodeEnv,
  port: readNumber('PORT', 5000),
  mongodbUri: readRequired('MONGODB_URI'),
  clientOrigin,
  allowedOrigins: readAllowedOrigins(clientOrigin),
  bcryptSaltRounds: readNumber('BCRYPT_SALT_ROUNDS', 12),
  jwtSecret: readRequired('JWT_SECRET'),
  jwtExpiresIn: readOptional('JWT_EXPIRES_IN', '7d'),
  geminiApiKey,
  geminiModel: readOptional('GEMINI_MODEL', 'gemini-3.6-flash'),
  isAiEnabled: geminiApiKey !== '',
  isProduction: nodeEnv === 'production',
};
