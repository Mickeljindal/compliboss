/**
 * CompliBoss wordmark tuned for dark backgrounds: an open-circle mark with a
 * green->cyan gradient check, lowercase "compli" in light + "boss" in the
 * brand gradient.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width="30" height="30" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="cbLogoGrad" x1="30" y1="82" x2="94" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2ad07b" />
            <stop offset="1" stopColor="#10b4e6" />
          </linearGradient>
        </defs>
        <path d="M92 86 A44 44 0 1 1 92 34" stroke="#D8DEE6" strokeWidth="13" strokeLinecap="round" />
        <path d="M37 62 L55 80 L92 32" stroke="url(#cbLogoGrad)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
        <span style={{ color: '#eef2f7' }}>compli</span>
        <span
          style={{
            background: 'linear-gradient(90deg,#2ad07b,#10b4e6)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          boss
        </span>
      </span>
    </span>
  );
}
