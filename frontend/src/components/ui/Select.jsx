import { useId } from 'react';

export default function Select({ label, id, children, erro, ...props }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-sm font-medium">{label}</label>
      <select
        id={selectId}
        className={`min-h-11 w-full rounded-lg border ${erro ? 'border-red-500' : 'border-slate-300'} bg-white px-3 py-2 text-base disabled:bg-slate-100`}
        {...props}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[props['aria-describedby'], erro && `${selectId}-erro`].filter(Boolean).join(' ') || undefined}
      >
        {children}
      </select>
      {erro && <p id={`${selectId}-erro`} className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
