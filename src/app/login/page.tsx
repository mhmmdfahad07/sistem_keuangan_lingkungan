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
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-2">
            <img
              src="/logo-st-clara.jpg"
              alt="Logo St. Clara"
              className="w-20 h-20 rounded-full object-cover border-2 border-amber-400/60 bg-white shadow-2xl"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Sistem Keuangan Lingkungan
          </h1>
          <p className="text-xs text-amber-300 font-semibold tracking-wide uppercase">
            Gereja St. Clara • Paroki Bekasi Utara
          </p>
        </div>

        <Card className="border-slate-200 bg-white shadow-2xl text-slate-900 rounded-2xl">
          <CardHeader className="space-y-1 text-center border-b border-slate-100 pb-6">
            <CardTitle className="text-xl font-bold text-slate-800">Masuk ke System</CardTitle>
            <CardDescription className="text-slate-500">
              Pilih salah satu peran demo di bawah atau ketik email terdaftar
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Pengguna</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
                />
              </div>

              {message && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition shadow-md cursor-pointer">
                <KeyRound className="w-4 h-4 mr-2 text-emerald-400" />
                Masuk ke Aplikasi
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 pt-6">
            <div className="w-full text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pilih Akun Demo Role:
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full text-xs">
              <button
                type="button"
                onClick={() => selectDemoAccount('bendahara@example.com')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  email === 'bendahara@example.com'
                    ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`block truncate ${email === 'bendahara@example.com' ? 'text-emerald-400' : 'text-slate-900 font-bold'}`}>Bendahara</span>
                <p className="text-[10px] opacity-80 truncate mt-0.5">bendahara@...</p>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('sekretaris@example.com')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  email === 'sekretaris@example.com'
                    ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`block truncate ${email === 'sekretaris@example.com' ? 'text-purple-400' : 'text-slate-900 font-bold'}`}>Sekretaris</span>
                <p className="text-[10px] opacity-80 truncate mt-0.5">sekretaris@...</p>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('paroki@example.com')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  email === 'paroki@example.com'
                    ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`block truncate ${email === 'paroki@example.com' ? 'text-amber-400' : 'text-slate-900 font-bold'}`}>Paroki</span>
                <p className="text-[10px] opacity-80 truncate mt-0.5">paroki@...</p>
              </button>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} Gereja St. Clara - Paroki Bekasi Utara
        </p>
      </div>
    </div>
  )
}

