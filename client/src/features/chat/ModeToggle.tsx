import { Globe, Sparkles, type LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { CONVERSATION_MODES, type ConversationMode } from '../../types/socketEvents';

const MODE_META: Record<ConversationMode, { label: string; icon: LucideIcon }> = {
  global: { label: 'Global Room', icon: Globe },
  ai: { label: 'AI Assistant', icon: Sparkles },
};

export interface ModeToggleProps {
  mode: ConversationMode;
  onChange: (mode: ConversationMode) => void;
}

/**
 * Segmented control for the two conversations.
 *
 * A radiogroup rather than two buttons: the modes are mutually exclusive, and
 * arrow keys move between them for keyboard users.
 */
export const ModeToggle = ({ mode, onChange }: ModeToggleProps): ReactElement => (
  <div
    role="radiogroup"
    aria-label="Conversation"
    className="inline-flex items-center gap-1 rounded-xl border border-hairline bg-white p-1 shadow-card"
  >
    {CONVERSATION_MODES.map((candidate) => {
      const { label, icon: Icon } = MODE_META[candidate];
      const isActive = candidate === mode;

      return (
        <button
          key={candidate}
          type="button"
          role="radio"
          aria-checked={isActive}
          onClick={(): void => onChange(candidate)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
            isActive
              ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </button>
      );
    })}
  </div>
);
