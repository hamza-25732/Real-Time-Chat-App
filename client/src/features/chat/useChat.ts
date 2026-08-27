import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { fetchRecentMessages } from '../../services/messageService';
import {
  SOCKET_EVENTS,
  type ChatMessageBroadcast,
  type ConnectionStatus,
  type ConversationMode,
  type SocketErrorPayload,
} from '../../types/socketEvents';

/** Mirrors `MESSAGE_MAX_LENGTH` in `server/models/message.model.ts`. */
export const MAX_MESSAGE_LENGTH = 4000;

/**
 * History first, then any live message not already in it. Ids come from
 * MongoDB on both paths, so a message that arrived over the socket and then
 * appeared in history is de-duplicated rather than shown twice.
 */
const mergeById = (
  history: ChatMessageBroadcast[],
  live: ChatMessageBroadcast[],
): ChatMessageBroadcast[] => {
  const historyIds = new Set(history.map((message): string => message.id));
  return [...history, ...live.filter((message): boolean => !historyIds.has(message.id))];
};

export interface UseChatResult {
  messages: ChatMessageBroadcast[];
  /** True while the REST history request is still in flight. */
  isLoadingHistory: boolean;
  /** True between sending to the assistant and its reply arriving. */
  isAssistantThinking: boolean;
  /** Which conversation is on screen. */
  mode: ConversationMode;
  setMode: (mode: ConversationMode) => void;
  status: ConnectionStatus;
  /** Socket id of this client, used to tell own messages from others'. */
  selfSocketId: string | null;
  /** Last rejection reported by the server, or `null` when nothing is wrong. */
  error: string | null;
  /**
   * Sends to the active conversation. Returns `true` when the message was
   * handed to the socket.
   */
  sendMessage: (content: string) => boolean;
  dismissError: () => void;
  /** Empties the local view. History stays on the server. */
  clearMessages: () => void;
}

/**
 * Subscribes to the active conversation and exposes a send function.
 *
 * All socket wiring lives here rather than in the component: the effect below
 * is the single place messages arrive, and it removes every listener it added.
 */
export const useChat = (): UseChatResult => {
  const { socket, status } = useSocket();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessageBroadcast[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [mode, setModeState] = useState<ConversationMode>('global');
  const [error, setError] = useState<string | null>(null);

  // Derived, not mirrored into state: `socket.id` is assigned before the
  // provider flips the status to 'connected', so status is the reliable cue.
  const selfSocketId = status === 'connected' ? (socket.id ?? null) : null;

  // The conversation id the server will stamp on messages for this mode. Live
  // broadcasts for any other conversation belong to a view we are not showing.
  const activeConversationId =
    user === null ? null : mode === 'global' ? 'global' : `ai_${user._id}`;

  /** Switching mode empties the view; the effect below refills it. */
  const setMode = useCallback((next: ConversationMode): void => {
    setModeState(next);
    setMessages([]);
    setIsLoadingHistory(true);
    setIsAssistantThinking(false);
    setError(null);
  }, []);

  // Load history for the active mode. Live messages can land while this
  // request is in flight, so the two lists are merged by id.
  useEffect((): (() => void) => {
    if (token === null) {
      return (): void => undefined;
    }

    const controller = new AbortController();

    fetchRecentMessages(token, mode, controller.signal)
      .then((history): void => {
        setMessages((live): ChatMessageBroadcast[] => mergeById(history, live));
        setIsLoadingHistory(false);
      })
      .catch((cause: unknown): void => {
        if (controller.signal.aborted) {
          return;
        }

        console.error('[history] could not load earlier messages:', cause);
        setError('Could not load earlier messages.');
        setIsLoadingHistory(false);
      });

    return (): void => controller.abort();
  }, [token, mode]);

  useEffect((): (() => void) => {
    const handleBroadcast = (message: ChatMessageBroadcast): void => {
      // Global traffic reaches every socket, so a message for a conversation
      // we are not looking at is dropped rather than appended to the wrong view.
      if (message.conversationId !== activeConversationId) {
        return;
      }

      if (message.isBot) {
        setIsAssistantThinking(false);
      }

      setMessages((previous): ChatMessageBroadcast[] =>
        previous.some((existing): boolean => existing.id === message.id)
          ? previous
          : [...previous, message],
      );
    };

    const handleServerError = (payload: SocketErrorPayload): void => {
      setIsAssistantThinking(false);
      setError(payload.message);
    };

    const handleConnect = (): void => setError(null);

    socket.on(SOCKET_EVENTS.MESSAGE_BROADCAST, handleBroadcast);
    socket.on(SOCKET_EVENTS.SOCKET_ERROR, handleServerError);
    socket.on('connect', handleConnect);

    // Teardown removes exactly the handlers added above — a leaked listener
    // here would duplicate every message on the next mount.
    return (): void => {
      socket.off(SOCKET_EVENTS.MESSAGE_BROADCAST, handleBroadcast);
      socket.off(SOCKET_EVENTS.SOCKET_ERROR, handleServerError);
      socket.off('connect', handleConnect);
    };
  }, [socket, activeConversationId]);

  const sendMessage = useCallback(
    (content: string): boolean => {
      const trimmedContent = content.trim();

      // Guard only: the server decides the sender, but there is no point
      // emitting at all once the session is gone.
      if (user === null) {
        setError('You are signed out. Sign in again to send messages.');
        return false;
      }

      if (trimmedContent === '') {
        return false;
      }

      if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
        setError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);
        return false;
      }

      if (!socket.connected) {
        setError('Not connected to the server.');
        return false;
      }

      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
        content: trimmedContent,
        conversationId: mode,
      });

      if (mode === 'ai') {
        setIsAssistantThinking(true);
      }

      setError(null);
      return true;
    },
    [socket, user, mode],
  );

  const dismissError = useCallback((): void => setError(null), []);

  const clearMessages = useCallback((): void => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoadingHistory,
    isAssistantThinking,
    mode,
    setMode,
    status,
    selfSocketId,
    error,
    sendMessage,
    dismissError,
    clearMessages,
  };
};
