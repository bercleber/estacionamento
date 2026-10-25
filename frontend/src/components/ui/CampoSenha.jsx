import { useId, useState } from 'react';

export default function CampoSenha({ label, id, className = '', disabled = false, ...props }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visivel, setVisivel] = useState(false);
  const acao = visivel ? 'Ocultar senha' : 'Mostrar senha';

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink">{label}</label>
      <div className="relative">
        <input {...props} id={inputId} type={visivel ? 'text' : 'password'} disabled={disabled}
          className={`vp-field pr-12 ${className}`} />
        <button type="button" disabled={disabled} aria-controls={inputId}
          aria-label={`${acao}: ${label}`} title={acao}
          aria-pressed={visivel}
          onClick={() => setVisivel((atual) => !atual)}
          className="absolute inset-y-0 right-0 inline-flex min-h-12 w-12 items-center justify-center rounded-r-xl text-muted hover:bg-blue-50 hover:text-primary focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="h-5 w-5">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visivel && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
