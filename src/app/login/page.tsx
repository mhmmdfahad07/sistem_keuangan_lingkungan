'use client'

import React, { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound, Shield, UserCheck, Building2, Users } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('bendahara@example.com')
  const [password, setPassword] = useState('password123')
  const [message, setMessage] = useState<string | null>(null)

  // Read URL query param message if present on client
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const msg = params.get('message')
      if (msg) setMessage(msg)
    }
  }, [])

  const selectDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('password123')
  }

  const demoAccounts = [
    {
      roleName: 'Bendahara Lingkungan',
      roleKey: 'BENDAHARA',
      email: 'bendahara@example.com',
      desc: 'Akses Penuh Jurnal & Laporan Kas',
      icon: KeyRound,
      badgeColor: 'bg-[#F6EFE2] text-[#5A4423] border-[#A9834F]/30',
    },
    {
      roleName: 'Sekretaris Lingkungan',
      roleKey: 'SEKRETARIS',
      email: 'sekretaris@example.com',
      desc: 'Input & Kelola Data DAFU Umat',
      icon: Users,
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    {
      roleName: 'Pengawas Paroki',
      roleKey: 'PAROKI',
      email: 'paroki@example.com',
      desc: 'Monitoring & Audit Multi-Lingkungan',
      icon: Shield,
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#16233F] px-4 py-12 text-[#1B2130]">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
            <img
              src="/logo-st-clara.jpg"
              alt="Logo Gereja Santa Clara"
              className="w-20 h-20 rounded-full object-cover border-2 border-[#A9834F] bg-white shadow-xl"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
              Sistem Keuangan Lingkungan
            </h1>
            <p className="text-xs text-[#A9834F] font-semibold tracking-widest uppercase">
              Gereja St. Clara • Paroki Bekasi Utara
            </p>
          </div>
        </div>

        {/* Card Authentication */}
        <Card className="border-[#E3E6EC] bg-white shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 text-center border-b border-[#E3E6EC] bg-[#F5F6F9]/60 pb-6 pt-6">
            <CardTitle className="text-xl font-bold text-[#1B2130] font-serif">Masuk ke Portal</CardTitle>
            <CardDescription className="text-xs text-[#5C6478]">
              Gunakan kredensial akun terdaftar atau pilih salah satu peran demo di bawah
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 px-6 sm:px-8">
            <form action={login} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#1B2130]">Email Pengguna</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="h-11 bg-white border-[#D3D7E0] text-[#1B2130] rounded-lg focus:ring-[#A9834F] focus:border-[#A9834F] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#1B2130]">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-white border-[#D3D7E0] text-[#1B2130] rounded-lg focus:ring-[#A9834F] focus:border-[#A9834F] text-sm"
                />
              </div>

              {message && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-[#16233F] hover:bg-[#22335A] text-white font-bold rounded-lg transition-all shadow-md cursor-pointer text-sm flex items-center justify-center gap-2 mt-2"
              >
                <KeyRound className="w-4 h-4 text-[#A9834F]" />
                Masuk ke Aplikasi
              </Button>
            </form>
          </CardContent>

          {/* Quick Select Demo Accounts */}
          <CardFooter className="flex flex-col space-y-3 border-t border-[#E3E6EC] bg-[#F5F6F9]/40 p-6">
            <div className="w-full text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6478]">
                PILIH AKSES PENGGUNA DEMO ROLE:
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 w-full">
              {demoAccounts.map((acc) => {
                const isSelected = email === acc.email
                const Icon = acc.icon

                return (
                  <button
                    key={acc.roleKey}
                    type="button"
                    onClick={() => selectDemoAccount(acc.email)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#16233F] border-[#16233F] text-white shadow-md ring-1 ring-[#A9834F]'
                        : 'bg-white border-[#E3E6EC] text-[#1B2130] hover:bg-[#F5F6F9] hover:border-[#D3D7E0]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-white/10 text-[#A9834F]' : 'bg-[#F5F6F9] text-[#5C6478]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#1B2130]'}`}>
                          {acc.roleName}
                        </div>
                        <div className={`text-[11px] truncate ${isSelected ? 'text-[#8A90A3]' : 'text-[#5C6478]'}`}>
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 hidden sm:inline-block ${
                      isSelected ? 'bg-[#A9834F]/20 text-[#A9834F] border-[#A9834F]/40' : acc.badgeColor
                    }`}>
                      {acc.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-[#8A90A3] font-medium">
          © {new Date().getFullYear()} Gereja St. Clara - Paroki Bekasi Utara • Digital Platform
        </p>
      </div>
    </div>
  )
}


