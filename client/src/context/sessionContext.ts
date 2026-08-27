import { createContext } from 'react';

import type { AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while a stored token is being checked against `/api/auth/me`. */
  isRestoringSession: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

/**
 * `null` means "no provider above you", which `useAuth` turns into a thrown
 * error rather than a confusing runtime crash.
 *
 * Kept out of `AuthContext.tsx` so that file exports only a component and
 * stays eligible for React Fast Refresh.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
