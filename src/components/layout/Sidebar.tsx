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
    <aside className="w-64 bg-[#16233F] text-[#8A90A3] p-4 border-r border-[#2C3E66] shrink-0 flex flex-col justify-between h-full shadow-2xl">
      <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar">
        {/* Single Official Logo in Top-Left Sidebar */}
        <div className="flex items-center gap-3 px-1 py-1">
          <img
            src="/logo-st-clara.jpg"
            alt="Logo Gereja Santa Clara"
            className="w-10 h-10 rounded-full object-cover border border-[#2C3E66] bg-white shrink-0 shadow-sm"
          />
          <div className="min-w-0">
            <div className="text-base font-extrabold text-white tracking-wide truncate uppercase font-serif">SICLAR</div>
            <div className="text-[11px] text-[#8A90A3] font-medium truncate">Keuangan Lingkungan</div>
          </div>
        </div>

        {/* Role & Access Info Card */}
        <div className="bg-[#22335A] rounded-[10px] p-3.5 border border-[#2C3E66] shadow-sm">
          <div className="text-xs font-bold text-white truncate font-serif">Paroki Bekasi Utara</div>
          <div className="text-[11px] text-[#8A90A3] font-medium truncate mb-2">Bekasi Utara</div>

          <div className="text-[10px] uppercase tracking-wider font-bold text-[#8A90A3] font-serif">
            HAK AKSES ROLE:
          </div>
          <div className="text-xs font-bold text-white mt-0.5 flex items-center justify-between gap-1">
            <span className="truncate font-serif">
              {userRole === 'BENDAHARA' && 'Bendahara Lingkungan'}
              {userRole === 'SEKRETARIS' && 'Sekretaris (DAFU Only)'}
              {userRole === 'PAROKI' && 'Pengawas Paroki'}
            </span>
            {userRole === 'PAROKI' && (
              <span className="text-[9px] bg-[#F6EFE2] text-[#5A4423] border border-[#A9834F]/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 shrink-0">
                <Lock className="w-2.5 h-2.5" /> View-Only
              </span>
            )}
            {userRole === 'SEKRETARIS' && (
              <span className="text-[9px] bg-purple-500/20 text-purple-200 border border-purple-500/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" /> DAFU Only
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          <div className="px-1 text-[10px] font-bold text-[#8A90A3] uppercase tracking-wider mb-1 font-serif">
            MENU UTAMA
          </div>

          <div className="flex flex-col gap-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'border-l-2 border-[#A9834F] bg-white/[0.06] text-white font-bold rounded-r-[7px] rounded-l-none pl-2.5'
                      : 'text-[#8A90A3] hover:text-white hover:bg-white/[0.04] rounded-[7px]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A9834F]' : 'text-[#8A90A3]'}`} />
                    <span className="truncate font-serif">{item.title}</span>
                  </div>

                  {item.badge && userRole !== 'SEKRETARIS' && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        isActive
                          ? 'bg-[#A9834F]/20 text-[#A9834F] border border-[#A9834F]/30'
                          : 'bg-[#22335A] text-[#8A90A3] border border-[#2C3E66]'
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

      <div className="pt-4 border-t border-[#2C3E66] text-[11px] text-[#8A90A3] flex items-center gap-2 mt-auto">
        <Building2 className="w-4 h-4 text-[#A9834F] shrink-0" />
        <span className="truncate">Gereja St. Clara • v1.1</span>
      </div>
    </aside>
  )
}



