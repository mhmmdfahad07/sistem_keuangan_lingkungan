'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserProfile, Lingkungan } from '@/lib/types'
import { createClient } from '@/utils/supabase/client'

interface ClientDashboardShellProps {
  initialProfile: UserProfile | null
  lingkunganList: Lingkungan[]
  children: React.ReactNode
}

export function ClientDashboardShell({
  initialProfile,
  lingkunganList,
  children,
}: ClientDashboardShellProps) {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile] = useState<UserProfile | null>(initialProfile)
  const [selectedLingkunganId, setSelectedLingkunganId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selected_lingkungan_id')
      if (saved) return saved
    }
    return initialProfile?.lingkungan_id || (lingkunganList.length > 0 ? lingkunganList[0].id : null)
  })

  useEffect(() => {
    if (selectedLingkunganId) {
      localStorage.setItem('selected_lingkungan_id', selectedLingkunganId)
    }
  }, [selectedLingkunganId])

  const handleLingkunganChange = (id: string) => {
    setSelectedLingkunganId(id)
    localStorage.setItem('selected_lingkungan_id', id)
    router.refresh()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar userRole={userProfile?.role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          userProfile={userProfile}
          lingkunganList={lingkunganList}
          selectedLingkunganId={selectedLingkunganId}
          onLingkunganChange={handleLingkunganChange}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 text-slate-900">
          {children}
        </main>
      </div>
    </div>
  )
}

