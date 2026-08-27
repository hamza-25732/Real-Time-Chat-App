import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';

import { fetchCurrentUser, loginRequest, registerRequest } from '../services/authService';
import type { AuthResponse, AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth';

import { AuthContext, type AuthContextValue } from './sessionContext';

const TOKEN_STORAGE_KEY = 'chat.auth.token';
const USER_STORAGE_KEY = 'chat.auth.user';

const readStoredToken = (): string | null => {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Reads the cached user that goes with the stored token.
 *
 * The token alone cannot be turned back into a user without a `/api/auth/me`
 * endpoint, so the user is cached alongside it. It is a convenience only —
 * the token remains the thing the server actually trusts.
 */
const readStoredUser = (): AuthUser | null => {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const { _id, username } = parsed as Record<string, unknown>;

    return typeof _id === 'string' && typeof username === 'string' ? { _id, username } : null;
  } catch {
    return null;
  }
};

const persistSession = (session: AuthResponse | null): void => {
  try {
    if (session === null) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
  } catch {
    // A browser that refuses storage still gets a working in-memory session.
  }
};

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Holds the session for the whole app.
 *
 * State is seeded straight from `localStorage` by lazy initialisers, so a
 * reload restores the session on the first render with no signed-out flash.
 */
export const AuthProvider = ({ children }: AuthProviderProps): ReactElement => {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  // Only a stored token needs checking; a fresh visitor is already settled.
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(
    (): boolean => readStoredToken() !== null,
  );

  const applySession = useCallback((session: AuthResponse): void => {
    persistSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      applySession(await loginRequest(credentials));
    },
    [applySession],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<void> => {
      applySession(await registerRequest(credentials));
    },
    [applySession],
  );

  const logout = useCallback((): void => {
    persistSession(null);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Checks a restored token against the server before the app is shown.
   *
   * The cached user is a convenience; this is what makes it trustworthy. An
   * expired or revoked token clears the session instead of letting the app
   * render as signed in and fail on its first request.
   */
  useEffect((): (() => void) => {
    const storedToken = readStoredToken();

    // No stored token: the lazy initialiser already settled this to `false`.
    if (storedToken === null) {
      return (): void => undefined;
    }

    const controller = new AbortController();

    fetchCurrentUser(storedToken, controller.signal)
      .then((verified: AuthUser): void => {
        persistSession({ token: storedToken, user: verified });
        setToken(storedToken);
        setUser(verified);
        setIsRestoringSession(false);
      })
      .catch((cause: unknown): void => {
        if (controller.signal.aborted) {
          return;
        }

        console.warn('[auth] stored session rejected:', cause);
        logout();
        setIsRestoringSession(false);
      });

    return (): void => controller.abort();
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      // Both must be present: a token without a user cannot render the app,
      // and a user without a token cannot talk to the server.
      isAuthenticated: user !== null && token !== null,
      isRestoringSession,
      login,
      register,
      logout,
    }),
    [user, token, isRestoringSession, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
