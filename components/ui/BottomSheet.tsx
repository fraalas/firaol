'use client'
import { X } from 'lucide-react'
interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6 pb-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#0D1B3E] text-base">{title}</h3>
          <button onClick={onClose} className="text-[#9AAAC8] hover:text-[#4A5880]"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}
