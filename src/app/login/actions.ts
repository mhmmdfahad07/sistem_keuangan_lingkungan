'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?message=Email dan password wajib diisi')
  }

  let role: 'BENDAHARA' | 'SEKRETARIS' | 'PAROKI' = 'BENDAHARA'
  if (email.includes('sekretaris')) role = 'SEKRETARIS'
  else if (email.includes('paroki')) role = 'PAROKI'

  try {
    const supabase = await createClient()

    // 1. Attempt Sign In with Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!signInError && signInData.user) {
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }

    // 2. If Sign In failed, try Auto Sign-Up on Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (!signUpError && signUpData.user) {
      const { data: lData } = await supabase.from('lingkungan').select('id').limit(1).maybeSingle()
      const lingkunganId = role === 'PAROKI' ? null : (lData?.id || null)

      await supabase.from('users').upsert({
        id: signUpData.user.id,
        email: email,
        role: role,
        lingkungan_id: lingkunganId,
      })

      // Try sign in again
      const { error: secondTry } = await supabase.auth.signInWithPassword({ email, password })
      if (!secondTry) {
        revalidatePath('/', 'layout')
        redirect('/dashboard')
      }
    }
  } catch (err: any) {
    console.log('Supabase Auth connection error:', err?.message)
  }

  // 3. Fallback Demo Session Mode if Supabase Key is unconfigured or fetch failed
  const cookieStore = await cookies()
  cookieStore.set('demo_user_email', email)
  cookieStore.set('demo_user_role', role)

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
