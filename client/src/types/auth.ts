/** The authenticated user, as returned by `/api/auth/login` and `/register`. */
export interface AuthUser {
  _id: string;
  username: string;
}

/** Body of a successful auth response. */
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
