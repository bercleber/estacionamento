import { useId } from 'react';

export default function Campo({ label, id, className = '', ...props }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">{label}</label>
      <input
        id={inputId}
        className={`min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base disabled:bg-slate-100 ${className}`}
        {...props}
      />
    </div>
  );
}
