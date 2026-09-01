import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let user = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err
    console.error('Error verifying Supabase user in Home page:', err)
  }

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}


