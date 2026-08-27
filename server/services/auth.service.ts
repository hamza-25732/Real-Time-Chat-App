import { HttpError } from '../middleware/error.middleware.js';
import { User, type UserDocument } from '../models/user.model.js';
import { signAuthToken } from '../utils/jwt.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';

/** The signed-in user, as `GET /api/auth/me` returns it. Never has a password. */
export interface PublicUser {
  _id: string;
  username: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
}

/** What both auth endpoints return: a session token and who it belongs to. */
export interface AuthResult {
  token: string;
  user: {
    _id: string;
    username: string;
  };
}

const buildAuthResult = (user: UserDocument): AuthResult => ({
  token: signAuthToken(user.id),
  user: {
    _id: user.id,
    username: user.username,
  },
});

/**
 * Looks up the user behind a verified token.
 *
 * `password` is `select: false`, so an ordinary query cannot return it even by
 * accident. A token whose user has since been deleted is treated as invalid.
 */
export const getUserById = async (userId: string): Promise<PublicUser> => {
  const user = await User.findById(userId);

  if (user === null) {
    throw new HttpError(401, 'That account no longer exists');
  }

  return {
    _id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
};

/**
 * Creates an account and returns a session token.
 *
 * The plaintext password is handed straight to the model — the `pre('save')`
 * hook on the user schema is the only place hashing happens.
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const existing = await User.findOne({
    $or: [{ email: input.email }, { username: input.username }],
  });

  if (existing !== null) {
    throw new HttpError(
      409,
      existing.email === input.email
        ? 'That email is already registered'
        : 'That username is taken',
    );
  }

  const user = await User.create({
    email: input.email,
    username: input.username,
    password: input.password,
  });

  return buildAuthResult(user);
};

/**
 * Verifies credentials and returns a session token.
 *
 * `password` is `select: false` on the schema, so it has to be requested
 * explicitly before `comparePassword` can run. A missing user and a wrong
 * password produce the same error, so the response cannot be used to discover
 * which addresses are registered.
 */
export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ email: input.email }).select('+password');

  if (user === null) {
    throw new HttpError(401, 'Email or password is incorrect');
  }

  const isPasswordCorrect = await user.comparePassword(input.password);

  if (!isPasswordCorrect) {
    throw new HttpError(401, 'Email or password is incorrect');
  }

  return buildAuthResult(user);
};
