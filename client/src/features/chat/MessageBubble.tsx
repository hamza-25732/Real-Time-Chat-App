import { Sparkles } from 'lucide-react';
import type { ReactElement } from 'react';

import type { ChatMessageBroadcast } from '../../types/socketEvents';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

export interface MessageBubbleProps {
  message: ChatMessageBroadcast;
  /** True when this client's own connection sent the message. */
  isOwn: boolean;
}

/**
 * One message. Soft purple when it is yours, plain white when it is someone
 * else's, and a gradient-edged card with a spark when it is the assistant.
 */
export const MessageBubble = ({ message, isOwn }: MessageBubbleProps): ReactElement => {
  const { isBot } = message;
  const alignment = isOwn && !isBot ? 'items-end' : 'items-start';

  return (
    <article className={`flex w-full animate-arrive flex-col gap-1 ${alignment}`}>
      {isBot ? (
        // The gradient sits on a wrapper so the border itself carries the
        // colour, which reads as "not a person" without shouting.
        <div className="max-w-[min(52ch,88%)] rounded-2xl rounded-bl-md bg-gradient-to-br from-purple-300 via-purple-200 to-transparent p-px shadow-card">
          <div className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-[15px] leading-relaxed text-slate-800">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      ) : (
        <div
          className={`max-w-[min(46ch,80%)] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
            isOwn
              ? 'rounded-br-md bg-purple-100 text-purple-950'
              : 'rounded-bl-md border border-hairline bg-white text-slate-800 shadow-card'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      )}

      <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
        {isBot && (
          <Sparkles className="h-3 w-3 text-purple-500" aria-label="Assistant message" />
        )}
        <span className={`font-medium ${isBot ? 'text-purple-700' : 'text-slate-500'}`}>
          {message.senderName}
        </span>
        <time dateTime={message.sentAt}>{timeFormatter.format(new Date(message.sentAt))}</time>
      </div>
    </article>
  );
};
