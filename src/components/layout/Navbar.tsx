'use client'

import React from 'react'
import { UserProfile, Lingkungan } from '@/lib/types'
import { LogOut, Building2, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface NavbarProps {
  userProfile: UserProfile | null
  lingkunganList: Lingkungan[]
  selectedLingkunganId: string | null
  onLingkunganChange: (id: string) => void
  onLogout: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  lingkunganList,
  selectedLingkunganId,
  onLingkunganChange,
  onLogout,
}) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'BENDAHARA':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-300">Bendahara</span>
      case 'SEKRETARIS':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">Sekretaris</span>
      case 'PAROKI':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-300">Pengawas Paroki</span>
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">User</span>
    }
  }

  const currentLingkunganName = lingkunganList.find(l => l.id === selectedLingkunganId)?.nama_lingkungan || 'Semua Lingkungan'

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-lg">
          <div className="w-8 h-8 rounded-lg bg-[#1a56a0] flex items-center justify-center text-white shadow-sm font-extrabold text-sm">
            SC
          </div>
          <span className="hidden sm:inline text-[#1a56a0]">Gereja St. Clara</span>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* Lingkungan Scope Indicator / Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-700">
          <Building2 className="w-4 h-4 text-[#1a56a0]" />
          {userProfile?.role === 'PAROKI' ? (
            <Select value={selectedLingkunganId || ''} onValueChange={(val) => val && onLingkunganChange(val)}>
              <SelectTrigger className="h-7 border-none bg-transparent shadow-none focus:ring-0 text-sm font-medium p-0 pr-2">
                <SelectValue placeholder="Pilih Lingkungan" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {lingkunganList.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nama_lingkungan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="font-semibold text-slate-900">{currentLingkunganName}</span>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 text-right">
          <div className="hidden md:block">
            <p className="text-xs text-gray-500 font-medium">{userProfile?.email}</p>
            <div className="mt-0.5">{getRoleBadge(userProfile?.role)}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-5 h-5" />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  )
}
