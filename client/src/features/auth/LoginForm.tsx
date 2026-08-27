import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { useAuth } from '../../hooks/useAuth';

import { AuthField } from './AuthField';

export interface LoginFormProps {
  /** Switches the screen to the register form. */
  onSwitchToRegister: () => void;
}

/** Signs an existing user in. */
export const LoginForm = ({ onSwitchToRegister }: LoginFormProps): ReactElement => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // On success this component unmounts, so no state is touched afterwards.
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not sign you in.');
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>): void => void handleSubmit(event)}
      className="space-y-4"
      noValidate
    >
      <AuthField
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={isSubmitting}
      />

      <AuthField
        id="login-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Your password"
        autoComplete="current-password"
        disabled={isSubmitting}
      />

      {error !== null && (
        <p
          className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-[13px] text-orange-800"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 px-4 py-2.5 text-[15px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-[13px] text-slate-500">
        New here?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={isSubmitting}
          className="font-medium text-purple-700 transition hover:text-purple-900 disabled:opacity-60"
        >
          Create an account
        </button>
      </p>
    </form>
  );
};
