export function SanchosLogo({ size = 80 }: { size?: number }) {
  return (
    <img
      src="/sanchos-logo.png"
      alt="Sanchos Real Estate"
      style={{ height: size, width: 'auto' }}
      draggable={false}
    />
  )
}

// Used against the navy sidebar/header — wrapped in a white chip so the
// blue-on-transparent logo stays visible against a dark background.
export function SanchosLogoSmall() {
  return (
    <div className="inline-flex items-center bg-white rounded-xl px-3 py-2">
      <img
        src="/sanchos-logo.png"
        alt="Sanchos Real Estate"
        style={{ height: 32, width: 'auto' }}
        draggable={false}
      />
    </div>
  )
}