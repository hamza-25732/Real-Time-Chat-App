import type { ReactElement } from 'react';

import { Sidebar } from '../components/Sidebar';
import { Chat } from '../features/chat/Chat';
import { useChat } from '../features/chat/useChat';

/**
 * Route-level screen: the sidebar and the chat column.
 *
 * Owns the chat hook so the socket is subscribed in exactly one place; both
 * columns read the signed-in user from `AuthContext` themselves.
 */
export const ChatPage = (): ReactElement => {
  const {
    messages,
    isLoadingHistory,
    status,
    selfSocketId,
    error,
    sendMessage,
    dismissError,
    clearMessages,
  } = useChat();

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar onNewChat={clearMessages} />
      <Chat
        messages={messages}
        isLoadingHistory={isLoadingHistory}
        status={status}
        selfSocketId={selfSocketId}
        error={error}
        onSend={sendMessage}
        onDismissError={dismissError}
      />
    </div>
  );
};

export default ChatPage;
