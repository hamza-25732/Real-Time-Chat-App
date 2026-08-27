import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';

import { useAuth } from '../hooks/useAuth';
import { createChatSocket } from '../services/socketService';
import type { ChatSocket, ConnectionStatus } from '../types/socketEvents';

import { SocketContext, type SocketContextValue } from './socketContext';

/**
 * Handshake rejections from the server's `io.use` gate. A transport failure
 * ("websocket error") is a network problem and must not sign anyone out.
 */
const AUTH_FAILURE_MESSAGES: readonly string[] = [
  'Authentication required',
  'Invalid or expired token',
  'That account no longer exists',
  'Could not verify your session',
];

export interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Owns the one socket connection for the whole app: opens it on mount, closes
 * it on unmount, and publishes the live connection status.
 *
 * The socket is built by a lazy state initialiser, so it is created once per
 * provider and survives every re-render. The provider only ever mounts inside
 * the authenticated branch, so a token is always available to hand to the
 * handshake.
 */
export const SocketProvider = ({ children }: SocketProviderProps): ReactElement => {
  const { token, logout } = useAuth();
  const [socket] = useState<ChatSocket>((): ChatSocket => createChatSocket(token ?? ''));
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect((): (() => void) => {
    const handleConnect = (): void => setStatus('connected');
    const handleDisconnect = (): void => setStatus('disconnected');
    const handleConnectError = (error: Error): void => {
      setStatus('disconnected');
      console.error('[socket] connection error:', error.message);

      // The server refused the handshake, so the stored token is no good —
      // sign out rather than retry forever against a dead session.
      if (AUTH_FAILURE_MESSAGES.includes(error.message)) {
        logout();
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socket.connect();

    // Every listener registered above is removed here, and the connection is
    // closed, so a remount opens exactly one fresh socket.
    return (): void => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [socket, logout]);

  const value = useMemo<SocketContextValue>(() => ({ socket, status }), [socket, status]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
