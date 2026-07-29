'use client'
import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, CheckCircle2, Loader2, Users, Building2 } from 'lucide-react'
import { exportLeadsToExcel, exportPropertiesToExcel, exportLeadsToPDF } from '@/lib/export'
import type { Lead, Property } from '@/types/database'

interface Props {
  leads: Lead[]
  properties: Property[]
  agentName: string
}

type ExportStatus = 'idle' | 'loading' | 'done' | 'error'

export function ExportClient({ leads, properties, agentName }: Props) {
  const [status, setStatus] = useState<Record<string, ExportStatus>>({})

  async function run(key: string, fn: () => Promise<void>) {
    setStatus(s => ({ ...s, [key]: 'loading' }))
    try {
      await fn()
      setStatus(s => ({ ...s, [key]: 'done' }))
      setTimeout(() => setStatus(s => ({ ...s, [key]: 'idle' })), 3000)
    } catch (e) {
      console.error(e)
      setStatus(s => ({ ...s, [key]: 'error' }))
    }
  }

  const EXPORTS = [
    {
      key: 'leads-excel',
      icon: <FileSpreadsheet size={22} className="text-[#166534]" />,
      bg: '#F0FDF4',
      title: 'Leads → Excel (.xlsx)',
      desc: `${leads.length} leads • all fields, summary sheet`,
      fn: () => exportLeadsToExcel(leads),
    },
    {
      key: 'leads-pdf',
      icon: <FileText size={22} className="text-[#991B1B]" />,
      bg: '#FEF2F2',
      title: 'Leads → PDF Report',
      desc: `${leads.length} leads • branded, printable`,
      fn: () => exportLeadsToPDF(leads, agentName),
    },
    {
      key: 'props-excel',
      icon: <FileSpreadsheet size={22} className="text-[#0F766E]" />,
      bg: '#F0FDFA',
      title: 'Properties → Excel (.xlsx)',
      desc: `${properties.length} properties • specs, status, price`,
      fn: () => exportPropertiesToExcel(properties),
    },
  ]

  // Stage breakdown for quick stats
  const stageCount: Record<string, number> = {}
  leads.forEach(l => { stageCount[l.stage] = (stageCount[l.stage] ?? 0) + 1 })
  const closedDeals = stageCount['closed'] ?? 0
  const convRate    = leads.length ? Math.round(closedDeals / leads.length * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-4">

      {/* Stats preview */}
      <div className="bg-white rounded-2xl border border-[#E2E8F4] p-4">
        <div className="text-sm font-bold text-[#0D1B3E] mb-3">Data preview</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F7FB] rounded-xl p-3 flex items-center gap-3">
            <Users size={18} className="text-[#075290]" />
            <div>
              <div className="text-lg font-extrabold text-[#0D1B3E]">{leads.length}</div>
              <div className="text-[10px] text-[#9AAAC8]">Total leads</div>
            </div>
          </div>
          <div className="bg-[#F5F7FB] rounded-xl p-3 flex items-center gap-3">
            <Building2 size={18} className="text-[#065F46]" />
            <div>
              <div className="text-lg font-extrabold text-[#0D1B3E]">{properties.length}</div>
              <div className="text-[10px] text-[#9AAAC8]">Properties</div>
            </div>
          </div>
          <div className="bg-[#F5F7FB] rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-[#065F46]">{closedDeals}</div>
            <div className="text-[10px] text-[#9AAAC8]">Closed deals</div>
          </div>
          <div className="bg-[#F5F7FB] rounded-xl p-3 text-center">
            <div className="text-lg font-extrabold text-[#075290]">{convRate}%</div>
            <div className="text-[10px] text-[#9AAAC8]">Conversion</div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="text-sm font-bold text-[#0D1B3E]">Choose format</div>
      <div className="space-y-3">
        {EXPORTS.map(exp => {
          const st = status[exp.key] ?? 'idle'
          return (
            <div key={exp.key} className="bg-white rounded-2xl border border-[#E2E8F4] p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: exp.bg }}>
                {exp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#0D1B3E]">{exp.title}</div>
                <div className="text-xs text-[#9AAAC8] mt-0.5">{exp.desc}</div>
              </div>
              <button
                onClick={() => run(exp.key, exp.fn)}
                disabled={st === 'loading'}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  st === 'done'
                    ? 'bg-[#D1FAE5]'
                    : st === 'error'
                    ? 'bg-[#FEE2E2]'
                    : 'bg-[#075290] hover:bg-[#1F4FA8] active:scale-95'
                }`}
              >
                {st === 'loading' ? <Loader2 size={18} className="text-white animate-spin" /> :
                 st === 'done'    ? <CheckCircle2 size={18} className="text-[#065F46]" /> :
                 st === 'error'   ? <span className="text-red-500 text-xs font-bold">!</span> :
                 <Download size={18} className="text-white" />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4">
        <div className="text-xs font-bold text-[#1D4ED8] mb-1">📋 About exports</div>
        <div className="text-xs text-[#1D4ED8] leading-relaxed space-y-1">
          <div>• Excel files open in Microsoft Excel, Google Sheets, or LibreOffice</div>
          <div>• PDF reports are branded with Sanchos logo and can be printed</div>
          <div>• Files download directly to your device</div>
          <div>• As admin you see all agents' data; agents see only their own</div>
        </div>
      </div>
    </div>
  )
}
