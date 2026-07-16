'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { SanchosLogo } from '@/components/ui/SanchosLogo'

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
        // Check whether this account requires a second factor (TOTP) before full access
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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E2E8F4] overflow-hidden">
        <div className="flex flex-col items-center pt-10 pb-6 px-8">
          <SanchosLogo size={80}/>
          <h1 className="text-2xl font-bold text-[#0D1B3E] mt-4">Welcome Back!</h1>
          <p className="text-sm text-[#9AAAC8] mt-1">Login to your account</p>
        </div>
        <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          {msg   && <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">{msg}</div>}
          <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] focus-within:border-[#1A3A6B]">
            <Mail size={18} className="text-[#9AAAC8] flex-shrink-0"/>
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
          </div>
          <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] focus-within:border-[#1A3A6B]">
            <Lock size={18} className="text-[#9AAAC8] flex-shrink-0"/>
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required
              className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#9AAAC8]">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#4A5880]">
              <input type="checkbox" className="rounded accent-[#1A3A6B]"/> Remember me
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-[#1F4FA8] font-semibold">Forgot Password?</Link>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#1A3A6B] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-70">
            {loading && <Loader2 size={16} className="animate-spin"/>}
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="text-center text-sm text-[#4A5880]">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[#1F4FA8] font-bold">Sign up</Link>
          </p>
        </form>
        <div className="h-32 bg-gradient-to-br from-[#E8F0FA] to-[#C8D9F0] flex items-center justify-center">
          <svg width="140" height="90" viewBox="0 0 160 100" fill="none" opacity="0.3">
            <rect x="20" y="40" width="120" height="60" fill="#1A3A6B"/>
            <polygon points="10,40 80,5 150,40" fill="#2E6DD4"/>
            <rect x="60" y="55" width="40" height="45" fill="#4A8FE8"/>
            <rect x="25" y="50" width="25" height="25" fill="#4A8FE8"/>
            <rect x="110" y="50" width="25" height="25" fill="#4A8FE8"/>
          </svg>
        </div>
      </div>
    </div>
  )
}