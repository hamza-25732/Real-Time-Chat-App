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

/** One message: soft purple when it is yours, plain white when it is not. */
export const MessageBubble = ({ message, isOwn }: MessageBubbleProps): ReactElement => (
  <article
    className={`flex w-full animate-arrive flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}
  >
    <div
      className={`max-w-[min(46ch,80%)] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
        isOwn
          ? 'rounded-br-md bg-purple-100 text-purple-950'
          : 'rounded-bl-md border border-hairline bg-white text-slate-800 shadow-card'
      }`}
    >
      <p className="whitespace-pre-wrap break-words">{message.content}</p>
    </div>

    <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
      <span className="font-medium text-slate-500">{message.senderName}</span>
      <time dateTime={message.sentAt}>{timeFormatter.format(new Date(message.sentAt))}</time>
    </div>
  </article>
);
