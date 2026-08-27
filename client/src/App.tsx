import { Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketProvider';
import { AuthScreen } from './features/auth/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { ChatPage } from './pages/ChatPage';

/**
 * Chooses the screen for the current session.
 *
 * `SocketProvider` lives inside the authenticated branch on purpose: a signed
 * out visitor never opens a socket, and signing out tears the existing one
 * down by unmounting the provider.
 */
const AppRoutes = (): ReactElement => {
  const { isAuthenticated, isRestoringSession } = useAuth();

  // A stored token is checked with the server before anything renders, so the
  // app never opens a socket on a session that has already expired.
  if (isRestoringSession) {
    return (
      <div className="grid h-full w-full place-items-center">
        <span className="flex items-center gap-2 text-[13px] text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Restoring your session…
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <SocketProvider>
      <ChatPage />
    </SocketProvider>
  );
};

/** App shell: the session wraps everything else. */
const App = (): ReactElement => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
