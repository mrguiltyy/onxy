import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await supabaseServer()
  await supabase.auth.signOut()
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return NextResponse.redirect(new URL('/login', url))
}

export async function GET() { return POST() }
