'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { SanchosLogo } from '@/components/ui/SanchosLogo'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E2E8F4] p-8">
        <div className="flex flex-col items-center mb-6">
          <SanchosLogo size={64} />
          <h1 className="text-xl font-bold text-[#0D1B3E] mt-4">Forgot Password?</h1>
          <p className="text-sm text-[#9AAAC8] mt-1 text-center">Enter your email and we'll send a reset link</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle2 size={48} className="text-green-500 mx-auto"/>
            <p className="text-sm font-semibold text-[#0D1B3E]">Reset link sent!</p>
            <p className="text-xs text-[#9AAAC8]">Check your email at <strong>{email}</strong></p>
            <Link href="/auth/login" className="block w-full bg-[#075290] text-white font-bold py-3.5 rounded-xl text-sm text-center mt-4">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
            <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] focus-within:border-[#075290]">
              <Mail size={18} className="text-[#9AAAC8] flex-shrink-0"/>
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required
                className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#075290] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#1F4FA8] transition-colors disabled:opacity-70">
              {loading && <Loader2 size={16} className="animate-spin"/>}
              Send Reset Link
            </button>
            <Link href="/auth/login" className="flex items-center justify-center gap-1 text-sm text-[#1F4FA8] font-semibold mt-2">
              <ArrowLeft size={14}/> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
