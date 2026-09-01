'use client'

import React, { useState } from 'react'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Read URL query param message if present on client
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const msg = params.get('message')
      if (msg) setMessage(msg)
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#16233F] px-4 py-12 text-[#1B2130]">
      <div className="w-full max-w-md space-y-6">
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
            <CardTitle className="text-xl font-bold text-[#1B2130] font-serif">Masuk ke System</CardTitle>
            <CardDescription className="text-xs text-[#5C6478]">
              Masukkan Username dan Password untuk mengakses sistem
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 px-6 sm:px-8 pb-8">
            <form action={login} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-[#1B2130]">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  required
                  className="h-11 bg-white border-[#D3D7E0] text-[#1B2130] rounded-lg focus:ring-[#A9834F] focus:border-[#A9834F] text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#1B2130]">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan Password"
                    className="h-11 bg-white border-[#D3D7E0] text-[#1B2130] rounded-lg focus:ring-[#A9834F] focus:border-[#A9834F] text-sm font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A90A3] hover:text-[#1B2130] transition-colors p-1 cursor-pointer"
                    title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
        </Card>

        <p className="text-center text-xs text-[#8A90A3] font-medium">
          © {new Date().getFullYear()} Gereja St. Clara - Paroki Bekasi Utara • Digital Platform
        </p>
      </div>
    </div>
  )
}



