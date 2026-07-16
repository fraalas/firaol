interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}
export function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  )
}

export const inputCls = "w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE] transition-colors"
export const selectCls = "w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#4A5880] outline-none bg-[#FAFBFE]"
