'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server'

interface Profile { role: string }

async function requireAdmin(): Promise<{ ok: true; adminId: string } | { ok: false; error: string }> {
  const supa = await supabaseServer()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }
  const { data: pRaw } = await supa.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (pRaw as Profile | null)?.role
  if (role !== 'super_admin') return { ok: false, error: 'Admin only.' }
  return { ok: true, adminId: user.id }
}

export async function adminCreditUser(targetId: string, cents: number, reason: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  if (Math.abs(cents) > 100_000_00) return { ok: false, error: 'Max single credit/debit is $100,000.' }
  if (cents === 0) return { ok: false, error: 'Amount must be non-zero.' }
  if (!reason || reason.length < 2) return { ok: false, error: 'Reason required.' }

  const admin = supabaseAdmin()
  const { error } = await admin.rpc('admin_credit_user', {
    p_admin_id:  gate.adminId,
    p_target_id: targetId,
    p_cents:     cents,
    p_reason:    reason.slice(0, 300),
  } as never)
  if (error) return { ok: false, error: error.message }

  // Notify the user
  await admin.from('notifications').insert({
    user_id: targetId,
    type:    cents >= 0 ? 'admin_credit' : 'admin_debit',
    title:   cents >= 0 ? `Wallet credited ${'+'+cents/100} USD` : `Wallet debited ${cents/100} USD`,
    body:    reason,
    link_url: '/dashboard/balance',
  } as never)

  revalidatePath(`/admin/users/${targetId}`)
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function adminChangeRole(targetId: string, newRole: 'user'|'reseller'|'support'|'super_admin'): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  if (!['user','reseller','support','super_admin'].includes(newRole)) {
    return { ok: false, error: 'Invalid role.' }
  }

  const admin = supabaseAdmin()
  const { error } = await admin.from('profiles').update({ role: newRole } as never).eq('id', targetId)
  if (error) return { ok: false, error: error.message }

  await admin.from('admin_audit').insert({
    admin_id: gate.adminId, target_id: targetId, action: 'change_role', details: { new_role: newRole },
  } as never)

  await admin.from('notifications').insert({
    user_id: targetId,
    type:    'role_changed',
    title:   `Your role was changed to ${newRole}`,
    body:    'An admin updated your account role.',
    link_url: '/dashboard/account',
  } as never)

  revalidatePath(`/admin/users/${targetId}`)
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function adminSetStatus(targetId: string, newStatus: 'active'|'suspended'|'banned', reason: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  if (!['active','suspended','banned'].includes(newStatus)) {
    return { ok: false, error: 'Invalid status.' }
  }

  const admin = supabaseAdmin()
  const updates: Record<string, unknown> = { status: newStatus }
  if (newStatus !== 'active') {
    updates.suspended_reason = reason.slice(0, 300)
  } else {
    updates.suspended_reason = null
    updates.suspended_until  = null
  }

  const { error } = await admin.from('profiles').update(updates as never).eq('id', targetId)
  if (error) return { ok: false, error: error.message }

  await admin.from('admin_audit').insert({
    admin_id: gate.adminId, target_id: targetId, action: `status_${newStatus}`, details: { reason },
  } as never)

  await admin.from('notifications').insert({
    user_id: targetId,
    type:    'status_changed',
    title:   newStatus === 'active' ? 'Account reactivated' : newStatus === 'suspended' ? 'Account suspended' : 'Account banned',
    body:    reason || (newStatus === 'active' ? 'Your account is active again.' : 'See your email for details.'),
    link_url: '/dashboard/account',
  } as never)

  revalidatePath(`/admin/users/${targetId}`)
  revalidatePath('/admin/users')
  return { ok: true }
}

export async function adminResetPassword(targetEmail: string): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireAdmin()
  if (!gate.ok) return { ok: false, error: gate.error }

  const admin = supabaseAdmin()
  const { error } = await admin.auth.resetPasswordForEmail(targetEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://onxy.cc'}/auth/callback`,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
