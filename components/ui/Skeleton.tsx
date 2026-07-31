'use client'

// A single shimmering block — the base building unit for skeletons
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} />
}

// Mimics a list row like Leads/Employees/Properties cards, so the loading
// state has the same shape as the real content — feels instant, not jarring.
export function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F4] px-4 py-3 flex items-center gap-3">
      <SkeletonBlock className="w-11 h-11 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonBlock className="h-3.5 w-1/2" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
      <SkeletonBlock className="h-5 w-14 rounded-full flex-shrink-0" />
    </div>
  )
}

// A full-page skeleton list — drop this in wherever a spinner used to be,
// pass howMany to roughly match expected content length.
export function SkeletonList({ howMany = 6 }: { howMany?: number }) {
  return (
    <div className="px-4 pt-4 space-y-2">
      {Array.from({ length: howMany }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}

      <style jsx global>{`
        .skeleton-shimmer {
          background: linear-gradient(90deg, #F0F4FB 25%, #E8EEF7 37%, #F0F4FB 63%);
          background-size: 400% 100%;
          animation: skeleton-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes skeleton-shimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer { animation: none; background: #F0F4FB; }
        }
      `}</style>
    </div>
  )
}
