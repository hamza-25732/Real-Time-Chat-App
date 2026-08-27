import { useState, type ReactElement } from 'react';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

const COPY: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to pick up the conversation.',
  },
  register: {
    title: 'Create your account',
    subtitle: 'Pick a name — it is what everyone else will see.',
  },
};

/** Signed-out screen: a single centered card holding one of the two forms. */
export const AuthScreen = (): ReactElement => {
  const [mode, setMode] = useState<AuthMode>('login');
  const { title, subtitle } = COPY[mode];

  return (
    <div className="grid h-full w-full place-items-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-center gap-2 pb-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-base font-bold text-white">
            C
          </span>
          <span className="text-[17px] font-semibold tracking-tight">Cortex</span>
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-pill">
          <h1 className="bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-[24px] font-bold tracking-tight text-transparent">
            {title}
          </h1>
          <p className="pb-5 pt-1 text-[14px] text-slate-500">{subtitle}</p>

          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={(): void => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={(): void => setMode('login')} />
          )}
        </div>

        <p className="pt-4 text-center text-[12px] text-slate-400">
          Messages are stored and shared with everyone connected.
        </p>
      </div>
    </div>
  );
};
