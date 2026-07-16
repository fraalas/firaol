// ─── WhatsApp / SMS Notification API Route ────────────────────────────────────
// Providers: Africa's Talking (Ethiopia SMS), Twilio (WhatsApp + SMS), mock
//
// Required .env.local vars:
//   NOTIFICATION_PROVIDER=africastalking | twilio | mock
//   (see .env.local.example for full config)

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { to, message, type = 'sms' } = await req.json() as {
      to: string | string[]
      message: string
      type?: 'sms' | 'whatsapp'
    }

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing to or message' }, { status: 400 })
    }

    const numbers  = Array.isArray(to) ? to : [to]
    const provider = process.env.NOTIFICATION_PROVIDER ?? 'mock'
    const results: { number: string; success: boolean; error?: string }[] = []

    for (const number of numbers) {
      try {
        if (provider === 'africastalking') {
          await sendAfricasTalking(number, message)
        } else if (provider === 'twilio') {
          await sendTwilio(number, message, type)
        } else {
          // Mock: just log — useful for testing without a real provider
          console.log(`[MOCK ${type.toUpperCase()}] To: ${number} | ${message}`)
        }
        results.push({ number, success: true })

        // Log in DB notifications table
        await supabase.from('notifications').insert({
          user_id: user.id,
          title:   `${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} sent`,
          body:    `To ${number}: ${message.slice(0, 80)}`,
          type:    'sms',
        })
      } catch (err: any) {
        results.push({ number, success: false, error: err.message })
      }
    }

    return NextResponse.json({ results, provider })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ── Africa's Talking (best for Ethiopia — Ethio Telecom + Safaricom) ────────
async function sendAfricasTalking(to: string, message: string) {
  const apiKey   = process.env.AT_API_KEY!
  const username = process.env.AT_USERNAME!
  const from     = process.env.AT_SENDER_ID ?? 'SANCHOS'

  if (!apiKey || !username) throw new Error('Africa\'s Talking credentials not set in .env.local')

  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      'apiKey':       apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept':       'application/json',
    },
    body: new URLSearchParams({ username, to, message, from }).toString(),
  })
  if (!res.ok) throw new Error(`Africa's Talking: ${await res.text()}`)
}

// ── Twilio (WhatsApp + International SMS) ─────────────────────────────────
async function sendTwilio(to: string, body: string, type: 'sms' | 'whatsapp') {
  const sid   = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const from  = type === 'whatsapp'
    ? process.env.TWILIO_WHATSAPP_FROM!
    : process.env.TWILIO_PHONE_NUMBER!
  const toNum = type === 'whatsapp' ? `whatsapp:${to}` : to

  if (!sid || !token) throw new Error('Twilio credentials not set in .env.local')

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: toNum, Body: body }).toString(),
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? 'Twilio error')
  }
}
