'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { KepalaKeluarga, JurnalTransaksi } from '@/lib/types'
import { formatRupiah, MONTH_NAMES } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, CreditCard, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function KartuSetoranPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [lingkunganId, setLingkunganId] = useState<string | null>(null)
  const [lingkunganName, setLingkunganName] = useState('')

  const [kkList, setKkList] = useState<KepalaKeluarga[]>([])
  const [jurnalList, setJurnalList] = useState<JurnalTransaksi[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedCoa, setSelectedCoa] = useState<string>('4100') // 4100 Kas, 4200 ASAK, 4300 St Yusuf, 4120 Dahar Romo
  const [selectedYear, setSelectedYear] = useState<number>(2026)

  const coaOptions = [
    { code: '4100', name: '4100 - Iuran Kas Lingkungan' },
    { code: '4200', name: '4200 - Sumbangan ASAK' },
    { code: '4300', name: '4300 - St. Yusuf / Kematian' },
    { code: '4120', name: '4120 - Sumbangan Dahar Romo' },
  ]

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        let targetLingkunganId = localStorage.getItem('selected_lingkungan_id')
        if (!targetLingkunganId) {
          const { data: uData } = await supabase.from('users').select('lingkungan_id').limit(1).maybeSingle()
          targetLingkunganId = uData?.lingkungan_id || null
        }

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
          // Fetch KK list
          const { data: kks } = await supabase
            .from('kepala_keluarga')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)
            .order('nama_kk', { ascending: true })

          if (kks) setKkList(kks)

          // Fetch Journals
          const { data: journals } = await supabase
            .from('jurnal_transaksi')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)
            .eq('tipe_arus', 'MASUK')

          if (journals) setJurnalList(journals)
        }
      } catch (err) {
        console.error('Error loading kartu setoran:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const filteredKkList = kkList.filter(k =>
    k.nama_kk.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.alamat && k.alamat.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Compute setoran matrix: KK ID -> month (1-12) -> total nominal
  const getMatrixNominal = (kkId: string, month: number) => {
    return jurnalList
      .filter(j => {
        if (j.kk_id !== kkId) return false
        if (j.coa_debit !== selectedCoa && j.coa_kredit !== selectedCoa) return false
        const d = new Date(j.tanggal)
        return d.getMonth() + 1 === month && d.getFullYear() === selectedYear
      })
      .reduce((acc, curr) => acc + Number(curr.nominal), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">M7. Kartu Setoran 12 Bulan per KK</h1>
        <p className="text-sm text-slate-400 mt-1">
          Matriks Rekapitulasi Iuran Wajib, Sukarela, Pembangunan, atau Dana Kematian per KK Lingkungan <span className="text-emerald-400 font-semibold">{lingkunganName}</span>.
        </p>
      </div>

      {/* Filter & Toolbar */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-md">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <Label className="text-xs font-medium text-slate-400 mb-1 block">Jenis Iuran / Pos Penerimaan</Label>
              <Select value={selectedCoa} onValueChange={(val) => val && setSelectedCoa(val)}>
                <SelectTrigger className="h-9 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {coaOptions.map((opt) => (
                    <SelectItem key={opt.code} value={opt.code}>
                      [{opt.code}] {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-28">
              <Label className="text-xs font-medium text-slate-400 mb-1 block">Tahun</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => v && setSelectedYear(parseInt(v))}>
                <SelectTrigger className="h-9 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Cari nama KK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table View */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-md overflow-hidden">
        <CardHeader className="bg-slate-800/50 border-b border-slate-800 py-3">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Rekap Setoran [{selectedCoa}] {coaOptions.find(c => c.code === selectedCoa)?.name.split('-')[1]} Tahun {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="text-xs border-collapse">
            <TableHeader className="bg-slate-800/80 text-slate-300">
              <TableRow className="border-slate-800">
                <TableHead className="w-10 text-center sticky left-0 bg-slate-800 z-10 border-r border-slate-800 text-slate-400">No</TableHead>
                <TableHead className="w-48 sticky left-10 bg-slate-800 z-10 border-r border-slate-800 font-bold text-white">
                  Nama Kepala Keluarga
                </TableHead>
                {MONTH_NAMES.map((m, idx) => (
                  <TableHead key={idx} className="w-20 text-center font-semibold border-r border-slate-800 text-slate-300">
                    {m.slice(0, 3)}
                  </TableHead>
                ))}
                <TableHead className="w-28 text-right font-bold text-emerald-400 bg-slate-800/90">Total Setor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-800">
              {filteredKkList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-slate-400">
                    Tidak ada data Kepala Keluarga terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKkList.map((kk, idx) => {
                  let kkTotalYear = 0
                  return (
                    <TableRow key={kk.id} className="hover:bg-slate-800/50 border-b border-slate-800">
                      <TableCell className="text-center font-mono text-xs text-slate-400 sticky left-0 bg-slate-900 border-r border-slate-800">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-white sticky left-10 bg-slate-900 border-r border-slate-800 truncate">
                        {kk.nama_kk}
                      </TableCell>
                      {MONTH_NAMES.map((_, mIdx) => {
                        const amount = getMatrixNominal(kk.id, mIdx + 1)
                        kkTotalYear += amount
                        return (
                          <TableCell key={mIdx} className="text-center border-r border-slate-800/60 p-1">
                            {amount > 0 ? (
                              <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded text-[10px]" title={formatRupiah(amount)}>
                                ✓ {amount >= 1000 ? `${amount / 1000}k` : amount}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">-</span>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-right font-mono font-extrabold text-emerald-400 bg-slate-800/30 px-3">
                        {formatRupiah(kkTotalYear)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
