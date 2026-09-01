'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserProfile, Aset } from '@/lib/types'
import { formatRupiah } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Package, Pencil, Trash2, Search, Calculator } from 'lucide-react'

export default function AsetPage() {
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [lingkunganId, setLingkunganId] = useState<string | null>(null)
  const [lingkunganName, setLingkunganName] = useState('')

  const [asetList, setAsetList] = useState<Aset[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAset, setEditingAset] = useState<Aset | null>(null)
  const [namaBarang, setNamaBarang] = useState('')
  const [kategori, setKategori] = useState('Peralatan Ibadat')
  const [tahunBeli, setTahunBeli] = useState<number>(2024)
  const [jumlah, setJumlah] = useState<number>(1)
  const [hargaSatuan, setHargaSatuan] = useState<number>(0)
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
          const { data: items } = await supabase
            .from('aset')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)
            .order('nama_barang', { ascending: true })

          if (items) setAsetList(items)
        }
      } catch (err) {
        console.error('Error loading aset data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const isBendahara = userProfile?.role === 'BENDAHARA'

  const openAddModal = () => {
    setEditingAset(null)
    setNamaBarang('')
    setKategori('Peralatan Ibadat')
    setTahunBeli(2024)
    setJumlah(1)
    setHargaSatuan(0)
    setIsModalOpen(true)
  }

  const openEditModal = (item: Aset) => {
    setEditingAset(item)
    setNamaBarang(item.nama_barang)
    setKategori(item.kategori || 'Peralatan Ibadat')
    setTahunBeli(item.tahun_beli || 2024)
    setJumlah(item.jumlah || 1)
    setHargaSatuan(Number(item.harga_satuan || 0))
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lingkunganId || !namaBarang.trim()) return

    setSubmitting(true)
    const payload = {
      lingkungan_id: lingkunganId,
      nama_barang: namaBarang.trim(),
      kategori,
      tahun_beli: tahunBeli,
      jumlah,
      harga_satuan: hargaSatuan,
    }

    if (editingAset) {
      const { error } = await supabase.from('aset').update(payload).eq('id', editingAset.id)
      if (error) {
        alert('Gagal mengupdate aset: ' + error.message)
      } else {
        setAsetList(prev => prev.map(a => a.id === editingAset.id ? { ...a, ...payload } : a))
        setIsModalOpen(false)
      }
    } else {
      const { data, error } = await supabase.from('aset').insert(payload).select().single()
      if (error) {
        alert('Gagal menambah aset: ' + error.message)
      } else if (data) {
        setAsetList(prev => [...prev, data])
        setIsModalOpen(false)
      }
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus inventaris "${nama}"?`)) return

    const { error } = await supabase.from('aset').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus aset: ' + error.message)
    } else {
      setAsetList(prev => prev.filter(a => a.id !== id))
    }
  }

  const filteredAsetList = asetList.filter(a =>
    a.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.kategori && a.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalUnit = asetList.reduce((acc, item) => acc + (item.jumlah || 0), 0)
  const grandTotalNilai = asetList.reduce((acc, item) => acc + (Number(item.jumlah || 0) * Number(item.harga_satuan || 0)), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a56a0]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">M6. Daftar Aset & Inventaris Lingkungan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan inventaris fisik barang Lingkungan {lingkunganName}. Dikelola oleh Bendahara.
          </p>
        </div>
        {isBendahara && (
          <Button onClick={openAddModal} className="bg-[#1a56a0] hover:bg-[#144580] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Aset Inventaris
          </Button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Unit Barang Inventaris</CardTitle>
            <Package className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalUnit} <span className="text-sm font-normal text-slate-500">Unit</span></div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Perkiraan Nilai Aset</CardTitle>
            <Calculator className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">{formatRupiah(grandTotalNilai)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-base font-bold text-slate-800">Daftar Inventaris ({filteredAsetList.length})</CardTitle>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Cari nama barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama Barang Inventaris</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Tahun Beli</TableHead>
                <TableHead className="text-center">Jumlah</TableHead>
                <TableHead className="text-right">Harga Satuan (Rp)</TableHead>
                <TableHead className="text-right">Total Nilai (Rp)</TableHead>
                {isBendahara && <TableHead className="w-16 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsetList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isBendahara ? 8 : 7} className="text-center py-8 text-slate-400">
                    Belum ada data barang inventaris registered.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAsetList.map((item, idx) => {
                  const subtotal = (item.jumlah || 0) * Number(item.harga_satuan || 0)
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell className="text-center font-medium text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{item.nama_barang}</TableCell>
                      <TableCell className="text-sm text-slate-600">{item.kategori || '-'}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{item.tahun_beli || '-'}</TableCell>
                      <TableCell className="text-center font-bold text-slate-800">{item.jumlah}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatRupiah(Number(item.harga_satuan))}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-700">{formatRupiah(subtotal)}</TableCell>
                      {isBendahara && (
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(item)}
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, item.nama_barang)}
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAset ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nama_barang">Nama Barang *</Label>
              <Input
                id="nama_barang"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                placeholder="Contoh: Sound System Portable / Taplak Altar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select value={kategori} onValueChange={(val) => val && setKategori(val)}>
                <SelectTrigger id="kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Peralatan Ibadat">Peralatan Ibadat</SelectItem>
                  <SelectItem value="Elektronik & Sound">Elektronik & Sound</SelectItem>
                  <SelectItem value="Mebel & Perabot">Mebel & Perabot</SelectItem>
                  <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tahun_beli">Tahun Beli</Label>
                <Input
                  id="tahun_beli"
                  type="number"
                  value={tahunBeli}
                  onChange={(e) => setTahunBeli(parseInt(e.target.value) || 2024)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlah">Jumlah Unit *</Label>
                <Input
                  id="jumlah"
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="harga_satuan">Harga Satuan (Rp) *</Label>
              <Input
                id="harga_satuan"
                type="number"
                value={hargaSatuan}
                onChange={(e) => setHargaSatuan(parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#1a56a0] hover:bg-[#144580] text-white">
                {submitting ? 'Menyimpan...' : 'Simpan Inventaris'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
