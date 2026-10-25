import { useId } from 'react';

export default function Campo({ label, id, className = '', erro, ajuda, ...props }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">{label}</label>
      <input
        id={inputId}
        className={`min-h-11 w-full rounded-lg border ${erro ? 'border-red-500' : 'border-slate-300'} bg-white px-3 py-2 text-base disabled:bg-slate-100 ${className}`}
        {...props}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[props['aria-describedby'], ajuda && `${inputId}-ajuda`, erro && `${inputId}-erro`].filter(Boolean).join(' ') || undefined}
      />
      {ajuda && <p id={`${inputId}-ajuda`} className="text-sm text-slate-500">{ajuda}</p>}
      {erro && <p id={`${inputId}-erro`} className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
