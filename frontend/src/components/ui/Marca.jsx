export default function Marca({ compacta = false }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className={`vp-brand-symbol ${compacta ? 'h-10 w-10' : 'h-12 w-12'}`}>
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false" className={compacta ? 'h-7 w-7' : 'h-8 w-8'}>
          <path d="M11 25V8h7a5.5 5.5 0 0 1 0 11h-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m21 23 2.5 2.5L28 21" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight text-ink">V<span className="font-semibold">Parking</span></span>
    </span>
  );
}
