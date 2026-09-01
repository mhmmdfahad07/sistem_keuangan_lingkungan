'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { COA, JurnalTransaksi, ProfilLingkungan } from '@/lib/types'
import { formatRupiah, MONTH_NAMES } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileSpreadsheet, RefreshCw, CheckCircle2, ExternalLink, Printer } from 'lucide-react'

export default function LaporanPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [lingkunganId, setLingkunganId] = useState<string | null>(null)
  const [lingkunganName, setLingkunganName] = useState<string>('')

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())

  const [coaList, setCoaList] = useState<COA[]>([])
  const [saldoAwal, setSaldoAwal] = useState<number>(0)
  const [jurnalList, setJurnalList] = useState<JurnalTransaksi[]>([])

  // Google Sheets Export State
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ url: string; msg: string } | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user

        let targetLingkunganId = localStorage.getItem('selected_lingkungan_id')
        if (!targetLingkunganId && user) {
          const { data: uData } = await supabase.from('users').select('lingkungan_id').eq('id', user.id).maybeSingle()
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

        // Fetch COA
        const { data: coas } = await supabase.from('coa').select('*').order('id', { ascending: true })
        if (coas) setCoaList(coas)

        if (targetLingkunganId) {
          // Fetch Saldo Awal
          const { data: profil } = await supabase
            .from('profil_lingkungan')
            .select('saldo_awal')
            .eq('lingkungan_id', targetLingkunganId)
            .maybeSingle()

          setSaldoAwal(Number(profil?.saldo_awal || 0))

          // Fetch Journals
          const { data: journals } = await supabase
            .from('jurnal_transaksi')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)

          if (journals) setJurnalList(journals)
        }
      } catch (err) {
        console.error('Error loading laporan data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Filter transactions for selected month and year
  const monthJournals = jurnalList.filter((j) => {
    const d = new Date(j.tanggal)
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
  })

  // Group revenues (4xxx) by COA
  const revenueCoas = coaList.filter(c => c.id.startsWith('4'))
  const revenueSummary = revenueCoas.map(coa => {
    const total = monthJournals
      .filter(j => j.tipe_arus === 'MASUK' && (j.coa_kredit === coa.id || j.coa_debit === coa.id))
      .reduce((acc, curr) => acc + Number(curr.nominal), 0)
    return { ...coa, total }
  }).filter(c => c.total > 0)

  const totalPenerimaan = revenueSummary.reduce((a, b) => a + b.total, 0)

  // Group expenses (5xxx) by COA
  const expenseCoas = coaList.filter(c => c.id.startsWith('5'))
  const expenseSummary = expenseCoas.map(coa => {
    const total = monthJournals
      .filter(j => j.tipe_arus === 'KELUAR' && (j.coa_debit === coa.id || j.coa_kredit === coa.id))
      .reduce((acc, curr) => acc + Number(curr.nominal), 0)
    return { ...coa, total }
  }).filter(c => c.total > 0)

  const totalPengeluaran = expenseSummary.reduce((a, b) => a + b.total, 0)

  const surplusDefisit = totalPenerimaan - totalPengeluaran
  const saldoAkhir = saldoAwal + surplusDefisit

  // Handle Sync to Google Sheets API
  const handleSyncGoogleSheets = async () => {
    setExporting(true)
    setExportResult(null)

    try {
      const res = await fetch('/api/google-sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lingkunganId,
          namaLingkungan: lingkunganName,
          bulan: MONTH_NAMES[selectedMonth - 1],
          tahun: selectedYear,
          reportData: {
            saldoAwal,
            totalPenerimaan,
            totalPengeluaran,
            surplusDefisit,
            saldoAkhir,
            revenueSummary,
            expenseSummary,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        setExportResult({ url: data.spreadsheetUrl, msg: data.message })
      } else {
        alert('Gagal menyinkronkan: ' + data.error)
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat menyinkronkan: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a56a0]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">M5. Laporan Aktivitas Finansial</h1>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi Penerimaan & Pengeluaran Kas Lingkungan {lingkunganName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="border-slate-300 text-slate-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>

          <Button
            onClick={handleSyncGoogleSheets}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {exporting ? 'Syncing...' : 'Sync to Google Sheets'}
          </Button>
        </div>
      </div>

      {exportResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{exportResult.msg}</span>
          </div>
          <a
            href={exportResult.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:underline bg-white px-3 py-1.5 rounded-md border border-emerald-300"
          >
            Buka Google Sheets <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      )}

      {/* Filter Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-44">
            <Label className="text-xs text-slate-500 mb-1 block">Bulan Laporan</Label>
            <Select value={selectedMonth.toString()} onValueChange={(v) => v && setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
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
        </CardContent>
      </Card>

      {/* Report Document Sheet View */}
      <Card className="border-slate-300 shadow-md bg-white">
        <CardHeader className="text-center border-b border-slate-200 pb-6 pt-8 bg-slate-50/40">
          <CardTitle className="text-xl font-extrabold text-[#1a56a0] tracking-wide uppercase">
            LAPORAN AKTIVITAS LINGKUNGAN
          </CardTitle>
          <p className="text-base font-semibold text-slate-800 mt-1">
            GEREJA ST. CLARA — PAROKI BEKASI UTARA
          </p>
          <p className="text-sm font-medium text-slate-600 mt-0.5">
            Lingkungan: <span className="font-bold text-slate-900">{lingkunganName}</span> | Periode: <span className="font-bold text-slate-900">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
          </p>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-medium">Saldo Awal Kas/Bank</p>
              <p className="text-base font-bold text-slate-800">{formatRupiah(saldoAwal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Penerimaan</p>
              <p className="text-base font-bold text-emerald-600">+{formatRupiah(totalPenerimaan)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Pengeluaran</p>
              <p className="text-base font-bold text-rose-600">-{formatRupiah(totalPengeluaran)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Saldo Kas Akhir</p>
              <p className="text-base font-extrabold text-blue-700">{formatRupiah(saldoAkhir)}</p>
            </div>
          </div>

          {/* Section 1: Penerimaan (Revenues) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-emerald-800 uppercase tracking-wide border-b-2 border-emerald-600 pb-1">
              I. PENERIMAAN (REVENUE)
            </h3>
            <Table>
              <TableHeader className="bg-emerald-50/50">
                <TableRow>
                  <TableHead className="w-24 font-bold">Kode Akun</TableHead>
                  <TableHead className="font-bold">Uraian Akun Penerimaan</TableHead>
                  <TableHead className="text-right font-bold">Jumlah (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-slate-400 text-sm">
                      Belum ada penerimaan di bulan ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  revenueSummary.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">{item.id}</TableCell>
                      <TableCell className="font-medium text-slate-800">{item.nama_akun}</TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">{formatRupiah(item.total)}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-emerald-50/80 font-bold">
                  <TableCell colSpan={2} className="text-emerald-900 text-sm">JUMLAH PENERIMAAN (I)</TableCell>
                  <TableCell className="text-right text-emerald-700 text-base">{formatRupiah(totalPenerimaan)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Section 2: Pengeluaran (Expenses) */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-rose-800 uppercase tracking-wide border-b-2 border-rose-600 pb-1">
              II. PENGELUARAN (EXPENSE)
            </h3>
            <Table>
              <TableHeader className="bg-rose-50/50">
                <TableRow>
                  <TableHead className="w-24 font-bold">Kode Akun</TableHead>
                  <TableHead className="font-bold">Uraian Akun Pengeluaran</TableHead>
                  <TableHead className="text-right font-bold">Jumlah (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-slate-400 text-sm">
                      Belum ada pengeluaran di bulan ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseSummary.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">{item.id}</TableCell>
                      <TableCell className="font-medium text-slate-800">{item.nama_akun}</TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">{formatRupiah(item.total)}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-rose-50/80 font-bold">
                  <TableCell colSpan={2} className="text-rose-900 text-sm">JUMLAH PENGELUARAN (II)</TableCell>
                  <TableCell className="text-right text-rose-700 text-base">{formatRupiah(totalPengeluaran)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Section 3: Surplus / Defisit & Saldo Akhir */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>SURPLUS / (DEFISIT) BULANAN (I - II):</span>
              <span className={surplusDefisit >= 0 ? 'text-emerald-400 text-base font-extrabold' : 'text-rose-400 text-base font-extrabold'}>
                {formatRupiah(surplusDefisit)}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2 flex justify-between items-center text-base font-extrabold">
              <span className="text-blue-300">SALDO KAS / BANK AKHIR KELOLAAN:</span>
              <span className="text-xl text-white">{formatRupiah(saldoAkhir)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
