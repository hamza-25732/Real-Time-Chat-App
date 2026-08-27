/** The caller identified by a verified JWT. */
export interface AuthenticatedUser {
  _id: string;
}

/** The signed-in user behind a socket connection, resolved at handshake time. */
export interface AuthenticatedSocketUser {
  _id: string;
  username: string;
}
