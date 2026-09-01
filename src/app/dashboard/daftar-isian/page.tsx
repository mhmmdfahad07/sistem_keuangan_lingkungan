'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserRole, UserProfile, KepalaKeluarga, ProfilLingkungan, Lingkungan } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Building, UserCheck, Wallet, Lock, CheckCircle2 } from 'lucide-react'

export default function DaftarIsianPage() {
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [lingkunganId, setLingkunganId] = useState<string | null>(null)
  const [namaLingkungan, setNamaLingkungan] = useState<string>('')
  const [lingkunganList, setLingkunganList] = useState<Lingkungan[]>([])
  const [kkList, setKkList] = useState<KepalaKeluarga[]>([])

  // Form State
  const [profilId, setProfilId] = useState<string | null>(null)
  const [ketuaId, setKetuaId] = useState<string>('')
  const [sekretarisId, setSekretarisId] = useState<string>('')
  const [bendaharaId, setBendaharaId] = useState<string>('')
  const [alamatBendahara, setAlamatBendahara] = useState<string>('')
  const [teleponBendahara, setTeleponBendahara] = useState<string>('')
  const [periodeMasaBakti, setPeriodeMasaBakti] = useState<string>('2024-2026')
  const [isHubKerabat, setIsHubKerabat] = useState<boolean>(false)
  const [isBendaharaKaj, setIsBendaharaKaj] = useState<boolean>(true)

  // Part C Form State
  const [jenisRekening, setJenisRekening] = useState<string>('Tabungan')
  const [namaBank, setNamaBank] = useState<string>('BCA')
  const [noRekening, setNoRekening] = useState<string>('')
  const [tahunBuku, setTahunBuku] = useState<string>('2026')
  const [bulanSaldo, setBulanSaldo] = useState<number>(1)
  const [saldoAwal, setSaldoAwal] = useState<number>(0)

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
          const cookies = document.cookie
          let currentRole: UserRole = 'BENDAHARA'
          if (cookies.includes('demo_user_role=SEKRETARIS') || cookies.includes('sekretaris')) {
            currentRole = 'SEKRETARIS'
          } else if (cookies.includes('demo_user_role=PAROKI') || cookies.includes('paroki')) {
            currentRole = 'PAROKI'
          }
          setUserProfile({
            id: 'demo-user',
            email: `${currentRole.toLowerCase()}@example.com`,
            role: currentRole,
            lingkungan_id: null,
          })
        }

        const { data: allL } = await supabase.from('lingkungan').select('id, nama_lingkungan').order('nama_lingkungan', { ascending: true })
        if (allL) setLingkunganList(allL)

        let targetLingkunganId = localStorage.getItem('selected_lingkungan_id')
        if (!targetLingkunganId && allL && allL.length > 0) {
          targetLingkunganId = allL[0].id
        }

        if (targetLingkunganId) {
          const matched = allL?.find(l => l.id === targetLingkunganId)
          if (matched) setNamaLingkungan(matched.nama_lingkungan)

          setLingkunganId(targetLingkunganId)

          // Load KK list for droplists with local persistence merge
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

          // Load Profil Lingkungan
          const { data: profil } = await supabase
            .from('profil_lingkungan')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)
            .maybeSingle()

          if (profil) {
            setProfilId(profil.id)
            setKetuaId(profil.ketua_id || '')
            setSekretarisId(profil.sekretaris_id || '')
            setBendaharaId(profil.bendahara_id || '')
            setTeleponBendahara(profil.telepon_bendahara || '')
            setPeriodeMasaBakti(profil.periode_masa_bakti || '2024-2026')
            setIsHubKerabat(!!profil.is_hub_kerabat)
            setIsBendaharaKaj(!!profil.is_bendahara_kaj)

            setJenisRekening(profil.jenis_rekening || 'Tabungan')
            setNamaBank(profil.nama_bank || 'BCA')
            setNoRekening(profil.no_rekening || '')
            setTahunBuku(profil.tahun_buku || '2026')
            setBulanSaldo(profil.bulan_saldo || 1)
            setSaldoAwal(Number(profil.saldo_awal || 0))

            // Auto-fill bendahara address if bendahara_id exists
            if (profil.bendahara_id && kks) {
              const b = kks.find(x => x.id === profil.bendahara_id)
              setAlamatBendahara(b?.alamat || '')
            }
          }
        }
      } catch (err) {
        console.error('Error loading daftar isian:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const handleLingkunganSelect = async (id: string) => {
    setLingkunganId(id)
    localStorage.setItem('selected_lingkungan_id', id)
    const selected = lingkunganList.find(l => l.id === id)
    if (selected) setNamaLingkungan(selected.nama_lingkungan)

    // Reload KK list & Profil for newly selected Lingkungan
    const { data: kks } = await supabase.from('kepala_keluarga').select('*').eq('lingkungan_id', id).order('nama_kk', { ascending: true })
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
    setKkList(dbKks.sort((a, b) => a.nama_kk.localeCompare(b.nama_kk)))

    const { data: profil } = await supabase.from('profil_lingkungan').select('*').eq('lingkungan_id', id).maybeSingle()
    if (profil) {
      setProfilId(profil.id)
      setKetuaId(profil.ketua_id || '')
      setSekretarisId(profil.sekretaris_id || '')
      setBendaharaId(profil.bendahara_id || '')
      setTeleponBendahara(profil.telepon_bendahara || '')
      setPeriodeMasaBakti(profil.periode_masa_bakti || '2024-2026')
      setIsHubKerabat(!!profil.is_hub_kerabat)
      setIsBendaharaKaj(!!profil.is_bendahara_kaj)
      setJenisRekening(profil.jenis_rekening || 'Tabungan')
      setNamaBank(profil.nama_bank || 'BCA')
      setNoRekening(profil.no_rekening || '')
      setTahunBuku(profil.tahun_buku || '2026')
      setBulanSaldo(profil.bulan_saldo || 1)
      setSaldoAwal(Number(profil.saldo_awal || 0))
    } else {
      setProfilId(null)
      setKetuaId('')
      setSekretarisId('')
      setBendaharaId('')
      setAlamatBendahara('')
      setTeleponBendahara('')
    }
  }

  // Handle Bendahara Selection auto-fill address
  const handleBendaharaSelect = (id: string) => {
    setBendaharaId(id)
    const match = kkList.find(k => k.id === id)
    if (match) {
      setAlamatBendahara(match.alamat || '')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lingkunganId) return

    setSaving(true)
    setSuccessMessage(null)

    const payload = {
      lingkungan_id: lingkunganId,
      ketua_id: ketuaId || null,
      sekretaris_id: sekretarisId || null,
      bendahara_id: bendaharaId || null,
      telepon_bendahara: teleponBendahara,
      periode_masa_bakti: periodeMasaBakti,
      is_hub_kerabat: isHubKerabat,
      is_bendahara_kaj: isBendaharaKaj,
      jenis_rekening: jenisRekening,
      nama_bank: namaBank,
      no_rekening: noRekening,
      tahun_buku: tahunBuku,
      bulan_saldo: bulanSaldo,
      saldo_awal: saldoAwal,
    }

    let error = null
    if (profilId) {
      const res = await supabase.from('profil_lingkungan').update(payload).eq('id', profilId)
      error = res.error
    } else {
      const res = await supabase.from('profil_lingkungan').insert(payload)
      error = res.error
    }

    setSaving(false)

    if (error) {
      alert('Gagal menyimpan profil: ' + error.message)
    } else {
      setSuccessMessage('Daftar Isian berhasil disimpan!')
      setTimeout(() => setSuccessMessage(null), 4000)
    }
  }

  const userRole = userProfile?.role || 'BENDAHARA'
  const isSekretarisOrAdmin = userRole === 'SEKRETARIS' || userRole === 'BENDAHARA'
  const isSekretarisEditable = userRole === 'SEKRETARIS' || userRole === 'BENDAHARA'
  const isBendaharaEditable = userRole === 'BENDAHARA'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a56a0]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2130] tracking-tight font-serif">Daftar Isian & Profil Lingkungan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Data identitas lingkungan, pengurus (Ketua, Sekretaris, Bendahara), dan informasi pembukuan bank.
          </p>
        </div>
        {isSekretarisOrAdmin && (
          <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer">
            <Save className="w-4 h-4 mr-2 text-emerald-400" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* BAGIAN A: Identitas Lingkungan */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                BAGIAN A: Identitas Lingkungan
              </CardTitle>
              <CardDescription className="text-slate-500">Dikelola & diisi oleh Sekretaris Lingkungan</CardDescription>
            </div>
            {isSekretarisEditable ? (
              <span className="text-xs bg-[#E7F3EC] text-[#2F7A54] border border-[#2F7A54]/20 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7A54]" /> Akses Input (Sekretaris)
              </span>
            ) : (
              <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                <Lock className="w-3.5 h-3.5 text-purple-600" /> Read Only (Pengawas Paroki)
              </span>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama_lingkungan" className="text-xs font-semibold text-slate-700">Nama Lingkungan</Label>
                <Select
                  value={lingkunganId || ''}
                  onValueChange={(val) => val && handleLingkunganSelect(val)}
                  disabled={!isSekretarisEditable}
                >
                  <SelectTrigger id="nama_lingkungan" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500 font-semibold">
                    <SelectValue placeholder="-- Pilih Lingkungan --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-white border-slate-200 text-slate-900">
                    {lingkunganList.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        Lingkungan {l.nama_lingkungan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ketua_id" className="text-xs font-semibold text-slate-700">Ketua Lingkungan</Label>
                <Select value={ketuaId} onValueChange={(val) => val && setKetuaId(val)} disabled={!isSekretarisEditable}>
                  <SelectTrigger id="ketua_id" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                    <SelectValue placeholder="-- Pilih Ketua Lingkungan --" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {kkList.map((kk) => (
                      <SelectItem key={kk.id} value={kk.id}>{kk.nama_kk}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">Sumber data dari Modul DAFU</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sekretaris_id" className="text-xs font-semibold text-slate-700">Sekretaris Lingkungan</Label>
                <Select value={sekretarisId} onValueChange={(val) => val && setSekretarisId(val)} disabled={!isSekretarisEditable}>
                  <SelectTrigger id="sekretaris_id" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                    <SelectValue placeholder="-- Pilih Sekretaris --" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {kkList.map((kk) => (
                      <SelectItem key={kk.id} value={kk.id}>{kk.nama_kk}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">Sumber data dari Modul DAFU</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BAGIAN B: Identitas Bendahara */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                BAGIAN B: Identitas Bendahara
              </CardTitle>
              <CardDescription className="text-slate-500">Dikelola & diisi oleh Sekretaris Lingkungan</CardDescription>
            </div>
            {isSekretarisEditable ? (
              <span className="text-xs bg-[#E7F3EC] text-[#2F7A54] border border-[#2F7A54]/20 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7A54]" /> Akses Input (Sekretaris)
              </span>
            ) : (
              <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                <Lock className="w-3.5 h-3.5 text-purple-600" /> Read Only (Pengawas Paroki)
              </span>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bendahara_id" className="text-xs font-semibold text-slate-700">Nama Bendahara Lingkungan</Label>
                <Select value={bendaharaId} onValueChange={(val) => val && handleBendaharaSelect(val)} disabled={!isSekretarisEditable}>
                  <SelectTrigger id="bendahara_id" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                    <SelectValue placeholder="-- Pilih Bendahara --" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {kkList.map((kk) => (
                      <SelectItem key={kk.id} value={kk.id}>{kk.nama_kk}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat_bendahara" className="text-xs font-semibold text-slate-700">Alamat Bendahara</Label>
                <Input
                  id="alamat_bendahara"
                  value={alamatBendahara}
                  disabled
                  placeholder="Otomatis terisi dari DAFU"
                  className="bg-slate-100 border-slate-200 text-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telepon" className="text-xs font-semibold text-slate-700">Nomor Telepon / WhatsApp</Label>
                <Input
                  id="telepon"
                  value={teleponBendahara}
                  onChange={(e) => setTeleponBendahara(e.target.value)}
                  disabled={!isSekretarisEditable}
                  placeholder="081234567890"
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periode" className="text-xs font-semibold text-slate-700">Periode Masa Bhakti</Label>
                <Select value={periodeMasaBakti} onValueChange={(val) => val && setPeriodeMasaBakti(val)} disabled={!isSekretarisEditable}>
                  <SelectTrigger id="periode" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="2024-2026">2024 - 2026</SelectItem>
                    <SelectItem value="2027-2029">2027 - 2029</SelectItem>
                    <SelectItem value="2030-2032">2030 - 2032</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hub_kerabat" className="text-xs font-semibold text-slate-700">Hubungan Kekerabatan dgn Ketua</Label>
                <Select
                  value={isHubKerabat ? 'YA' : 'TIDAK'}
                  onValueChange={(val) => setIsHubKerabat(val === 'YA')}
                  disabled={!isSekretarisEditable}
                >
                  <SelectTrigger id="hub_kerabat" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="TIDAK">Tidak Ada Hubungan Kekerabatan</SelectItem>
                    <SelectItem value="YA">Ada Hubungan Kekerabatan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="biduk_kaj" className="text-xs font-semibold text-slate-700">Terdaftar di BIDUK KAJ</Label>
                <Select
                  value={isBendaharaKaj ? 'YA' : 'TIDAK'}
                  onValueChange={(val) => setIsBendaharaKaj(val === 'YA')}
                  disabled={!isSekretarisEditable}
                >
                  <SelectTrigger id="biduk_kaj" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="YA">Ya, Terdaftar BIDUK</SelectItem>
                    <SelectItem value="TIDAK">Tidak Terdaftar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BAGIAN C: Informasi Pembukuan */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                BAGIAN C: Informasi Pembukuan & Bank
              </CardTitle>
              <CardDescription className="text-slate-500">Dikelola & diisi oleh Bendahara Lingkungan</CardDescription>
            </div>
            {isBendaharaEditable ? (
              <span className="text-xs bg-[#E7F3EC] text-[#2F7A54] border border-[#2F7A54]/20 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7A54]" /> Akses Input (Bendahara)
              </span>
            ) : userRole === 'SEKRETARIS' ? (
              <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Khusus Pembukuan Bendahara
              </span>
            ) : (
              <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                <Lock className="w-3.5 h-3.5 text-purple-600" /> Read Only (Pengawas Paroki)
              </span>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_rekening" className="text-xs font-semibold text-slate-700">Jenis Rekening</Label>
                <Input
                  id="jenis_rekening"
                  value={jenisRekening}
                  onChange={(e) => setJenisRekening(e.target.value)}
                  disabled={!isBendaharaEditable}
                  placeholder="Tabungan / Giro"
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama_bank" className="text-xs font-semibold text-slate-700">Nama Bank</Label>
                <Input
                  id="nama_bank"
                  value={namaBank}
                  onChange={(e) => setNamaBank(e.target.value)}
                  disabled={!isBendaharaEditable}
                  placeholder="BCA / Mandiri / BRI"
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="no_rekening" className="text-xs font-semibold text-slate-700">Nomor Rekening Bank</Label>
                <Input
                  id="no_rekening"
                  value={noRekening}
                  onChange={(e) => setNoRekening(e.target.value)}
                  disabled={!isBendaharaEditable}
                  placeholder="1234567890"
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tahun_buku" className="text-xs font-semibold text-slate-700">Tahun Buku Pembukuan</Label>
                <Input
                  id="tahun_buku"
                  value={tahunBuku}
                  onChange={(e) => setTahunBuku(e.target.value)}
                  disabled={!isBendaharaEditable}
                  placeholder="2026"
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulan_saldo" className="text-xs font-semibold text-slate-700">Bulan Saldo Awal</Label>
                <Select
                  value={bulanSaldo.toString()}
                  onValueChange={(val) => val && setBulanSaldo(parseInt(val))}
                  disabled={!isBendaharaEditable}
                >
                  <SelectTrigger id="bulan_saldo" className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="1">Januari</SelectItem>
                    <SelectItem value="2">Februari</SelectItem>
                    <SelectItem value="3">Maret</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">Mei</SelectItem>
                    <SelectItem value="6">Juni</SelectItem>
                    <SelectItem value="7">Juli</SelectItem>
                    <SelectItem value="8">Agustus</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">Oktober</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">Desember</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saldo_awal" className="text-xs font-semibold text-slate-700">Saldo Awal Pembukuan (Rp)</Label>
                <Input
                  id="saldo_awal"
                  type="number"
                  value={saldoAwal}
                  onChange={(e) => setSaldoAwal(parseFloat(e.target.value) || 0)}
                  disabled={!isBendaharaEditable}
                  placeholder="0"
                  className="bg-white border-slate-300 text-slate-900 rounded-xl focus:ring-emerald-500 font-mono font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isSekretarisOrAdmin && (
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-2.5 rounded-xl shadow-xs cursor-pointer">
              <Save className="w-4 h-4 mr-2 text-emerald-400" />
              {saving ? 'Menyimpan...' : 'Simpan Profil Lingkungan'}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}

