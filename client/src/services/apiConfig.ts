/**
 * Base URL of the backend. Both the REST client and the socket client read it
 * from here so they can never drift onto different origins.
 */
export const SERVER_URL: string = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:5000';
