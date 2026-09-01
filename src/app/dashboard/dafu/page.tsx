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
import { Plus, Search, Pencil, Trash2, Users, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'

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

          if (kks) setKkList(kks)
        }
      } catch (err) {
        console.error('Error loading dafu data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const canEdit = userProfile?.role === 'SEKRETARIS' || userProfile?.role === 'BENDAHARA' || !userProfile

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
        alert('Gagal mengupdate KK: ' + error.message)
      } else {
        setKkList(prev => prev.map(k => k.id === editingKk.id ? { ...k, ...payload } : k))
        setIsModalOpen(false)
      }
    } else {
      const { data, error } = await supabase.from('kepala_keluarga').insert(payload).select().single()
      if (error) {
        alert('Gagal menambah KK: ' + error.message)
      } else if (data) {
        setKkList(prev => [...prev, data].sort((a, b) => a.nama_kk.localeCompare(b.nama_kk)))
        setIsModalOpen(false)
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data Kepala Keluarga "${nama}"?`)) return

    const { error } = await supabase.from('kepala_keluarga').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus KK: ' + error.message)
    } else {
      setKkList(prev => prev.filter(k => k.id !== id))
    }
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
          <h1 className="text-2xl font-bold text-white tracking-tight">M2. DAFU (Daftar Umat / Kepala Keluarga)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Master Data Keluarga Lingkungan <span className="text-emerald-400 font-semibold">{lingkunganName}</span>. Dikurasi & dikelola oleh Sekretaris.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 border border-emerald-500/30 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kepala Keluarga
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Kepala Keluarga (KK)</CardTitle>
            <Users className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-white">{totalKK} <span className="text-sm font-normal text-slate-400">KK</span></div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Terdaftar BIDUK KAJ</CardTitle>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-400">{totalBiduk} <span className="text-sm font-normal text-slate-400">KK</span></div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Persentase Terdata BIDUK</CardTitle>
            <div className="w-5 h-5 font-bold text-amber-400 text-sm">{bidukPercentage}%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-400">{bidukPercentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table Card */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-md">
        <CardHeader className="pb-4 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-base font-bold text-white">Daftar Kepala Keluarga ({filteredKkList.length})</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Cari nama KK atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-800/80 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="w-12 text-center text-slate-400">No</TableHead>
                <TableHead className="text-slate-300">Nama Kepala Keluarga</TableHead>
                <TableHead className="text-slate-300">Alamat Lingkungan</TableHead>
                <TableHead className="text-center text-slate-300">Status BIDUK KAJ</TableHead>
                {canEdit && <TableHead className="text-right text-slate-300">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-800">
              {filteredKkList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4} className="text-center py-8 text-slate-400">
                    Tidak ada data Kepala Keluarga ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKkList.map((kk, idx) => (
                  <TableRow key={kk.id} className="hover:bg-slate-800/50 border-slate-800">
                    <TableCell className="text-center font-mono text-xs text-slate-400">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-white">{kk.nama_kk}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{kk.alamat || '-'}</TableCell>
                    <TableCell className="text-center">
                      {kk.is_biduk ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar BIDUK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
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
                          className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(kk.id, kk.nama_kk)}
                          className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-slate-800 cursor-pointer"
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
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">{editingKk ? 'Edit Data Kepala Keluarga' : 'Tambah Kepala Keluarga'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nama_kk" className="text-slate-300">Nama Kepala Keluarga *</Label>
              <Input
                id="nama_kk"
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: Petrus Sugeng"
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat" className="text-slate-300">Alamat / Blok Rumah</Label>
              <Input
                id="alamat"
                value={formAlamat}
                onChange={(e) => setFormAlamat(e.target.value)}
                placeholder="Contoh: Jl. St. Clara No. 12"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_biduk" className="text-slate-300">Status Terdaftar BIDUK KAJ</Label>
              <Select value={formIsBiduk ? 'YA' : 'TIDAK'} onValueChange={(val) => setFormIsBiduk(val === 'YA')}>
                <SelectTrigger id="is_biduk" className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="YA">Ya, Terdaftar di BIDUK KAJ</SelectItem>
                  <SelectItem value="TIDAK">Tidak / Belum Terdaftar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer">
                {submitting ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

