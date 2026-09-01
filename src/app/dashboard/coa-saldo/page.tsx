'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserProfile, COA, ProfilLingkungan } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatRupiah } from '@/lib/utils'
import { BookOpen, Lock, Save, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function CoaSaldoPage() {
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [lingkunganId, setLingkunganId] = useState<string | null>(null)

  const [coaList, setCoaList] = useState<COA[]>([])
  const [profilId, setProfilId] = useState<string | null>(null)
  const [saldoAwal, setSaldoAwal] = useState<number>(0)
  const [tahunBuku, setTahunBuku] = useState<string>('2026')
  const [isLocked, setIsLocked] = useState(false)

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user

        if (user) {
          const { data: uData } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
          if (uData) setUserProfile(uData)
        }

        let targetLingkunganId = localStorage.getItem('selected_lingkungan_id')
        if (!targetLingkunganId) {
          const { data: lData } = await supabase.from('lingkungan').select('id').limit(1).maybeSingle()
          if (lData) targetLingkunganId = lData.id
        }

        setLingkunganId(targetLingkunganId)

        // Fetch COA master data
        const { data: coas } = await supabase.from('coa').select('*').order('id', { ascending: true })
        if (coas) setCoaList(coas)

        if (targetLingkunganId) {
          // Fetch Profil Lingkungan Saldo
          const { data: profil } = await supabase
            .from('profil_lingkungan')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)
            .maybeSingle()

          if (profil) {
            setProfilId(profil.id)
            setSaldoAwal(Number(profil.saldo_awal || 0))
            setTahunBuku(profil.tahun_buku || '2026')
          }

          // Check if any journal month is posted/locked
          const { data: postedJurnals } = await supabase
            .from('jurnal_transaksi')
            .select('is_posted')
            .eq('lingkungan_id', targetLingkunganId)
            .eq('is_posted', true)
            .limit(1)

          if (postedJurnals && postedJurnals.length > 0) {
            setIsLocked(true)
          }
        }
      } catch (err) {
        console.error('Error loading coa saldo:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const isBendahara = userProfile?.role === 'BENDAHARA'

  const handleSaveSaldoAwal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lingkunganId || isLocked || !isBendahara) return

    setSaving(true)
    setSuccessMsg(null)

    const payload = {
      lingkungan_id: lingkunganId,
      saldo_awal: saldoAwal,
      tahun_buku: tahunBuku,
    }

    let err = null
    if (profilId) {
      const { error } = await supabase.from('profil_lingkungan').update(payload).eq('id', profilId)
      err = error
    } else {
      const { error } = await supabase.from('profil_lingkungan').insert(payload)
      err = error
    }

    setSaving(false)
    if (err) {
      alert('Gagal menyimpan saldo awal: ' + err.message)
    } else {
      setSuccessMsg('Saldo awal berhasil diperbarui!')
      setTimeout(() => setSuccessMsg(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">M3. Master COA & Saldo Awal Pembukuan</h1>
        <p className="text-sm text-slate-400 mt-1">
          Bagan Akun Standar (Chart of Accounts) dan Pengaturan Saldo Awal Kas Bank Lingkungan.
        </p>
      </div>

      {/* Saldo Awal Input Card */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-md">
        <CardHeader className="bg-slate-800/50 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Pengaturan Saldo Awal Bank (Kode Akun 1100)
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isLocked
                ? 'Saldo awal terkunci karena jurnal transaksi bulan terkait sudah ditutup (Posted).'
                : 'Diisi oleh Bendahara saat memulai pembukuan tahun buku.'}
            </CardDescription>
          </div>
          {isLocked && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Terkunci (Posted)
            </span>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {successMsg && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSaveSaldoAwal} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="tahun" className="text-slate-300">Tahun Buku</Label>
              <Input
                id="tahun"
                value={tahunBuku}
                onChange={(e) => setTahunBuku(e.target.value)}
                disabled={isLocked || !isBendahara}
                className="bg-slate-800 border-slate-700 text-white focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="saldo" className="text-slate-300">Nominal Saldo Awal Bank (Rp)</Label>
              <Input
                id="saldo"
                type="number"
                value={saldoAwal}
                onChange={(e) => setSaldoAwal(parseFloat(e.target.value) || 0)}
                disabled={isLocked || !isBendahara}
                className="bg-slate-800 border-slate-700 text-white font-mono font-bold focus:border-emerald-500"
              />
            </div>
            {isBendahara && !isLocked && (
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 cursor-pointer">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Saldo Awal'}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* COA Table Card */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-md">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="text-base font-bold text-white">Master Chart of Accounts (COA)</CardTitle>
          <CardDescription className="text-slate-400">Standar kode akun transaksi Gereja St. Clara</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-800/80 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="w-24 text-slate-300">Kode Akun</TableHead>
                <TableHead className="text-slate-300">Nama Akun / Klasifikasi</TableHead>
                <TableHead className="w-32 text-center text-slate-300">Tipe Normal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-800">
              {coaList.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-800/50 border-slate-800">
                  <TableCell className="font-mono font-bold text-emerald-400">{c.id}</TableCell>
                  <TableCell className="font-semibold text-white">{c.nama_akun}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        c.tipe === 'DEBIT'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {c.tipe}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

