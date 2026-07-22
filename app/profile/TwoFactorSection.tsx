'use client'
import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldOff, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function TwoFactorSection() {
  const supabase = createClient()
  const [enabled,   setEnabled]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [qrCode,    setQrCode]    = useState('')
  const [secret,    setSecret]    = useState('')
  const [factorId,  setFactorId]  = useState('')
  const [code,      setCode]      = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error,     setError]     = useState('')
  const [disabling, setDisabling] = useState(false)

  async function checkStatus() {
    const { data } = await supabase.auth.mfa.listFactors()
    setEnabled(!!data?.totp.some(f => f.status === 'verified'))
    setLoading(false)
  }

  useEffect(() => { checkStatus() }, [])

  async function startEnroll() {
    setError('')
    const { data: existing } = await supabase.auth.mfa.listFactors()
   const stale = existing?.totp.find(f => (f.status as string) === 'unverified')
    if (stale) await supabase.auth.mfa.unenroll({ factorId: stale.id })

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error || !data) {
      setError(error?.message ?? 'Could not start setup')
      return
    }
    setFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setShowSetup(true)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    setError('')

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challenge) {
      setError('Could not verify. Please try again.')
      setVerifying(false)
      return
    }

    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
    if (error) {
      setError('Incorrect code. Please check your authenticator app and try again.')
      setVerifying(false)
      return
    }

    setShowSetup(false)
    setCode('')
    setVerifying(false)
    await checkStatus()
  }

  async function handleDisable() {
    if (!confirm('Turn off two-factor authentication? This makes your account less secure.')) return
    setDisabling(true)
    const { data } = await supabase.auth.mfa.listFactors()
    const totp = data?.totp.find(f => f.status === 'verified')
    if (totp) await supabase.auth.mfa.unenroll({ factorId: totp.id })
    setDisabling(false)
    await checkStatus()
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E8F4]">
        <span className="text-xs font-bold text-[#9AAAC8] uppercase tracking-wider">Two-Factor Authentication</span>
      </div>
      <div className="p-4">
        {enabled ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F0FDF4] flex-shrink-0">
              <ShieldCheck size={17} className="text-[#166534]"/>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#0D1B3E]">2FA is enabled</div>
              <div className="text-xs text-[#9AAAC8]">Your account is protected with an authenticator app</div>
            </div>
            <button onClick={handleDisable} disabled={disabling}
              className="text-xs font-bold text-red-500 flex items-center gap-1 disabled:opacity-50">
              {disabling ? <Loader2 size={12} className="animate-spin"/> : <ShieldOff size={12}/>}
              Turn off
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#FFFBEB] flex-shrink-0">
              <ShieldOff size={17} className="text-[#92400E]"/>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#0D1B3E]">2FA is not enabled</div>
              <div className="text-xs text-[#9AAAC8]">Add an extra layer of security to your account</div>
            </div>
            <button onClick={startEnroll} className="text-xs font-bold text-[#1F4FA8]">
              Enable
            </button>
          </div>
        )}
      </div>

      {showSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0D1B3E] text-base">Set up Authenticator</h3>
              <button onClick={() => { setShowSetup(false); setCode(''); setError('') }} className="text-[#9AAAC8]"><X size={20}/></button>
            </div>
            <p className="text-sm text-[#4A5880] mb-3">
              Scan this QR code with Google Authenticator, Microsoft Authenticator, or any TOTP app.
            </p>
            <div className="bg-white border border-[#E2E8F4] rounded-xl p-4 flex justify-center mb-3"
              dangerouslySetInnerHTML={{ __html: qrCode }} />
            <p className="text-[11px] text-[#9AAAC8] mb-1">Can't scan? Enter this code manually:</p>
            <div className="bg-[#F5F7FB] rounded-lg px-3 py-2 text-xs font-mono text-[#0D1B3E] mb-4 break-all">{secret}</div>

            <form onSubmit={handleVerify} className="space-y-3">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">{error}</div>}
              <input
                type="text" inputMode="numeric" maxLength={6} autoFocus
                placeholder="Enter 6-digit code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-center text-lg tracking-[0.3em] font-bold text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
              />
              <button type="submit" disabled={verifying || code.length !== 6}
                className="w-full bg-[#1A3A6B] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {verifying && <Loader2 size={16} className="animate-spin"/>}
                {verifying ? 'Verifying...' : 'Confirm & Enable'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}