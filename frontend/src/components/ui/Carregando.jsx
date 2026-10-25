export default function Carregando({ children }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/90 p-5 text-sm text-muted">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 shrink-0 text-primary motion-safe:animate-spin">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity=".2" />
        <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {children}
    </div>
  );
}
