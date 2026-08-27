import type { ChangeEvent, ReactElement } from 'react';

export interface AuthFieldProps {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
  hint?: string;
}

/** One labelled input, styled once so both auth forms stay identical. */
export const AuthField = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  hint,
}: AuthFieldProps): ReactElement => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>): void => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      disabled={disabled}
      required
      className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 transition focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:bg-slate-50"
    />
    {hint !== undefined && <p className="text-[12px] text-slate-400">{hint}</p>}
  </div>
);
