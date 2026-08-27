import { useContext } from 'react';

import { AuthContext, type AuthContextValue } from '../context/sessionContext';

/**
 * Reads the current session. Throws when used outside `AuthProvider`, so a
 * misplaced component fails loudly instead of silently rendering signed out.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }

  return context;
};
