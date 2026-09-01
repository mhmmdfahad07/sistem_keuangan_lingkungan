'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserProfile, KepalaKeluarga } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Pencil, Trash2, Users, ShieldCheck, CheckCircle2, XCircle, Lock } from 'lucide-react'

export default function DafuPage() {
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [lingkunganId, setLingkunganId] = useState<string | null>(null)
  const [lingkunganName, setLingkunganName] = useState<string>('')

  const [kkList, setKkList] = useState<KepalaKeluarga[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKk, setEditingKk] = useState<KepalaKeluarga | null>(null)
  const [formNama, setFormNama] = useState('')
  const [formAlamat, setFormAlamat] = useState('')
  const [formIsBiduk, setFormIsBiduk] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState(false)

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
          const { data: lData } = await supabase.from('lingkungan').select('id, nama_lingkungan').limit(1).maybeSingle()
          if (lData) {
            targetLingkunganId = lData.id
            setLingkunganName(lData.nama_lingkungan)
          }
        } else {
          const { data: lData } = await supabase.from('lingkungan').select('nama_lingkungan').eq('id', targetLingkunganId).maybeSingle()
          if (lData) setLingkunganName(lData.nama_lingkungan)
        }

        setLingkunganId(targetLingkunganId)

        if (targetLingkunganId) {
          const { data: kks } = await supabase
            .from('kepala_keluarga')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)
            .order('nama_kk', { ascending: true })

          let dbKks = kks || []
          const localSaved = localStorage.getItem(`custom_kks_${targetLingkunganId}`)
          if (localSaved) {
            try {
              const parsed: KepalaKeluarga[] = JSON.parse(localSaved)
              const combinedMap = new Map<string, KepalaKeluarga>()
              dbKks.forEach(k => combinedMap.set(k.id, k))
              parsed.forEach(k => combinedMap.set(k.id, k))
              dbKks = Array.from(combinedMap.values())
            } catch (e) {
              console.error(e)
            }
          }
          setKkList(dbKks.sort((a, b) => a.nama_kk.localeCompare(b.nama_kk)))
        }
      } catch (err) {
        console.error('Error loading dafu data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const userRole = userProfile?.role || 'BENDAHARA'
  const canEdit = userRole === 'SEKRETARIS'

  const openAddModal = () => {
    setEditingKk(null)
    setFormNama('')
    setFormAlamat('')
    setFormIsBiduk(true)
    setIsModalOpen(true)
  }

  const openEditModal = (kk: KepalaKeluarga) => {
    setEditingKk(kk)
    setFormNama(kk.nama_kk)
    setFormAlamat(kk.alamat || '')
    setFormIsBiduk(kk.is_biduk)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lingkunganId || !formNama.trim()) return

    setSubmitting(true)
    const payload = {
      lingkungan_id: lingkunganId,
      nama_kk: formNama.trim(),
      alamat: formAlamat.trim() || null,
      is_biduk: formIsBiduk,
    }

    if (editingKk) {
      const { error } = await supabase.from('kepala_keluarga').update(payload).eq('id', editingKk.id)
      if (error) {
        console.warn('Supabase RLS/DB info:', error.message)
      }
      setKkList(prev => {
        const updated = prev.map(k => k.id === editingKk.id ? { ...k, ...payload } : k)
        localStorage.setItem(`custom_kks_${payload.lingkungan_id}`, JSON.stringify(updated))
        return updated
      })
      setIsModalOpen(false)
    } else {
      const { data, error } = await supabase.from('kepala_keluarga').insert(payload).select().single()
      if (error) {
        console.warn('Supabase RLS/DB info:', error.message)
      }
      const newItem: KepalaKeluarga = data || {
        id: 'kk-' + Date.now(),
        lingkungan_id: payload.lingkungan_id,
        nama_kk: payload.nama_kk,
        alamat: payload.alamat,
        is_biduk: payload.is_biduk,
      }
      setKkList(prev => {
        const updated = [...prev, newItem].sort((a, b) => a.nama_kk.localeCompare(b.nama_kk))
        localStorage.setItem(`custom_kks_${payload.lingkungan_id}`, JSON.stringify(updated))
        return updated
      })
      setIsModalOpen(false)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data Kepala Keluarga "${nama}"?`)) return

    const { error } = await supabase.from('kepala_keluarga').delete().eq('id', id)
    if (error) {
      console.warn('Supabase DB delete info:', error.message)
    }
    setKkList(prev => {
      const updated = prev.filter(k => k.id !== id)
      if (lingkunganId) {
        localStorage.setItem(`custom_kks_${lingkunganId}`, JSON.stringify(updated))
      }
      return updated
    })
  }

  const filteredKkList = kkList.filter(k =>
    k.nama_kk.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.alamat && k.alamat.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalKK = kkList.length
  const totalBiduk = kkList.filter(k => k.is_biduk).length
  const bidukPercentage = totalKK > 0 ? Math.round((totalBiduk / totalKK) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2130] tracking-tight font-serif">DAFU (Daftar Umat / Kepala Keluarga)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Master Data Keluarga Lingkungan <span className="text-emerald-700 font-semibold">{lingkunganName}</span>. Dikurasi & dikelola oleh Sekretaris.
          </p>
        </div>
        {canEdit ? (
          <Button onClick={openAddModal} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer">
            <Plus className="w-4 h-4 mr-2 text-emerald-400" />
            Tambah Kepala Keluarga
          </Button>
        ) : userRole === 'BENDAHARA' ? (
          <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-xs">
            <Lock className="w-4 h-4 text-amber-600" /> Read Only (Khusus Sekretaris)
          </span>
        ) : (
          <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-xs">
            <Lock className="w-4 h-4 text-purple-600" /> Read Only (Pengawas Paroki)
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 rounded-2xl p-1 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Kepala Keluarga (KK)</CardTitle>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{totalKK} <span className="text-sm font-normal text-slate-500">KK</span></div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/60 border-emerald-200 rounded-2xl p-1 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800">Terdaftar BIDUK KAJ</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-950">{totalBiduk} <span className="text-sm font-normal text-emerald-700">KK</span></div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/60 border-amber-200 rounded-2xl p-1 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800">Persentase Terdata BIDUK</CardTitle>
            <div className="w-4 h-4 font-bold text-amber-800 text-xs">{bidukPercentage}%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-950">{bidukPercentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table Card */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-base font-bold text-slate-800">Daftar Kepala Keluarga ({filteredKkList.length})</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Cari nama KK atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <TableRow>
                <TableHead className="w-12 text-center text-slate-700 font-bold">No</TableHead>
                <TableHead className="text-slate-800 font-bold">Nama Kepala Keluarga</TableHead>
                <TableHead className="text-slate-800 font-bold">Alamat Lingkungan</TableHead>
                <TableHead className="text-center text-slate-800 font-bold">Status BIDUK KAJ</TableHead>
                {canEdit && <TableHead className="text-right text-slate-800 font-bold">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredKkList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-8 text-slate-400">
                    Tidak ada data Kepala Keluarga ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKkList.map((kk, idx) => (
                  <TableRow key={kk.id} className="hover:bg-slate-50 transition">
                    <TableCell className="text-center font-mono text-xs text-slate-500">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{kk.nama_kk}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{kk.alamat || '-'}</TableCell>
                    <TableCell className="text-center">
                      {kk.is_biduk ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar BIDUK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Belum BIDUK
                        </span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(kk)}
                          className="h-8 w-8 p-0 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(kk.id, kk.nama_kk)}
                          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">{editingKk ? 'Edit Data Kepala Keluarga' : 'Tambah Kepala Keluarga'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nama_kk" className="text-xs font-semibold text-slate-700">Nama Kepala Keluarga *</Label>
              <Input
                id="nama_kk"
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: Petrus Sugeng"
                required
                className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-xs font-semibold text-slate-700">Alamat / Blok Rumah</Label>
              <Input
                id="alamat"
                value={formAlamat}
                onChange={(e) => setFormAlamat(e.target.value)}
                placeholder="Contoh: Jl. St. Clara No. 12"
                className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_biduk" className="text-xs font-semibold text-slate-700">Status Terdaftar BIDUK KAJ</Label>
              <Select value={formIsBiduk ? 'YA' : 'TIDAK'} onValueChange={(val) => setFormIsBiduk(val === 'YA')}>
                <SelectTrigger id="is_biduk" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="YA">Ya, Terdaftar di BIDUK KAJ</SelectItem>
                  <SelectItem value="TIDAK">Tidak / Belum Terdaftar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl">
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer">
                {submitting ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


