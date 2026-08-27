import bcrypt from 'bcrypt';
import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { config } from '../config/env.js';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 8;

/** Shape of a user document as stored in the `users` collection. */
export interface User {
  username: string;
  email: string;
  /**
   * Bcrypt hash of the user's password — never the plaintext.
   * Excluded from query results by default (`select: false`); a login flow must
   * opt in with `.select('+password')` before calling `comparePassword`.
   */
  password: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  /** Timing-safe comparison of a plaintext candidate against the stored hash. */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<User, UserMethods>;

type UserModelDefinition = Model<User, Record<string, never>, UserMethods>;

const userSchema = new Schema<User, UserModelDefinition, UserMethods>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters`],
      maxlength: [USERNAME_MAX_LENGTH, `Username must be at most ${USERNAME_MAX_LENGTH} characters`],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is not valid'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`],
      select: false,
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeenAt: {
      type: Date,
      default: (): Date => new Date(),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_document, plainObject): Record<string, unknown> => {
        // Mongoose types `plainObject` as the document shape; widen it to an
        // index signature so the sensitive fields can be stripped.
        const serialized = plainObject as Record<string, unknown>;
        delete serialized.password;
        delete serialized.__v;
        return serialized;
      },
    },
  },
);

/**
 * Hashes the password whenever it is set or changed, so no caller can persist
 * plaintext even by mistake. `isModified` keeps unrelated saves from re-hashing
 * an already-hashed value.
 */
userSchema.pre('save', async function hashPasswordBeforeSave(): Promise<void> {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
});

userSchema.method(
  'comparePassword',
  async function comparePassword(this: UserDocument, candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  },
);

export const User = model<User, UserModelDefinition>('User', userSchema);

export default User;
