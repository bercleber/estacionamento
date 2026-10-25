import { useId } from 'react';

export default function Select({ label, id, children, erro, className = '', ...props }) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="space-y-2">
      <label htmlFor={selectId} className="block text-sm font-semibold text-ink">{label}</label>
      <select
        id={selectId}
        className={`vp-field ${className}`}
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
