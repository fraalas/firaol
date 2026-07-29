'use client'
import { useState } from 'react'
import { Bell, Send, Loader2, CheckCircle2, MessageSquare, Phone } from 'lucide-react'
import { sendNotification, templates } from '@/lib/notify'

interface Agent {
  id: string
  full_name: string
  phone: string | null
}

interface Props {
  agents: Agent[]
}

export function NotifyPanel({ agents }: Props) {
  const [selected, setSelected]   = useState<string[]>([])
  const [message, setMessage]     = useState('')
  const [type, setType]           = useState<'sms' | 'whatsapp'>('whatsapp')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState('')

  const agentsWithPhone = agents.filter(a => a.phone)

  function toggleAgent(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAll() {
    setSelected(agentsWithPhone.map(a => a.id))
  }

  async function handleSend() {
    if (!selected.length || !message.trim()) return
    setSending(true)
    setError('')
    try {
      const numbers = agentsWithPhone
        .filter(a => selected.includes(a.id))
        .map(a => a.phone!)
        .filter(Boolean)

      await sendNotification({ to: numbers, message: message.trim(), type })
      setSent(true)
      setMessage('')
      setSelected([])
      setTimeout(() => setSent(false), 4000)
    } catch (e: any) {
      setError(e.message ?? 'Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F4] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E8F4] flex items-center gap-2">
        <Bell size={15} className="text-[#075290]" />
        <span className="text-sm font-bold text-[#0D1B3E]">Send Notification</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {(['whatsapp', 'sms'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all ${
                type === t ? 'bg-[#075290] text-white border-[#075290]' : 'border-[#E2E8F4] text-[#4A5880]'
              }`}>
              {t === 'whatsapp' ? <MessageSquare size={13}/> : <Phone size={13}/>}
              {t === 'whatsapp' ? 'WhatsApp' : 'SMS'}
            </button>
          ))}
        </div>

        {/* Agent selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#4A5880]">
              Recipients ({selected.length}/{agentsWithPhone.length})
            </span>
            <button onClick={selectAll} className="text-xs text-[#1F4FA8] font-semibold">
              Select all
            </button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {agentsWithPhone.length === 0 && (
              <p className="text-xs text-[#9AAAC8] text-center py-3">
                No agents have phone numbers saved.
              </p>
            )}
            {agentsWithPhone.map(agent => (
              <button key={agent.id} onClick={() => toggleAgent(agent.id)}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left border transition-all ${
                  selected.includes(agent.id)
                    ? 'bg-[#EFF6FF] border-[#075290]'
                    : 'border-[#E2E8F4] hover:bg-[#FAFBFE]'
                }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selected.includes(agent.id) ? 'bg-[#075290] border-[#075290]' : 'border-[#E2E8F4]'
                }`}>
                  {selected.includes(agent.id) && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#0D1B3E] truncate">{agent.full_name}</div>
                  <div className="text-[10px] text-[#9AAAC8]">{agent.phone}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick templates */}
        <div>
          <div className="text-xs font-semibold text-[#4A5880] mb-2">Quick templates</div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { label: 'New lead', msg: '🏠 Sanchos CRM: You have a new lead assigned. Please login to follow up.' },
              { label: 'Reminder', msg: '⏰ Sanchos CRM: You have activities scheduled today. Please check your dashboard.' },
              { label: 'Team update', msg: '📢 Sanchos CRM: Team meeting today at 4:30 PM. Please be prepared with your pipeline update.' },
            ].map(tpl => (
              <button key={tpl.label} onClick={() => setMessage(tpl.msg)}
                className="flex-shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-full bg-[#F5F7FB] border border-[#E2E8F4] text-[#4A5880] hover:border-[#075290] transition-colors">
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message input */}
        <div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Type your message..."
            className="w-full border border-[#E2E8F4] rounded-xl px-4 py-3 text-sm text-[#0D1B3E] outline-none focus:border-[#075290] bg-[#FAFBFE] resize-none transition-colors"
          />
          <div className="text-[10px] text-[#9AAAC8] mt-1">{message.length}/160 characters</div>
        </div>

        {error && (
          <div className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !selected.length || !message.trim()}
          className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
            sent ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#075290] text-white hover:bg-[#1F4FA8]'
          }`}
        >
          {sending  ? <Loader2 size={16} className="animate-spin" /> :
           sent     ? <CheckCircle2 size={16} /> :
           <Send size={16} />}
          {sending ? 'Sending...' : sent ? `Sent to ${selected.length} agent${selected.length > 1 ? 's' : ''}!` : `Send to ${selected.length || 0} agent${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
