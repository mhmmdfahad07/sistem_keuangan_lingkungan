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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a56a0]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">M7. Kartu Setoran Umat 12 Bulan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Matriks rekapitulasi setoran wajib per Kepala Keluarga Lingkungan {lingkunganName}.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <Label className="text-xs text-slate-500 mb-1 block">Pilih Akun Setoran</Label>
              <Select value={selectedCoa} onValueChange={(val) => val && setSelectedCoa(val)}>
                <SelectTrigger className="h-9 font-semibold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coaOptions.map((opt) => (
                    <SelectItem key={opt.code} value={opt.code}>{opt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-28">
              <Label className="text-xs text-slate-500 mb-1 block">Tahun</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => v && setSelectedYear(parseInt(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table View */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#1a56a0]" />
            Rekap Setoran [{selectedCoa}] {coaOptions.find(c => c.code === selectedCoa)?.name.split('-')[1]} Tahun {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="text-xs border-collapse">
            <TableHeader className="bg-slate-100 text-slate-700">
              <TableRow>
                <TableHead className="w-10 text-center sticky left-0 bg-slate-100 z-10 border-r border-slate-200">No</TableHead>
                <TableHead className="w-48 sticky left-10 bg-slate-100 z-10 border-r border-slate-200 font-bold text-slate-900">
                  Nama Kepala Keluarga
                </TableHead>
                {MONTH_NAMES.map((m, idx) => (
                  <TableHead key={idx} className="w-20 text-center font-semibold border-r border-slate-200">
                    {m.slice(0, 3)}
                  </TableHead>
                ))}
                <TableHead className="w-28 text-right font-bold text-slate-900 bg-slate-200">Total Setor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                    <TableRow key={kk.id} className="hover:bg-slate-50 border-b border-slate-200">
                      <TableCell className="text-center font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-200">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 sticky left-10 bg-white border-r border-slate-200 truncate">
                        {kk.nama_kk}
                      </TableCell>
                      {MONTH_NAMES.map((_, mIdx) => {
                        const amount = getMatrixNominal(kk.id, mIdx + 1)
                        kkTotalYear += amount
                        return (
                          <TableCell key={mIdx} className="text-center border-r border-slate-100 p-1">
                            {amount > 0 ? (
                              <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]" title={formatRupiah(amount)}>
                                ✓ {amount >= 1000 ? `${amount / 1000}k` : amount}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-[10px]">-</span>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-right font-bold font-mono text-emerald-700 bg-slate-50">
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
