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
} from 'lucide-react'
import { UserRole } from '@/lib/types'

interface SidebarProps {
  userRole?: UserRole
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const pathname = usePathname()

  const navItems = [
    {
      title: 'Dashboard Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
    },
    {
      title: 'M1. Daftar Isian',
      href: '/dashboard/daftar-isian',
      icon: ClipboardEdit,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
      badge: userRole === 'SEKRETARIS' ? 'Edit A&B' : userRole === 'BENDAHARA' ? 'Edit C' : 'View',
    },
    {
      title: 'M2. DAFU (Daftar Umat)',
      href: '/dashboard/dafu',
      icon: Users,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
      badge: userRole === 'SEKRETARIS' ? 'CRUD' : 'View',
    },
    {
      title: 'M3. COA & Saldo Awal',
      href: '/dashboard/coa-saldo',
      icon: BookOpen,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
    },
    {
      title: 'M4. Jurnal Transaksi',
      href: '/dashboard/jurnal',
      icon: Receipt,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
      badge: userRole === 'BENDAHARA' ? 'Input' : 'View',
    },
    {
      title: 'M5. Laporan Aktivitas',
      href: '/dashboard/laporan',
      icon: FileSpreadsheet,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
    },
    {
      title: 'M6. Daftar Aset',
      href: '/dashboard/aset',
      icon: Package,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
      badge: userRole === 'BENDAHARA' ? 'CRUD' : 'View',
    },
    {
      title: 'M7. Kartu Setoran',
      href: '/dashboard/kartu-setoran',
      icon: CreditCard,
      roles: ['BENDAHARA', 'SEKRETARIS', 'PAROKI'],
    },
  ]

  return (
    <aside className="w-64 bg-[#1a1a2e] text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800">
      <div className="p-4 bg-[#1a56a0] font-semibold text-white flex items-center justify-between shadow-xs">
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wide">SISTEM KEUANGAN</span>
          <span className="text-xs font-normal text-blue-100">Gereja St. Clara</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-sm font-medium">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Modul Keuangan
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#1a56a0] text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isActive
                      ? 'bg-blue-400/30 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-400">
        <p className="font-medium text-slate-300">Paroki Bekasi Utara</p>
        <p className="text-[11px] mt-0.5">Sistem Laporan Aktivitas v1.0</p>
      </div>
    </aside>
  )
}
