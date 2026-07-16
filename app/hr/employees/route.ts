import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const callerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser(token)
    if (callerError || !caller) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: callerProfile } = await callerClient
      .from('profiles').select('role, company_id').eq('id', caller.id).single()

    const allowedRoles = ['ceo', 'general_manager', 'hr']
    if (!callerProfile || !allowedRoles.includes(callerProfile.role)) {
      return NextResponse.json({ error: 'You do not have permission to create employee logins' }, { status: 403 })
    }

    const { employeeId, role } = await req.json()
    if (!employeeId || !role) {
      return NextResponse.json({ error: 'employeeId and role are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: employee, error: empError } = await admin
      .from('employees').select('*').eq('id', employeeId).single()
    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }
    if (employee.company_id !== callerProfile.company_id) {
      return NextResponse.json({ error: 'Employee belongs to a different company' }, { status: 403 })
    }
    if (employee.profile_id) {
      return NextResponse.json({ error: 'This employee already has a login' }, { status: 400 })
    }
    if (!employee.email) {
      return NextResponse.json({ error: 'Employee has no email on file' }, { status: 400 })
    }

    const tempPassword = generateTempPassword()

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: employee.email,
      password: tempPassword,
      email_confirm: true,
    })
    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? 'Failed to create login' }, { status: 400 })
    }

    const { error: profileError } = await admin.from('profiles').insert({
      id: created.user.id,
      full_name: employee.full_name,
      phone: employee.phone,
      role,
      company_id: employee.company_id,
      department: employee.department,
      position: employee.job_title,
      status: 'active',
    })
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    await admin.from('employees').update({ profile_id: created.user.id }).eq('id', employeeId)

    return NextResponse.json({ email: employee.email, tempPassword })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unexpected error' }, { status: 500 })
  }
}