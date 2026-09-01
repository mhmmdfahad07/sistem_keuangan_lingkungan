'use client'

import React from 'react'
import { UserProfile, Lingkungan } from '@/lib/types'
import { LogOut, Building2, User, ChevronDown } from 'lucide-react'
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
  const [showProfileMenu, setShowProfileMenu] = React.useState(false)

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'BENDAHARA':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Bendahara Lingkungan
          </span>
        )
      case 'SEKRETARIS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Sekretaris (DAFU Only)
          </span>
        )
      case 'PAROKI':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Pengawas Paroki (Read-only)
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
            User
          </span>
        )
    }
  }

  const currentLingkunganName =
    lingkunganList.find((l) => l.id === selectedLingkunganId)?.nama_lingkungan || 'Semua Lingkungan'

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-400 shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-extrabold text-xs text-white">
              SC
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2 truncate">
              Sistem Keuangan Lingkungan
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded hidden xs:inline-block">
                v1.1
              </span>
            </h1>
            <p className="text-xs text-amber-300/90 font-semibold tracking-wide truncate">
              Gereja St. Clara • Paroki Bekasi Utara
            </p>
          </div>
        </div>

        {/* Middle & Right Section */}
        <div className="flex items-center gap-3">
          {/* Lingkungan Scope Indicator / Selector */}
          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 shadow-xs">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {userProfile?.role === 'PAROKI' ? (
              <Select value={selectedLingkunganId || ''} onValueChange={(val) => val && onLingkunganChange(val)}>
                <SelectTrigger className="h-6 border-none bg-transparent shadow-none focus:ring-0 text-xs font-medium p-0 text-white gap-1">
                  <SelectValue placeholder="Pilih Lingkungan" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto bg-slate-800 border-slate-700 text-slate-100">
                  {lingkunganList.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                      {l.nama_lingkungan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                {currentLingkunganName}
              </span>
            )}
          </div>

          {/* User Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 p-1.5 pr-3 rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                {userProfile?.email ? userProfile.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                  {userProfile?.email ? userProfile.email.split('@')[0] : 'User'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {userProfile?.role || 'BENDAHARA'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 text-xs">
                <div className="p-2 border-b border-slate-700 mb-1 space-y-1">
                  <p className="font-bold text-white text-sm truncate">{userProfile?.email}</p>
                  <div className="mt-1">{getRoleBadge(userProfile?.role)}</div>
                </div>

                <button
                  onClick={() => {
                    onLogout()
                    setShowProfileMenu(false)
                  }}
                  className="w-full text-left p-2.5 hover:bg-red-500/20 text-red-300 rounded-lg flex items-center gap-2 transition-colors cursor-pointer font-medium mt-1"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

