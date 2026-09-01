'use client'

import React, { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, KeyRound, UserCheck, ShieldCheck, Users } from 'lucide-react'

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2 shadow-lg backdrop-blur-xs">
            <Building2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Sistem Keuangan Lingkungan
          </h1>
          <p className="text-sm text-slate-400">
            Gereja St. Clara — Paroki Bekasi Utara
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl text-slate-100">
          <CardHeader className="space-y-1 text-center border-b border-slate-800/80 pb-6">
            <CardTitle className="text-xl font-semibold text-white">Masuk / Otomatis Buat Akun</CardTitle>
            <CardDescription className="text-slate-400">
              Pilih salah satu peran di bawah atau ketik email terdaftar
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Pengguna</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900 border-slate-700 text-white focus:border-blue-500"
                />
              </div>

              {message && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium leading-relaxed">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 transition shadow-lg shadow-blue-600/20">
                <KeyRound className="w-4 h-4 mr-2" />
                Masuk ke Aplikasi
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-slate-800/80 pt-6">
            <div className="w-full text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Klik Pilih Akun Demo Role:
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full text-xs">
              <button
                type="button"
                onClick={() => selectDemoAccount('bendahara@example.com')}
                className={`p-2.5 rounded-lg border text-center transition ${
                  email === 'bendahara@example.com'
                    ? 'bg-blue-950/80 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-blue-400 block truncate">Bendahara</span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">bendahara@...</p>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('sekretaris@example.com')}
                className={`p-2.5 rounded-lg border text-center transition ${
                  email === 'sekretaris@example.com'
                    ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-emerald-400 block truncate">Sekretaris</span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">sekretaris@...</p>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('paroki@example.com')}
                className={`p-2.5 rounded-lg border text-center transition ${
                  email === 'paroki@example.com'
                    ? 'bg-amber-950/80 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-amber-400 block truncate">Paroki</span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">paroki@...</p>
              </button>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Gereja St. Clara - Paroki Bekasi Utara
        </p>
      </div>
    </div>
  )
}
