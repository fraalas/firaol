import Link from 'next/link'
import { SanchosLogo } from '@/components/ui/SanchosLogo'
import { ShieldOff } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E2E8F4] overflow-hidden">
        <div className="flex flex-col items-center pt-10 pb-6 px-8 text-center">
          <SanchosLogo size={80}/>
          <div className="w-14 h-14 rounded-full bg-[#FFFBEB] flex items-center justify-center mt-5 mb-3">
            <ShieldOff size={26} className="text-[#92400E]"/>
          </div>
          <h1 className="text-xl font-bold text-[#0D1B3E] mt-1">Accounts by Invitation Only</h1>
          <p className="text-sm text-[#9AAAC8] mt-2">
            Public sign-up is disabled. Your CEO, General Manager, or HR creates your
            account and gives you login credentials. Sales Agents are set up by their
            Sales Manager.
          </p>
          <Link href="/auth/login"
            className="w-full bg-[#075290] text-white font-bold py-4 rounded-xl text-sm mt-6 block">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}