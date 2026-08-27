import {
  Clock,
  Compass,
  FileText,
  Library,
  LogOut,
  Plus,
  Search,
  type LucideIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { useAuth } from '../hooks/useAuth';

export interface SidebarProps {
  /** Clears the current conversation view. */
  onNewChat: () => void;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Explore', icon: Compass },
  { label: 'Library', icon: Library },
  { label: 'Files', icon: FileText },
  { label: 'History', icon: Clock },
];

/** Placeholder history until conversations are a real feature. */
const RECENT_CHATS: { group: string; items: string[] }[] = [
  {
    group: 'Today',
    items: [
      'Create a detailed 7-day sprint plan',
      'Draft a concise email to stakeholders',
      'Analyze the Eisenhower Matrix',
    ],
  },
  {
    group: 'Yesterday',
    items: ['Summarize the main differences', 'Negotiate an extension for the deadline'],
  },
  {
    group: '7 days',
    items: [
      'Generate 5 effective morning habits',
      'As a non-technical PM, list 5 crucial',
      'Write a 100-word positive feedback',
    ],
  },
];

/**
 * Left rail: start a new chat, jump to a recent one, see who you are.
 *
 * Purely presentational — the recent chats are placeholders, so nothing here
 * talks to the socket or the API.
 */
export const Sidebar = ({ onNewChat }: SidebarProps): ReactElement => {
  const { user, logout } = useAuth();
  const username = user === null ? '' : user.username;

  return (
    <aside className="hidden h-full w-[260px] flex-none flex-col border-r border-hairline bg-rail md:flex">
    <div className="flex items-center gap-2 px-4 py-4">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-sm font-bold text-white">
        C
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Cortex</span>
    </div>

    <div className="px-3">
      <button
        type="button"
        onClick={onNewChat}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        New chat
      </button>
    </div>

    <div className="px-3 pt-3">
      <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-slate-400">
        <Search className="h-4 w-4" aria-hidden="true" />
        <span>Search</span>
      </div>
    </div>

    <nav className="px-3 pt-4">
      <ul className="space-y-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>

    <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      {RECENT_CHATS.map(({ group, items }) => (
        <div key={group} className="pt-4 first:pt-0">
          <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {group}
          </p>
          <ul className="space-y-0.5">
            {items.map((title) => (
              <li key={title}>
                <button
                  type="button"
                  className="w-full truncate rounded-lg px-3 py-1.5 text-left text-[13px] text-slate-600 transition hover:bg-white hover:text-slate-900"
                >
                  {title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

      <div className="flex items-center gap-2.5 border-t border-hairline px-4 py-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-purple-200 text-xs font-semibold text-purple-700">
          {username.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-slate-800">{username}</span>
          <span className="block truncate text-[11px] text-slate-400">Signed in</span>
        </span>
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="grid h-8 w-8 flex-none place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
