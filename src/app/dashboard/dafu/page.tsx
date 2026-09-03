'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserRole, UserProfile, KepalaKeluarga, Lingkungan } from '@/lib/types'
import { MASTER_LINGKUNGAN_LIST, formatNamaLingkungan } from '@/lib/constants'
import { ensureDummyKksForLingkungan } from '@/lib/dummyData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Pencil, Trash2, Users, ShieldCheck, CheckCircle2, XCircle, Lock, Building, Crown, FileText, Wallet } from 'lucide-react'

export default function DafuPage() {
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [lingkunganId, setLingkunganId] = useState<string | null>(null)
  const [lingkunganName, setLingkunganName] = useState<string>('')
  const [lingkunganList, setLingkunganList] = useState<Lingkungan[]>([])

  const [kkList, setKkList] = useState<KepalaKeluarga[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Pengurus Role State (Synced with Daftar Isian)
  const [ketuaId, setKetuaId] = useState<string | null>(null)
  const [ketuaNama, setKetuaNama] = useState<string>('')
  const [sekretarisId, setSekretarisId] = useState<string | null>(null)
  const [sekretarisNama, setSekretarisNama] = useState<string>('')
  const [bendaharaId, setBendaharaId] = useState<string | null>(null)
  const [bendaharaNama, setBendaharaNama] = useState<string>('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKk, setEditingKk] = useState<KepalaKeluarga | null>(null)
  const [formNama, setFormNama] = useState('')
  const [formAlamat, setFormAlamat] = useState('')
  const [formIsBiduk, setFormIsBiduk] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState(false)

  const prepareMasterLingkunganList = (dbList: Lingkungan[]): Lingkungan[] => {
    const map = new Map<string, Lingkungan>()

    dbList.forEach(l => {
      const cleanName = l.nama_lingkungan.replace(/^lingkungan\s+/i, '').trim()
      map.set(cleanName.toLowerCase(), { id: l.id, nama_lingkungan: cleanName })
    })

    MASTER_LINGKUNGAN_LIST.forEach((mName) => {
      const key = mName.toLowerCase().trim()
      if (!map.has(key)) {
        map.set(key, {
          id: `csv-${key.replace(/[^a-z0-9]/g, '-')}`,
          nama_lingkungan: mName
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => a.nama_lingkungan.localeCompare(b.nama_lingkungan))
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user

        if (user) {
          const { data: uData } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
          if (uData) setUserProfile(uData)
        } else {
          const cookies = typeof document !== 'undefined' ? document.cookie : ''
          let currentRole: UserRole = 'SEKRETARIS'
          if (cookies.includes('demo_user_role=BENDAHARA')) {
            currentRole = 'BENDAHARA'
          } else if (cookies.includes('demo_user_role=PAROKI')) {
            currentRole = 'PAROKI'
          } else if (cookies.includes('demo_user_role=SEKRETARIS')) {
            currentRole = 'SEKRETARIS'
          }
          setUserProfile({
            id: 'demo-user',
            email: `${currentRole.toLowerCase()}@example.com`,
            role: currentRole,
            lingkungan_id: null,
          })
        }

        const { data: allL } = await supabase.from('lingkungan').select('id, nama_lingkungan').order('nama_lingkungan', { ascending: true })
        const masterList = prepareMasterLingkunganList(allL || [])
        setLingkunganList(masterList)

        let targetLingkunganId = localStorage.getItem('selected_lingkungan_id')
        if (!targetLingkunganId && masterList.length > 0) {
          targetLingkunganId = masterList[0].id
        }

        if (targetLingkunganId) {
          const matched = masterList.find(l => l.id === targetLingkunganId)
          if (matched) setLingkunganName(matched.nama_lingkungan)
          setLingkunganId(targetLingkunganId)
          await loadKksAndProfil(targetLingkunganId, matched?.nama_lingkungan || '')
        }
      } catch (err) {
        console.error('Error loading dafu data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const loadKksAndProfil = async (id: string, lName: string) => {
    // 1. Fetch KK List
    const { data: kks } = await supabase
      .from('kepala_keluarga')
      .select('*')
      .eq('lingkungan_id', id)
      .order('nama_kk', { ascending: true })

    let dbKks = kks || []
    const localSaved = localStorage.getItem(`custom_kks_${id}`)
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
    const allSaved = localStorage.getItem('custom_kks_all_store')
    if (allSaved) {
      try {
        const allParsed: KepalaKeluarga[] = JSON.parse(allSaved)
        const matched = allParsed.filter(k => k.lingkungan_id === id)
        const combinedMap = new Map<string, KepalaKeluarga>()
        dbKks.forEach(k => combinedMap.set(k.id, k))
        matched.forEach(k => combinedMap.set(k.id, k))
        dbKks = Array.from(combinedMap.values())
      } catch (e) {
        console.error(e)
      }
    }

    const finalKks = ensureDummyKksForLingkungan(id, lName || 'Lingkungan', dbKks)
    setKkList(finalKks)

    // 2. Fetch Profil Lingkungan (Pengurus Roles)
    setKetuaId(null)
    setKetuaNama('')
    setSekretarisId(null)
    setSekretarisNama('')
    setBendaharaId(null)
    setBendaharaNama('')

    const { data: profil } = await supabase
      .from('profil_lingkungan')
      .select('ketua_id, sekretaris_id, bendahara_id, ketua_nama, sekretaris_nama, bendahara_nama, ketua:ketua_id(nama_kk), sekretaris:sekretaris_id(nama_kk), bendahara:bendahara_id(nama_kk)')
      .eq('lingkungan_id', id)
      .maybeSingle()

    if (profil) {
      const pAny = profil as any
      if (pAny.ketua_id) setKetuaId(pAny.ketua_id)
      if (pAny.ketua_nama) setKetuaNama(pAny.ketua_nama)
      else if (pAny.ketua) {
        const kObj = Array.isArray(pAny.ketua) ? pAny.ketua[0] : pAny.ketua
        if (kObj?.nama_kk) setKetuaNama(kObj.nama_kk)
      }

      if (pAny.sekretaris_id) setSekretarisId(pAny.sekretaris_id)
      if (pAny.sekretaris_nama) setSekretarisNama(pAny.sekretaris_nama)
      else if (pAny.sekretaris) {
        const sObj = Array.isArray(pAny.sekretaris) ? pAny.sekretaris[0] : pAny.sekretaris
        if (sObj?.nama_kk) setSekretarisNama(sObj.nama_kk)
      }

      if (pAny.bendahara_id) setBendaharaId(pAny.bendahara_id)
      if (pAny.bendahara_nama) setBendaharaNama(pAny.bendahara_nama)
      else if (pAny.bendahara) {
        const bObj = Array.isArray(pAny.bendahara) ? pAny.bendahara[0] : pAny.bendahara
        if (bObj?.nama_kk) setBendaharaNama(bObj.nama_kk)
      }
    }

    // Merge saved local manual entry if any
    const savedManual = localStorage.getItem(`profil_manual_${id}`)
    if (savedManual) {
      try {
        const p = JSON.parse(savedManual)
        if (p.ketuaId) setKetuaId(p.ketuaId)
        if (p.ketuaNama) setKetuaNama(p.ketuaNama)
        if (p.sekretarisId) setSekretarisId(p.sekretarisId)
        if (p.sekretarisNama) setSekretarisNama(p.sekretarisNama)
        if (p.bendaharaId) setBendaharaId(p.bendaharaId)
        if (p.bendaharaNama) setBendaharaNama(p.bendaharaNama)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleLingkunganChange = async (id: string) => {
    setLingkunganId(id)
    localStorage.setItem('selected_lingkungan_id', id)
    const selected = lingkunganList.find(l => l.id === id)
    const lName = selected?.nama_lingkungan || ''
    if (selected) setLingkunganName(lName)
    await loadKksAndProfil(id, lName)
  }

  const userRole = userProfile?.role || 'SEKRETARIS'
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
        const allSaved = localStorage.getItem('custom_kks_all_store')
        let allList: KepalaKeluarga[] = []
        if (allSaved) {
          try { allList = JSON.parse(allSaved) } catch(e) {}
        }
        allList = allList.filter(k => k.id !== editingKk.id)
        allList.push({ id: editingKk.id, ...payload })
        localStorage.setItem('custom_kks_all_store', JSON.stringify(allList))
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
        const allSaved = localStorage.getItem('custom_kks_all_store')
        let allList: KepalaKeluarga[] = []
        if (allSaved) {
          try { allList = JSON.parse(allSaved) } catch(e) {}
        }
        allList = allList.filter(k => k.id !== newItem.id)
        allList.push(newItem)
        localStorage.setItem('custom_kks_all_store', JSON.stringify(allList))
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
  const totalNonBiduk = totalKK - totalBiduk

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2130] tracking-tight font-serif">DAFU (Daftar Umat / Kepala Keluarga)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Master Data Umat Lingkungan <span className="text-emerald-700 font-semibold">{formatNamaLingkungan(lingkunganName)}</span>. Dikurasi & dikelola oleh Sekretaris.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Lingkungan Quick Switcher */}
          <div className="w-full sm:w-64">
            <Select value={lingkunganId || ''} onValueChange={(val) => val && handleLingkunganChange(val)}>
              <SelectTrigger className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500 font-semibold h-11">
                <Building className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
                <SelectValue placeholder="— Pilih Lingkungan —">
                  {lingkunganName ? formatNamaLingkungan(lingkunganName) : '— Pilih Lingkungan —'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-white border-slate-200 text-slate-900">
                {lingkunganList.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {formatNamaLingkungan(l.nama_lingkungan)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canEdit ? (
            <Button onClick={openAddModal} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer h-11 shrink-0">
              <Plus className="w-4 h-4 mr-2 text-emerald-400" />
              Tambah Kepala Keluarga
            </Button>
          ) : userRole === 'BENDAHARA' ? (
            <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-xs shrink-0">
              <Lock className="w-4 h-4 text-amber-600" /> Read Only (Khusus Sekretaris)
            </span>
          ) : (
            <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold shadow-xs shrink-0">
              <Lock className="w-4 h-4 text-purple-600" /> Read Only (Pengawas Paroki)
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total KK */}
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

        {/* Card 2: Terdaftar BIDUK */}
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

        {/* Card 3: Tidak Terdaftar BIDUK KAJ (Updated as requested) */}
        <Card className="bg-rose-50/60 border-rose-200 rounded-2xl p-1 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-800">Tidak Terdaftar BIDUK KAJ</CardTitle>
            <div className="p-2 bg-rose-100 rounded-xl text-rose-800">
              <XCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-950">{totalNonBiduk} <span className="text-sm font-normal text-rose-700">KK</span></div>
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
                    Tidak ada data Kepala Keluarga ditemukan untuk {formatNamaLingkungan(lingkunganName)}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKkList.map((kk, idx) => {
                  const isKetua = (ketuaId && kk.id === ketuaId) || (ketuaNama && kk.nama_kk.toLowerCase().trim() === ketuaNama.toLowerCase().trim())
                  const isSekretaris = (sekretarisId && kk.id === sekretarisId) || (sekretarisNama && kk.nama_kk.toLowerCase().trim() === sekretarisNama.toLowerCase().trim())
                  const isBendahara = (bendaharaId && kk.id === bendaharaId) || (bendaharaNama && kk.nama_kk.toLowerCase().trim() === bendaharaNama.toLowerCase().trim())

                  return (
                    <TableRow key={kk.id} className="hover:bg-slate-50 transition">
                      <TableCell className="text-center font-mono text-xs text-slate-500">{idx + 1}</TableCell>
                      
                      {/* Name + Pengurus Sync Badges */}
                      <TableCell className="font-semibold text-slate-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-900 font-bold">{kk.nama_kk}</span>
                          
                          {isKetua && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Ketua Lingkungan
                            </span>
                          )}
                          {isSekretaris && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Sekretaris
                            </span>
                          )}
                          {isBendahara && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Bendahara
                            </span>
                          )}
                        </div>
                      </TableCell>

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
                  )
                })
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
