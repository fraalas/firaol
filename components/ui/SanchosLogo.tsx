export function SanchosLogo({ size = 64 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <polygon points="40,4 72,22 72,58 40,76 8,58 8,22" fill="#1A3A6B"/>
        <polygon points="40,4 72,22 40,40" fill="#2E6DD4"/>
        <polygon points="8,22 40,40 8,58" fill="#0D2450"/>
        <polygon points="40,40 72,58 40,76 8,58" fill="#1A3A6B"/>
        <polygon points="40,4 72,22 40,22" fill="#4A8FE8" opacity="0.8"/>
        <polygon points="40,22 72,22 40,40" fill="#2255A8"/>
        <circle cx="62" cy="16" r="8" fill="#4BAEE8"/>
        <line x1="62" y1="10" x2="62" y2="22" stroke="#0D2450" strokeWidth="1.2"/>
        <line x1="56" y1="16" x2="68" y2="16" stroke="#0D2450" strokeWidth="1.2"/>
        <line x1="57.5" y1="11.5" x2="66.5" y2="20.5" stroke="#0D2450" strokeWidth="1.2"/>
        <line x1="66.5" y1="11.5" x2="57.5" y2="20.5" stroke="#0D2450" strokeWidth="1.2"/>
      </svg>
      <div className="text-center">
        <div className="font-extrabold text-[#1A3A6B] tracking-widest" style={{fontSize: size * 0.22}}>SANCHOS</div>
        <div className="font-semibold text-[#1F4FA8] tracking-widest uppercase" style={{fontSize: size * 0.1, letterSpacing: '0.2em'}}>Real Estate</div>
      </div>
    </div>
  )
}

export function SanchosLogoSmall() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 80 80" fill="none">
        <polygon points="40,4 72,22 72,58 40,76 8,58 8,22" fill="#2255A8"/>
        <polygon points="40,4 72,22 40,40" fill="#4A8FE8"/>
        <polygon points="8,22 40,40 8,58" fill="#0D2450"/>
        <circle cx="62" cy="16" r="8" fill="#4BAEE8"/>
      </svg>
      <div>
        <div className="text-white font-extrabold text-[13px] tracking-wider leading-none">SANCHOS</div>
        <div className="text-white/50 text-[8px] tracking-[0.2em] uppercase leading-none mt-0.5">Real Estate</div>
      </div>
    </div>
  )
}
