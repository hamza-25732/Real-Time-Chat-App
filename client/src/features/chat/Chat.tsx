import { MoreHorizontal, Share2, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, type ReactElement } from 'react';

import { useAuth } from '../../hooks/useAuth';
import type {
  ChatMessageBroadcast,
  ConnectionStatus,
  ConversationMode,
} from '../../types/socketEvents';

import { ChatComposer } from './ChatComposer';
import { MessageBubble } from './MessageBubble';
import { ModeToggle } from './ModeToggle';

const EMPTY_COPY: Record<ConversationMode, string> = {
  global:
    'No messages yet. Open this page in a second tab to watch one arrive in both at once.',
  ai: 'Ask the assistant anything. This conversation is private to you.',
};

const FOOTER_COPY: Record<ConversationMode, string> = {
  global: 'Messages are stored and shared with everyone connected.',
  ai: 'Private to your account. Replies are generated and can be wrong.',
};

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Connecting',
  connected: 'Live',
  disconnected: 'Offline',
};

const STATUS_STYLE: Record<ConnectionStatus, string> = {
  connecting: 'bg-slate-100 text-slate-500',
  connected: 'bg-emerald-50 text-emerald-700',
  disconnected: 'bg-orange-50 text-orange-700',
};

export interface ChatProps {
  messages: ChatMessageBroadcast[];
  isLoadingHistory: boolean;
  isAssistantThinking: boolean;
  mode: ConversationMode;
  onModeChange: (mode: ConversationMode) => void;
  status: ConnectionStatus;
  selfSocketId: string | null;
  error: string | null;
  onSend: (content: string) => boolean;
  onDismissError: () => void;
}

/**
 * The main column: greeting, the conversation, and the prompt pill.
 *
 * Presentational — every piece of state arrives as a prop from `ChatPage`, so
 * the socket lives in exactly one place.
 */
export const Chat = ({
  messages,
  isLoadingHistory,
  isAssistantThinking,
  mode,
  onModeChange,
  status,
  selfSocketId,
  error,
  onSend,
  onDismissError,
}: ChatProps): ReactElement => {
  const { user } = useAuth();
  const username = user === null ? '' : user.username;
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as the log grows.
  useEffect((): void => {
    const log = logRef.current;

    if (log !== null) {
      log.scrollTop = log.scrollHeight;
    }
  }, [messages.length, isAssistantThinking]);

  const isConnected = status === 'connected';
  const hasMessages = messages.length > 0;

  return (
    <main className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex flex-none items-center gap-3 px-6 py-4">
        <ModeToggle mode={mode} onChange={onModeChange} />

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[status]}`}
          role="status"
        >
          {STATUS_LABEL[status]}
          {selfSocketId !== null && (
            <span className="ml-1.5 font-mono opacity-60">{selfSocketId.slice(-6)}</span>
          )}
        </span>

        <div className="ml-auto flex items-center gap-1 text-slate-400">
          <button
            type="button"
            aria-label="More options"
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-slate-100"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Share chat"
            className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-slate-100"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* The hero is the empty state: once a conversation exists, the log takes
          the full column. */}
      {!hasMessages && (
        <div className="flex-none px-6 pb-6 pt-2 text-center">
          <h1 className="bg-gradient-to-r from-purple-300 via-purple-500 to-purple-400 bg-clip-text text-[34px] font-bold leading-tight tracking-tight text-transparent">
            Hello, {username.trim() === '' ? 'there' : username}
          </h1>
          <p className="mt-1 text-[26px] font-semibold tracking-tight text-slate-900">
            {mode === 'ai' ? 'What can I help you with?' : 'How can I assist you today?'}
          </p>
        </div>
      )}

      <div
        ref={logRef}
        className="min-h-0 flex-1 overflow-y-auto px-6"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-6">
          {!hasMessages ? (
            <p className="py-10 text-center text-sm text-slate-400">
              {isLoadingHistory ? 'Loading earlier messages…' : EMPTY_COPY[mode]}
            </p>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.socketId === selfSocketId}
              />
            ))
          )}

          {isAssistantThinking && (
            <p
              className="flex items-center gap-2 px-1 text-[13px] text-purple-700"
              role="status"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
              Cortex AI is thinking…
            </p>
          )}
        </div>
      </div>

      <div className="flex-none px-6 pb-6">
        <div className="mx-auto w-full max-w-3xl">
          {error !== null && (
            <div
              className="mb-3 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-[13px] text-orange-800"
              role="alert"
            >
              {error}
              <button
                type="button"
                onClick={onDismissError}
                aria-label="Dismiss"
                className="ml-auto grid h-6 w-6 place-items-center rounded-md transition hover:bg-orange-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          <ChatComposer onSend={onSend} isConnected={isConnected} />

          <p className="pt-3 text-center text-[11px] text-slate-400">{FOOTER_COPY[mode]}</p>
        </div>
      </div>
    </main>
  );
};
