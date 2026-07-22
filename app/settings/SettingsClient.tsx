'use client'
import { useState } from 'react'
import { Check, Loader2, Building2, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props { company: any }

export function SettingsClient({ company }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState({
    name:      company?.name ?? '',
    phone:     company?.phone ?? '',
    address:   company?.address ?? '',
    logo_url:  company?.logo_url ?? '',
  })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const [currency, setCurrency] = useState(
    typeof window !== 'undefined' ? (localStorage.getItem('sanchos_currency') ?? 'ETB') : 'ETB'
  )
  const [language, setLanguage] = useState(
    typeof window !== 'undefined' ? (localStorage.getItem('sanchos_language') ?? 'en') : 'en'
  )

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const { error: updateError } = await supabase
      .from('companies')
      .update({
        name:     form.name,
        phone:    form.phone || null,
        address:  form.address || null,
        logo_url: form.logo_url || null,
      })
      .eq('id', company?.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleCurrencyChange(value: string) {
    setCurrency(value)
    localStorage.setItem('sanchos_currency', value)
  }

  function handleLanguageChange(value: string) {
    setLanguage(value)
    localStorage.setItem('sanchos_language', value)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 max-w-2xl mx-auto space-y-4">

      {/* Company Profile */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#F0F4FB] flex items-center justify-center">
            <Building2 size={15} className="text-[#1A3A6B]" />
          </div>
          <h3 className="font-bold text-[#0D1B3E] text-sm">Company Profile</h3>
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Company Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Address</label>
            <input
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="e.g. Bole, Addis Ababa"
              className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Logo URL</label>
            <input
              value={form.logo_url}
              onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-[#1A3A6B] text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin"/> : saved ? <Check size={16}/> : null}
            {saved ? 'Saved!' : 'Save Company Info'}
          </button>
        </form>
      </div>

      {/* System Preferences */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#F0F4FB] flex items-center justify-center">
            <Globe size={15} className="text-[#1A3A6B]" />
          </div>
          <h3 className="font-bold text-[#0D1B3E] text-sm">System Preferences</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Currency</label>
            <div className="flex gap-2">
              {['ETB', 'USD'].map(c => (
                <button key={c} type="button" onClick={() => handleCurrencyChange(c)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    currency === c
                      ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white'
                      : 'border-[#E2E8F4] text-[#4A5880]'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#9AAAC8] mt-1.5">Applies to how amounts are displayed across the app on this device.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#4A5880] mb-1.5 block">Language</label>
            <div className="flex gap-2">
              {[{ key: 'en', label: 'English' }, { key: 'am', label: 'አማርኛ' }].map(l => (
                <button key={l.key} type="button" onClick={() => handleLanguageChange(l.key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    language === l.key
                      ? 'border-[#1A3A6B] bg-[#1A3A6B] text-white'
                      : 'border-[#E2E8F4] text-[#4A5880]'
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#9AAAC8] mt-1.5">Applies to this device only, for now.</p>
          </div>
        </div>
      </div>
    </div>
  )
}