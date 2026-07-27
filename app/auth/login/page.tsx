'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [msg, setMsg]           = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMsg('Connecting...')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMsg('')
        setError(
          error.message.includes('Email not confirmed')
            ? 'Please confirm your email first — check your inbox.'
            : error.message.includes('Invalid login')
            ? 'Wrong email or password. Please try again.'
            : error.message
        )
        setLoading(false)
        return
      }
      if (data?.user) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
          setMsg('')
          window.location.replace('/auth/verify-2fa')
          return
        }
        setMsg('Success! Redirecting...')
        setTimeout(() => { window.location.replace('/dashboard') }, 800)
      }
    } catch (err: any) {
      setError('Connection error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#F5F7FB]">

      {/* Left branding panel — desktop only */}
      <div className="hidden md:flex relative overflow-hidden bg-[#1A3A6B] flex-col items-center justify-center px-12 py-16">

        {/* Geometric pattern texture — subtle, behind everything */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: "url('/pattern.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Floating background shapes — behind everything, never overlapping text */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute w-80 h-80 rounded-full bg-white/5 -top-20 -right-20 animate-float-slow"/>
          <div className="absolute w-64 h-64 rounded-full bg-white/5 -bottom-24 -left-16 animate-float-slower"/>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <img src="/sanchos-logo.png" alt="Sanchos Real Estate"
            className="h-28 w-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0ms' }} draggable={false}/>
          <h2 className="text-white text-3xl font-bold text-center leading-tight max-w-md animate-fade-in-up"
            style={{ animationDelay: '120ms' }}>
            Sanchos Real Estate ERP System
          </h2>
          <p className="text-white/60 text-base mt-4 text-center max-w-sm animate-fade-in-up"
            style={{ animationDelay: '240ms' }}>
            Manage leads properties attendance and your team — all from one place.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex flex-col items-center mb-6 md:hidden">
            <img src="/sanchos-logo.png" alt="Sanchos Real Estate" className="h-20 w-auto mb-2" draggable={false}/>
          </div>

          <div className="bg-white rounded-3xl shadow-md border border-[#E2E8F4] p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-[#0D1B3E]">Welcome Back!</h1>
              <p className="text-sm text-[#9AAAC8] mt-1">Login to your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 animate-shake">{error}</div>}
              {msg   && <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 animate-fade-in-up">{msg}</div>}

              <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] transition-all duration-200 focus-within:border-[#1A3A6B] focus-within:shadow-[0_0_0_3px_rgba(26,58,107,0.08)]">
                <Mail size={18} className="text-[#9AAAC8] flex-shrink-0"/>
                <input type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
              </div>

              <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] transition-all duration-200 focus-within:border-[#1A3A6B] focus-within:shadow-[0_0_0_3px_rgba(26,58,107,0.08)]">
                <Lock size={18} className="text-[#9AAAC8] flex-shrink-0"/>
                <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#9AAAC8] transition-transform hover:scale-110">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[#4A5880]">
                  <input type="checkbox" className="rounded accent-[#1A3A6B]"/> Remember me
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-[#1F4FA8] font-semibold hover:underline">Forgot Password?</Link>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#1A3A6B] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-[#1F4FA8] hover:scale-[1.01] active:scale-[0.99] transition-all duration-150">
                {loading && <Loader2 size={16} className="animate-spin"/>}
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-[#9AAAC8] mt-6">
            Sanchos Real Estate Erp System v2.0.0
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.6s ease-out forwards;
        }

        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(-16px, 20px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(18px, -14px); }
        }
        .animate-float-slow   { animation: float-slow 9s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}