'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { JurnalTransaksi, KepalaKeluarga, Aset, ProfilLingkungan } from '@/lib/types'
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
            .select('id, is_biduk')
            .eq('lingkungan_id', targetLingkunganId)

          if (kks) {
            setTotalKK(kks.length)
            setTotalBiduk(kks.filter(k => k.is_biduk).length)
          }

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a56a0]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a56a0] to-blue-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-xs">
            {lingkunganName || 'Lingkungan'}
          </span>
          <h1 className="text-2xl font-bold mt-2">Ringkasan Keuangan Lingkungan</h1>
          <p className="text-blue-100 text-sm mt-1">
            Pantau arus kas, posisi saldo bank, data umat (DAFU), dan inventaris aset lingkungan secara akurat.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/jurnal">
            <Button className="bg-white text-[#1a56a0] hover:bg-blue-50 font-semibold shadow-xs">
              <Receipt className="w-4 h-4 mr-2" />
              Input Jurnal
            </Button>
          </Link>
          <Link href="/dashboard/laporan">
            <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Laporan
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Kas Bank Akhir</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{formatRupiah(saldoKasAkhir)}</div>
            <p className="text-xs text-slate-500 mt-1">
              Saldo Awal: {formatRupiah(saldoAwal)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Kas Masuk</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600">{formatRupiah(totalKasMasuk)}</div>
            <p className="text-xs text-slate-500 mt-1">Penerimaan kas/bank terakumulasi</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Kas Keluar</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600">{formatRupiah(totalKasKeluar)}</div>
            <p className="text-xs text-slate-500 mt-1">Pengeluaran kas/bank terakumulasi</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Kepala Keluarga & BIDUK</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">{totalKK} <span className="text-sm font-normal text-slate-500">KK</span></div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {totalBiduk} Terdaftar BIDUK KAJ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Recent Transactions & Quick Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 Columns) */}
        <Card className="lg:col-span-2 border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Transaksi Jurnal Terbaru</CardTitle>
              <CardDescription>Pencatatan kas masuk dan keluar harian</CardDescription>
            </div>
            <Link href="/dashboard/jurnal">
              <Button variant="ghost" size="sm" className="text-[#1a56a0] hover:bg-blue-50">
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
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          tx.tipe_arus === 'MASUK'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
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
                        className={`text-sm font-bold ${
                          tx.tipe_arus === 'MASUK' ? 'text-emerald-600' : 'text-rose-600'
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
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Aset & Inventaris Lingkungan</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Estimasi Nilai Inventaris</p>
                    <p className="text-base font-bold text-slate-900">{formatRupiah(totalNilaiAset)}</p>
                  </div>
                </div>
                <Link href="/dashboard/aset">
                  <Button variant="outline" size="sm">Detail</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Navigasi Modul</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <Link
                href="/dashboard/daftar-isian"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition border border-slate-100"
              >
                <div className="flex items-center space-x-2.5">
                  <ClipboardEdit className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-slate-700">M1. Daftar Isian & Profil</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/dafu"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition border border-slate-100"
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-700">M2. DAFU (Data Umat)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/jurnal"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition border border-slate-100"
              >
                <div className="flex items-center space-x-2.5">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-slate-700">M4. Jurnal Transaksi</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/dashboard/kartu-setoran"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition border border-slate-100"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium text-slate-700">M7. Kartu Setoran 12 Bulan</span>
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
