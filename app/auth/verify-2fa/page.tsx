'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { SanchosLogo } from '@/components/ui/SanchosLogo'

export default function Verify2FAPage() {
  const supabase = createClient()
  const [code,        setCode]        = useState('')
  const [factorId,    setFactorId]    = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [loading,     setLoading]     = useState(true)
  const [verifying,   setVerifying]   = useState(false)
  const [error,       setError]       = useState('')

  async function startChallenge() {
    setError('')
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.replace('/auth/login'); return }

    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
    if (listError || !factors) {
      setError('Could not load your 2FA setup. Please try logging in again.')
      setLoading(false)
      return
    }
    const totp = factors.totp.find(f => f.status === 'verified')
    if (!totp) {
      window.location.replace('/dashboard')
      return
    }
    setFactorId(totp.id)

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totp.id })
    if (challengeError || !challenge) {
      setError('Could not start verification. Please try again.')
      setLoading(false)
      return
    }
    setChallengeId(challenge.id)
    setLoading(false)
  }

  useEffect(() => { startChallenge() }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    setError('')

    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (error) {
      setError('Incorrect code. Please try again.')
      setVerifying(false)
      startChallenge()
      setCode('')
      return
    }

    window.location.replace('/dashboard')
  }

  async function handleCancel() {
    await supabase.auth.signOut()
    window.location.replace('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E2E8F4] overflow-hidden">
        <div className="flex flex-col items-center pt-10 pb-6 px-8">
          <SanchosLogo size={64}/>
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center mt-4 mb-2">
            <ShieldCheck size={26} className="text-[#1D4ED8]"/>
          </div>
          <h1 className="text-xl font-bold text-[#0D1B3E] mt-1">Two-Factor Verification</h1>
          <p className="text-sm text-[#9AAAC8] mt-1 text-center">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {loading ? (
          <div className="pb-10 flex justify-center">
            <Loader2 size={22} className="animate-spin text-[#1A3A6B]"/>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="px-8 pb-8 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-[#E2E8F4] rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold text-[#0D1B3E] outline-none focus:border-[#1A3A6B] bg-[#FAFBFE]"
            />
            <button type="submit" disabled={verifying || code.length !== 6}
              className="w-full bg-[#1A3A6B] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {verifying && <Loader2 size={16} className="animate-spin"/>}
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" onClick={handleCancel}
              className="w-full text-sm text-[#9AAAC8] font-semibold py-1">
              Cancel and sign out
            </button>
          </form>
        )}
      </div>
    </div>
  )
}