import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClientDashboardShell } from './ClientDashboardShell'
import { UserProfile, Lingkungan } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  let profile: UserProfile | null = null
  let lingkunganList: Lingkungan[] = []

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*, lingkungan:lingkungan_id(nama_lingkungan)')
        .eq('id', user.id)
        .maybeSingle()

      if (userData) {
        profile = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          lingkungan_id: userData.lingkungan_id,
          lingkungan_nama: userData.lingkungan?.nama_lingkungan,
        }
      } else {
        profile = {
          id: user.id,
          email: user.email || 'bendahara@example.com',
          role: 'BENDAHARA',
          lingkungan_id: null,
        }
      }

      const { data: lData } = await supabase
        .from('lingkungan')
        .select('*')
        .order('nama_lingkungan', { ascending: true })

      if (lData) lingkunganList = lData
    }
  } catch (err) {
    console.log('Supabase connection error in layout:', err)
  }

  // Check Demo Cookie fallback if not logged in via Supabase Auth
  if (!profile) {
    const demoEmail = cookieStore.get('demo_user_email')?.value
    const demoRole = cookieStore.get('demo_user_role')?.value as any

    if (demoEmail) {
      profile = {
        id: 'demo-user-id',
        email: demoEmail,
        role: demoRole || (demoEmail.includes('sekretaris') ? 'SEKRETARIS' : demoEmail.includes('paroki') ? 'PAROKI' : 'BENDAHARA'),
        lingkungan_id: null,
      }
    } else {
      redirect('/login')
    }
  }

  return (
    <ClientDashboardShell initialProfile={profile} lingkunganList={lingkunganList}>
      {children}
    </ClientDashboardShell>
  )
}
