'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardEdit,
  Users,
  BookOpen,
  Receipt,
  FileSpreadsheet,
  Package,
  CreditCard,
  Lock,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import { UserRole } from '@/lib/types'

interface SidebarProps {
  userRole?: UserRole
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole = 'BENDAHARA' }) => {
  const pathname = usePathname()

  const allNavItems = [
    {
      title: 'Dashboard Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['BENDAHARA', 'PAROKI'],
    },
    {
      title: 'M1. Daftar Isian',
      href: '/dashboard/daftar-isian',
      icon: ClipboardEdit,
      roles: ['BENDAHARA', 'PAROKI'],
      badge: 'Edit C',
    },
    {
      title: 'M2. DAFU (Daftar Umat)',
      href: '/dashboard/dafu',
      icon: Users,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
      badge: userRole === 'SEKRETARIS' ? 'Input' : 'View',
    },
    {
      title: 'M3. COA & Saldo Awal',
      href: '/dashboard/coa-saldo',
      icon: BookOpen,
      roles: ['BENDAHARA', 'PAROKI'],
    },
    {
      title: 'M4. Jurnal Transaksi',
      href: '/dashboard/jurnal',
      icon: Receipt,
      roles: ['BENDAHARA', 'PAROKI'],
      badge: userRole === 'BENDAHARA' ? 'Input' : 'View',
    },
    {
      title: 'M5. Laporan Aktivitas',
      href: '/dashboard/laporan',
      icon: FileSpreadsheet,
      roles: ['BENDAHARA', 'PAROKI'],
    },
    {
      title: 'M6. Daftar Aset',
      href: '/dashboard/aset',
      icon: Package,
      roles: ['BENDAHARA', 'PAROKI'],
      badge: userRole === 'BENDAHARA' ? 'CRUD' : 'View',
    },
    {
      title: 'M7. Kartu Setoran',
      href: '/dashboard/kartu-setoran',
      icon: CreditCard,
      roles: ['BENDAHARA', 'PAROKI'],
    },
  ]

  // Filter items based on user role
  // Sekretaris can ONLY access M2. DAFU
  const visibleNavItems = allNavItems.filter((item) => {
    if (userRole === 'SEKRETARIS') {
      return item.href === '/dashboard/dafu'
    }
    return true
  })

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 p-4 border-r border-slate-800 shrink-0 flex flex-col justify-between h-full shadow-2xl">
      <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar">
        {/* Parish Badge & Role Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/90 rounded-2xl p-3 border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-2.5 mb-2.5 pb-2.5 border-b border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-emerald-600 border border-amber-400/50 flex items-center justify-center text-white font-bold text-xs shrink-0">
              SC
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Paroki Bekasi Utara</div>
              <div className="text-[10px] text-amber-300 font-medium truncate">Gereja St. Clara</div>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            Hak Akses Role:
          </div>
          <div className="text-xs font-bold text-white mt-0.5 flex items-center justify-between gap-1">
            <span className="truncate">
              {userRole === 'BENDAHARA' && 'Bendahara Lingkungan'}
              {userRole === 'SEKRETARIS' && 'Sekretaris (DAFU Only)'}
              {userRole === 'PAROKI' && 'Pengawas Paroki'}
            </span>
            {userRole === 'PAROKI' && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 shrink-0">
                <Lock className="w-2.5 h-2.5" /> View-Only
              </span>
            )}
            {userRole === 'SEKRETARIS' && (
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" /> DAFU Only
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Menu Modul Keuangan
          </div>

          <div className="flex flex-col gap-1.5">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400/80'}`} />
                    <span className="truncate">{item.title}</span>
                  </div>

                  {item.badge && userRole !== 'SEKRETARIS' && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 mt-auto">
        <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">Gereja St. Clara • v1.1</span>
      </div>
    </aside>
  )
}

