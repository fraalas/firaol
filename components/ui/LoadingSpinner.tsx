import { Loader2 } from 'lucide-react'
export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={size} className="animate-spin text-[#1A3A6B]" />
    </div>
  )
}
