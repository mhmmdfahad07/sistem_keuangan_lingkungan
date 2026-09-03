'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { JurnalTransaksi, KepalaKeluarga, Aset, ProfilLingkungan } from '@/lib/types'
import { ensureDummyKksForLingkungan } from '@/lib/dummyData'
import { formatRupiah, formatDateIndo } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Package,
  ArrowRight,
  ClipboardEdit,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardOverviewPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [lingkunganId, setLingkunganId] = useState<string | null>(null)
  const [lingkunganName, setLingkunganName] = useState<string>('')
  const [totalKasMasuk, setTotalKasMasuk] = useState(0)
  const [totalKasKeluar, setTotalKasKeluar] = useState(0)
  const [saldoAwal, setSaldoAwal] = useState(0)
  const [totalKK, setTotalKK] = useState(0)
  const [totalBiduk, setTotalBiduk] = useState(0)
  const [totalNilaiAset, setTotalNilaiAset] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<JurnalTransaksi[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)

      try {
        // Get user session & scope
        const { data } = await supabase.auth.getUser()
        const user = data?.user

        if (user) {
          const { data: uData } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
          if (uData?.role === 'SEKRETARIS') {
            window.location.href = '/dashboard/dafu'
            return
          }
        } else {
          // Check demo cookie
          const cookies = document.cookie
          if (cookies.includes('demo_user_role=SEKRETARIS') || cookies.includes('sekretaris@example.com')) {
            window.location.href = '/dashboard/dafu'
            return
          }
        }

        let targetLingkunganId = localStorage.getItem('selected_lingkungan_id')
        if (!targetLingkunganId && user) {
          const { data: uData } = await supabase.from('users').select('lingkungan_id').eq('id', user.id).maybeSingle()
          targetLingkunganId = uData?.lingkungan_id || null
        }

        if (!targetLingkunganId) {
          // Fallback to first lingkungan
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
          // 1. Fetch Profil Lingkungan Saldo Awal
          const { data: profil } = await supabase
            .from('profil_lingkungan')
            .select('saldo_awal')
            .eq('lingkungan_id', targetLingkunganId)
            .maybeSingle()

          const sa = Number(profil?.saldo_awal || 0)
          setSaldoAwal(sa)

          // 2. Fetch Journal Transactions
          const { data: journals } = await supabase
            .from('jurnal_transaksi')
            .select('*, kepala_keluarga:kk_id(nama_kk)')
            .eq('lingkungan_id', targetLingkunganId)
            .order('tanggal', { ascending: false })

          if (journals) {
            let masuk = 0
            let keluar = 0
            journals.forEach((j) => {
              const nom = Number(j.nominal) || 0
              if (j.tipe_arus === 'MASUK') masuk += nom
              else keluar += nom
            })
            setTotalKasMasuk(masuk)
            setTotalKasKeluar(keluar)
            setRecentTransactions(journals.slice(0, 5))
          }

          // 3. Fetch DAFU (KK)
          const { data: kks } = await supabase
            .from('kepala_keluarga')
            .select('*')
            .eq('lingkungan_id', targetLingkunganId)

          let dbKks = kks || []
          const localSaved = localStorage.getItem(`custom_kks_${targetLingkunganId}`)
          if (localSaved) {
            try {
              const parsed: KepalaKeluarga[] = JSON.parse(localSaved)
              const combinedMap = new Map<string, KepalaKeluarga>()
              dbKks.forEach(k => combinedMap.set(k.id, k))
              parsed.forEach(k => combinedMap.set(k.id, k))
              dbKks = Array.from(combinedMap.values())
            } catch (e) {}
          }
          const finalKks = ensureDummyKksForLingkungan(targetLingkunganId, lingkunganName || 'Lingkungan', dbKks)
          setTotalKK(finalKks.length)
          setTotalBiduk(finalKks.filter(k => k.is_biduk).length)

          // 4. Fetch Assets
          const { data: asetList } = await supabase
            .from('aset')
            .select('jumlah, harga_satuan')
            .eq('lingkungan_id', targetLingkunganId)

          if (asetList) {
            const totalVal = asetList.reduce((acc, curr) => acc + (Number(curr.jumlah || 0) * Number(curr.harga_satuan || 0)), 0)
            setTotalNilaiAset(totalVal)
          }
        }
      } catch (err) {
        console.error('Error loading dashboard overview:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [supabase])

  const saldoKasAkhir = saldoAwal + totalKasMasuk - totalKasKeluar

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo-st-clara.jpg"
            alt="Logo St. Clara"
            className="w-12 h-12 rounded-full object-cover border border-amber-400/50 bg-white shrink-0 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                {lingkunganName || 'Lingkungan'}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Gereja St. Clara
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 tracking-tight">Ringkasan Keuangan Lingkungan</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Pantau arus kas, posisi saldo bank, data umat (DAFU), dan inventaris aset secara akurat.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 shrink-0">
          <Link href="/dashboard/jurnal">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer">
              <Receipt className="w-4 h-4 mr-2 text-emerald-400" />
              Input Jurnal
            </Button>
          </Link>
          <Link href="/dashboard/laporan">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
              Laporan
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/90 rounded-2xl p-1 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Kas Bank Akhir</CardTitle>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Wallet className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatRupiah(saldoKasAkhir)}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Saldo Awal: <span className="font-mono text-slate-700">{formatRupiah(saldoAwal)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/60 border-emerald-200 rounded-2xl p-1 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Kas Masuk</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-950 tracking-tight">{formatRupiah(totalKasMasuk)}</div>
            <p className="text-xs text-emerald-700 font-medium mt-1">Penerimaan kas/bank terakumulasi</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/60 border-rose-200 rounded-2xl p-1 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-800">Total Kas Keluar</CardTitle>
            <div className="p-2 bg-rose-100 rounded-xl text-rose-800">
              <TrendingDown className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-950 tracking-tight">{formatRupiah(totalKasKeluar)}</div>
            <p className="text-xs text-rose-700 font-medium mt-1">Pengeluaran kas/bank terakumulasi</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/60 border-amber-200 rounded-2xl p-1 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800">Kepala Keluarga & BIDUK</CardTitle>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-950 tracking-tight">{totalKK} <span className="text-sm font-normal text-amber-700">KK</span></div>
            <p className="text-xs text-amber-800 font-bold mt-1">
              {totalBiduk} Terdaftar BIDUK KAJ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Corporate Cashflow Analytics Section */}
      <Card className="bg-white border-[#E3E6EC] rounded-[12px] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3E6EC] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#22335A] text-white border border-[#2C3E66] px-2 py-0.5 rounded-[4px] font-sans">
                FINANCIAL ANALYSIS
              </span>
              <h2 className="text-lg font-bold text-[#1B2130] font-serif">Analisis Cash Flow & Ketahanan Kas</h2>
            </div>
            <p className="text-xs text-[#5C6478] mt-1">
              Metrik analisis arus kas operasional dan rasio ketahanan kas lingkungan berdasarkan standar akuntansi.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-[#E7F3EC] text-[#2F7A54] border border-[#2F7A54]/20 px-3 py-1.5 rounded-[6px] font-mono">
              Net Margin: {totalKasMasuk > 0 ? (((totalKasMasuk - totalKasKeluar) / totalKasMasuk) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        {/* Corporate Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Operating Cashflow Net Margin */}
          <div className="p-4 rounded-[10px] bg-[#F5F6F9] border border-[#E3E6EC] space-y-2">
            <div className="text-xs font-bold text-[#5C6478] uppercase tracking-wider font-serif">Arus Kas Operasional Bersih</div>
            <div className="text-xl font-extrabold text-[#1B2130] font-mono">
              {formatRupiah(totalKasMasuk - totalKasKeluar)}
            </div>
            <div className="text-[11px] text-[#8A90A3]">
              Selisih total kas masuk operasional dan kas keluar
            </div>
          </div>

          {/* Metric 2: Coverage Ratio (Inflow / Outflow Ratio) */}
          <div className="p-4 rounded-[10px] bg-[#F5F6F9] border border-[#E3E6EC] space-y-2">
            <div className="text-xs font-bold text-[#5C6478] uppercase tracking-wider font-serif">Rasio Kecukupan Kas (Coverage)</div>
            <div className="text-xl font-extrabold text-[#1B2130] font-mono">
              {totalKasKeluar > 0 ? (totalKasMasuk / totalKasKeluar).toFixed(2) : '1.00'}x
            </div>
            <div className="text-[11px] text-[#8A90A3]">
              {totalKasKeluar > 0 && (totalKasMasuk / totalKasKeluar) >= 1
                ? 'Penerimaan mencukupi pengeluaran'
                : 'Pengeluaran melebihi penerimaan'}
            </div>
          </div>

          {/* Metric 3: Cash Runway (Ketahanan Kas) */}
          <div className="p-4 rounded-[10px] bg-[#F5F6F9] border border-[#E3E6EC] space-y-2">
            <div className="text-xs font-bold text-[#5C6478] uppercase tracking-wider font-serif">Estimasi Runway Kas</div>
            <div className="text-xl font-extrabold text-[#1B2130] font-mono">
              {totalKasKeluar > 0 ? (saldoKasAkhir / (totalKasKeluar || 1)).toFixed(1) : '∞'} <span className="text-[#1B2130]">Bulan</span>
            </div>
            <div className="text-[11px] text-[#8A90A3]">
              Daya tahan kas lingkungan meng-cover pengeluaran
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Cash Ratio */}
        <div className="space-y-2 pt-2 border-t border-[#E3E6EC]">
          <div className="flex justify-between text-xs font-bold text-[#1B2130]">
            <span>Komposisi Arus Kas (Inflow vs Outflow)</span>
            <span className="font-mono">
              Inflow: {formatRupiah(totalKasMasuk)} | Outflow: {formatRupiah(totalKasKeluar)}
            </span>
          </div>

          <div className="w-full h-3 bg-[#E3E6EC] rounded-full overflow-hidden flex">
            <div
              className="bg-[#2F7A54] h-full transition-all duration-300"
              style={{
                width: `${
                  totalKasMasuk + totalKasKeluar > 0
                    ? Math.min(100, Math.round((totalKasMasuk / (totalKasMasuk + totalKasKeluar)) * 100))
                    : 50
                }%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{
                width: `${
                  totalKasMasuk + totalKasKeluar > 0
                    ? Math.min(100, Math.round((totalKasKeluar / (totalKasMasuk + totalKasKeluar)) * 100))
                    : 50
                }%`,
              }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-[#5C6478] font-medium pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F7A54] inline-block" /> Total Inflow ({totalKasMasuk + totalKasKeluar > 0 ? Math.round((totalKasMasuk / (totalKasMasuk + totalKasKeluar)) * 100) : 0}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Total Outflow ({totalKasMasuk + totalKasKeluar > 0 ? Math.round((totalKasKeluar / (totalKasMasuk + totalKasKeluar)) * 100) : 0}%)
            </span>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 Columns) */}
        <Card className="lg:col-span-2 bg-white border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Transaksi Jurnal Terbaru</CardTitle>
              <CardDescription className="text-slate-500">Pencatatan kas masuk dan keluar harian</CardDescription>
            </div>
            <Link href="/dashboard/jurnal">
              <Button variant="ghost" size="sm" className="text-emerald-700 font-bold hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer">
                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Belum ada data transaksi jurnal recorded. Silakan input jurnal baru.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          tx.tipe_arus === 'MASUK'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {tx.tipe_arus === 'MASUK' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {tx.keterangan || (tx.tipe_arus === 'MASUK' ? 'Penerimaan Kas' : 'Pengeluaran Kas')}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{formatDateIndo(tx.tanggal)}</span>
                          {tx.kepala_keluarga?.nama_kk && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-slate-700">Penyetor: {tx.kepala_keluarga.nama_kk}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-extrabold ${
                          tx.tipe_arus === 'MASUK' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.tipe_arus === 'MASUK' ? '+' : '-'} {formatRupiah(Number(tx.nominal))}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tx.tipe_arus === 'MASUK' ? `Db:${tx.coa_debit} / Kr:${tx.coa_kredit}` : `Db:${tx.coa_debit} / Kr:${tx.coa_kredit}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links & Assets Summary */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Aset & Inventaris Lingkungan</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Estimasi Nilai Inventaris</p>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">{formatRupiah(totalNilaiAset)}</p>
                  </div>
                </div>
                <Link href="/dashboard/aset">
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer">Detail</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 rounded-2xl shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Navigasi Modul</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <Link
                href="/dashboard/daftar-isian"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-200/80 bg-slate-50/50"
              >
                <div className="flex items-center space-x-2.5">
                  <ClipboardEdit className="w-4 h-4 text-[#A9834F]" />
                  <span className="font-semibold text-slate-800">Daftar Isian & Profil</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/dafu"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-200/80 bg-slate-50/50"
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-[#A9834F]" />
                  <span className="font-semibold text-slate-800">DAFU (Data Umat)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/jurnal"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-200/80 bg-slate-50/50"
              >
                <div className="flex items-center space-x-2.5">
                  <Receipt className="w-4 h-4 text-[#A9834F]" />
                  <span className="font-semibold text-slate-800">Jurnal Transaksi</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/kartu-setoran"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-slate-200/80 bg-slate-50/50"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A9834F]" />
                  <span className="font-semibold text-slate-800">Kartu Setoran 12 Bulan</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


