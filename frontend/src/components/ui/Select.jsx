import { useId } from 'react';

export default function Select({ label, id, children, ...props }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-sm font-medium">{label}</label>
      <select
        id={selectId}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base disabled:bg-slate-100"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
