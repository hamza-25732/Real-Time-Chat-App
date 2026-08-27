import { useContext } from 'react';

import { SocketContext, type SocketContextValue } from '../context/socketContext';

/**
 * Reads the app's shared socket. Throws when used outside `SocketProvider`, so
 * a misplaced component fails loudly instead of silently never connecting.
 */
export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);

  if (context === null) {
    throw new Error('useSocket must be used inside a <SocketProvider>');
  }

  return context;
};
