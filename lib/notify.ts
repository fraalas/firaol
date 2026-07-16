// ─── Client-side notification helper ─────────────────────────────────────────

export interface NotifyPayload {
  to: string | string[]
  message: string
  type?: 'sms' | 'whatsapp'
}

export async function sendNotification(payload: NotifyPayload) {
  const res = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to send notification')
  return res.json()
}

// Pre-built message templates
export const templates = {
  newLead: (agentName: string, leadName: string) =>
    `🏠 Sanchos CRM: Hi ${agentName}, you have a new lead — ${leadName}. Log in to view details.`,

  activityReminder: (agentName: string, activity: string, time: string) =>
    `⏰ Sanchos CRM: Reminder for ${agentName} — "${activity}" scheduled at ${time}. Check your activities.`,

  leadStageChange: (leadName: string, oldStage: string, newStage: string) =>
    `📊 Sanchos CRM: Lead "${leadName}" moved from ${oldStage} → ${newStage}.`,

  dealClosed: (agentName: string, leadName: string) =>
    `🎉 Sanchos CRM: Congratulations ${agentName}! Deal closed with ${leadName}. Great work!`,

  propertyListed: (title: string, price: string) =>
    `🏘️ Sanchos CRM: New property listed — "${title}" at ${price}. View in your Properties.`,
}
