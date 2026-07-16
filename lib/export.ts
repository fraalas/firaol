// ─── Export utility: Excel (.xlsx) and PDF ────────────────────────────────────
// Uses: xlsx (SheetJS) for Excel, jsPDF + jspdf-autotable for PDF
// Both run client-side — no server needed

import type { Lead, Property } from '@/types/database'

// ── Excel Export ──────────────────────────────────────────────────────────────
export async function exportLeadsToExcel(leads: Lead[], filename = 'sanchos-leads') {
  const XLSX = await import('xlsx')

  const rows = leads.map(l => ({
    'Full Name':    l.full_name,
    'Phone':        l.phone ?? '',
    'Email':        l.email ?? '',
    'Location':     l.location ?? '',
    'Budget ($)':   l.budget ?? '',
    'Interest':     l.interest ?? '',
    'Stage':        l.stage.replace('_', ' '),
    'Source':       (l.source ?? '').replace('_', ' '),
    'Notes':        l.notes ?? '',
    'Created':      new Date(l.created_at).toLocaleDateString(),
    'Updated':      new Date(l.updated_at).toLocaleDateString(),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 22 }, { wch: 16 }, { wch: 26 }, { wch: 22 },
    { wch: 12 }, { wch: 26 }, { wch: 16 }, { wch: 14 },
    { wch: 30 }, { wch: 14 }, { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')

  // Summary sheet
  const summary = [
    ['Sanchos Real Estate CRM — Leads Export'],
    ['Generated:', new Date().toLocaleString()],
    ['Total leads:', leads.length],
    ['Closed deals:', leads.filter(l => l.stage === 'closed').length],
    ['Conversion:', leads.length ? `${Math.round(leads.filter(l=>l.stage==='closed').length/leads.length*100)}%` : '0%'],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(summary)
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary')

  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0,10)}.xlsx`)
}

export async function exportPropertiesToExcel(properties: Property[], filename = 'sanchos-properties') {
  const XLSX = await import('xlsx')

  const rows = properties.map(p => ({
    'Title':       p.title,
    'Address':     p.address ?? '',
    'City':        p.city ?? 'Addis Ababa',
    'Price ($)':   p.price ?? '',
    'Type':        p.price_type === 'rent' ? 'For Rent' : 'For Sale',
    'Status':      p.status,
    'Bedrooms':    p.bedrooms ?? '',
    'Bathrooms':   p.bathrooms ?? '',
    'Area (m²)':   p.area_sqm ?? '',
    'Description': p.description ?? '',
    'Listed':      new Date(p.created_at).toLocaleDateString(),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    {wch:28},{wch:24},{wch:16},{wch:12},{wch:12},
    {wch:12},{wch:10},{wch:10},{wch:10},{wch:32},{wch:14}
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Properties')
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0,10)}.xlsx`)
}

// ── PDF Export ────────────────────────────────────────────────────────────────
export async function exportLeadsToPDF(leads: Lead[], agentName = 'Sanchos Real Estate') {
  const { default: jsPDF } = await import('jspdf')
  // @ts-ignore
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFillColor(26, 58, 107) // #1A3A6B
  doc.rect(0, 0, 297, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SANCHOS REAL ESTATE CRM', 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Leads Report — ' + new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }), 14, 17)

  // Stats row
  doc.setTextColor(26, 58, 107)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const closedDeals   = leads.filter(l => l.stage === 'closed').length
  const convRate      = leads.length ? Math.round(closedDeals / leads.length * 100) : 0
  const statY = 30
  ;[
    [`${leads.length}`, 'Total Leads'],
    [`${leads.filter(l=>l.stage==='new_lead').length}`, 'New Leads'],
    [`${closedDeals}`, 'Closed Deals'],
    [`${convRate}%`, 'Conversion Rate'],
  ].forEach(([val, label], i) => {
    const x = 14 + i * 70
    doc.setFontSize(16)
    doc.text(val, x, statY)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(label, x, statY + 6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 58, 107)
  })

  // Table
  autoTable(doc, {
    startY: 45,
    head: [['Name', 'Phone', 'Location', 'Budget', 'Stage', 'Source', 'Created']],
    body: leads.map(l => [
      l.full_name,
      l.phone ?? '—',
      l.location ?? '—',
      l.budget ? `$${l.budget.toLocaleString()}` : '—',
      l.stage.replace('_', ' '),
      (l.source ?? '—').replace('_', ' '),
      new Date(l.created_at).toLocaleDateString(),
    ]),
    headStyles: {
      fillColor: [26, 58, 107],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 50] },
    alternateRowStyles: { fillColor: [245, 247, 251] },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 32 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 28 },
      6: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: any) => {
      // Footer
      doc.setFontSize(7)
      doc.setTextColor(160, 160, 160)
      doc.text(
        `Sanchos Real Estate CRM  •  Page ${data.pageNumber}  •  ${agentName}`,
        14,
        doc.internal.pageSize.height - 8
      )
    },
  })

  doc.save(`sanchos-leads-${new Date().toISOString().slice(0,10)}.pdf`)
}
