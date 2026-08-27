import { createContext } from 'react';

import type { ChatSocket, ConnectionStatus } from '../types/socketEvents';

export interface SocketContextValue {
  socket: ChatSocket;
  status: ConnectionStatus;
}

/**
 * Holds the app's single socket. `null` means "no provider above you", which
 * `useSocket` turns into a thrown error rather than a confusing runtime crash.
 *
 * Kept in its own module so `SocketProvider.tsx` exports only a component and
 * stays eligible for React Fast Refresh.
 */
export const SocketContext = createContext<SocketContextValue | null>(null);
