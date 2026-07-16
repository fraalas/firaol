'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { SanchosLogo } from '@/components/ui/SanchosLogo'

export default function ResetPasswordPage() {
  const supabase  = createClient()
  const router    = useRouter()
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else { setDone(true); setTimeout(() => router.push('/dashboard'), 2000) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E2E8F4] p-8">
        <div className="flex flex-col items-center mb-6">
          <SanchosLogo size={64}/>
          <h1 className="text-xl font-bold text-[#0D1B3E] mt-4">Set New Password</h1>
        </div>
        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle2 size={48} className="text-green-500 mx-auto"/>
            <p className="text-sm font-semibold text-[#0D1B3E]">Password updated! Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
            <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] focus-within:border-[#1A3A6B]">
              <Lock size={18} className="text-[#9AAAC8] flex-shrink-0"/>
              <input type={showPw ? 'text' : 'password'} placeholder="New password" value={password}
                onChange={e => setPassword(e.target.value)} required
                className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#9AAAC8]">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] focus-within:border-[#1A3A6B]">
              <Lock size={18} className="text-[#9AAAC8] flex-shrink-0"/>
              <input type="password" placeholder="Confirm new password" value={confirm}
                onChange={e => setConfirm(e.target.value)} required
                className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1A3A6B] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 size={16} className="animate-spin"/>}
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
