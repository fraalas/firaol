'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, User, Phone, Mail, Lock, Loader2 } from 'lucide-react'
import { SanchosLogo } from '@/components/ui/SanchosLogo'

export default function SignupPage() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Note: role is intentionally NOT sent here. Every self-signup becomes
      // a 'staff' account by default (enforced server-side by the
      // handle_new_user() database trigger — the frontend has no say in it).
      // Elevated roles (Agent, Sales Manager, HR, GM, CEO) are only ever
      // granted by HR/CEO/GM via the "Create Login" flow in HR > Employees.
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, phone } }
      })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) { window.location.replace('/auth/login'); return }
        window.location.replace('/dashboard')
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
          <h1 className="text-2xl font-bold text-[#0D1B3E] mt-4">Create Your Account</h1>
          <p className="text-sm text-[#9AAAC8] mt-1">Join Sanchos Real Estate CRM</p>
        </div>
        <form onSubmit={handleSignup} className="px-8 pb-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {[
            { icon: <User size={18}/>,  placeholder: 'Full Name',     type: 'text',  val: fullName, set: setFullName },
            { icon: <Phone size={18}/>, placeholder: 'Phone Number',  type: 'tel',   val: phone,    set: setPhone    },
            { icon: <Mail size={18}/>,  placeholder: 'Email address', type: 'email', val: email,    set: setEmail    },
          ].map(f => (
            <div key={f.placeholder} className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] focus-within:border-[#1A3A6B]">
              <span className="text-[#9AAAC8] flex-shrink-0">{f.icon}</span>
              <input type={f.type} placeholder={f.placeholder} value={f.val}
                onChange={e => f.set(e.target.value)} required
                className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
            </div>
          ))}
          <div className="flex items-center gap-3 border border-[#E2E8F4] rounded-xl px-4 py-3.5 bg-[#FAFBFE] focus-within:border-[#1A3A6B]">
            <Lock size={18} className="text-[#9AAAC8] flex-shrink-0"/>
            <input type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="flex-1 bg-transparent text-sm text-[#0D1B3E] outline-none placeholder:text-[#9AAAC8]"/>
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#9AAAC8]">
              {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <p className="text-xs text-[#9AAAC8] -mt-1">
            New accounts start with basic Staff access (Attendance & Leave only). Your manager or HR can grant additional access afterward.
          </p>
          <button type="submit" disabled={loading}
            className="w-full bg-[#1A3A6B] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-70">
            {loading && <Loader2 size={16} className="animate-spin"/>}
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          <p className="text-center text-sm text-[#4A5880]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#1F4FA8] font-bold">Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}