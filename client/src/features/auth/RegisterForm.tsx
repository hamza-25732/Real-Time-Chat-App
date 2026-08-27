import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { useAuth } from '../../hooks/useAuth';

import { AuthField } from './AuthField';

/** Mirrors the server's `PASSWORD_MIN_LENGTH`. */
const PASSWORD_MIN_LENGTH = 8;

export interface RegisterFormProps {
  /** Switches the screen to the login form. */
  onSwitchToLogin: () => void;
}

/** Creates an account and signs the new user straight in. */
export const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps): ReactElement => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    // Caught here so an obvious mistake does not need a server round-trip.
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ email, username, password });
      // On success this component unmounts, so no state is touched afterwards.
    } catch (cause: unknown) {
      // Surfaces the server's own wording, including the 409 conflicts
      // ("That email is already registered" / "That username is taken").
      setError(cause instanceof Error ? cause.message : 'Could not create your account.');
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
        id="register-username"
        label="Username"
        type="text"
        value={username}
        onChange={setUsername}
        placeholder="hamza"
        autoComplete="username"
        disabled={isSubmitting}
      />

      <AuthField
        id="register-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={isSubmitting}
      />

      <AuthField
        id="register-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        disabled={isSubmitting}
        hint={`Use ${PASSWORD_MIN_LENGTH} characters or more.`}
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
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-[13px] text-slate-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          disabled={isSubmitting}
          className="font-medium text-purple-700 transition hover:text-purple-900 disabled:opacity-60"
        >
          Sign in
        </button>
      </p>
    </form>
  );
};
