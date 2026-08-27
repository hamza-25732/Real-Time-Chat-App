import { ArrowUp, AudioLines, Paperclip, Sparkles } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactElement } from 'react';

export interface ChatComposerProps {
  /** Returns true when the message was accepted, which clears the field. */
  onSend: (content: string) => boolean;
  isConnected: boolean;
}

/**
 * The floating prompt pill: one field, a Send control, and placeholder tools.
 *
 * Owns only the draft text — sending is delegated upward so the composer stays
 * free of socket knowledge.
 */
export const ChatComposer = ({ onSend, isConnected }: ChatComposerProps): ReactElement => {
  const [draft, setDraft] = useState('');

  const submitDraft = (): void => {
    if (onSend(draft)) {
      setDraft('');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitDraft();
  };

  // Enter sends. Handled explicitly rather than left to the form's implicit
  // submission; `preventDefault` stops a second, duplicate send.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitDraft();
    }
  };

  const canSend = isConnected && draft.trim() !== '';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[28px] border border-hairline bg-white p-2.5 shadow-pill"
    >
      <input
        className="w-full bg-transparent px-3 py-2.5 text-[15px] placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
        value={draft}
        onChange={(event: ChangeEvent<HTMLInputElement>): void => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isConnected ? 'Ask me anything…' : 'Waiting for the server…'}
        disabled={!isConnected}
        aria-label="Message"
        autoComplete="off"
      />

      <div className="flex items-center gap-1.5 px-1 pt-1">
        <span className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1.5 text-[12px] font-medium text-purple-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Deeper Research
        </span>

        <button
          type="button"
          title="Attach a file"
          aria-label="Attach a file"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <Paperclip className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          title="Dictate a message"
          aria-label="Dictate a message"
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <AudioLines className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="submit"
          disabled={!canSend}
          title="Send"
          className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Send</span>
        </button>
      </div>
    </form>
  );
};
