import { KepalaKeluarga } from './types'

// Names pool for generating realistic Catholic Indonesian Umat/KK per Lingkungan
const CATHOLIC_FIRST_NAMES = [
  'Petrus', 'Maria', 'Antonius', 'Theresa', 'Yohanes',
  'Ignatius', 'Clara', 'Stephanus', 'Bernadette', 'FX',
  'Agustinus', 'Elisabeth', 'Joseph', 'Cecilia', 'Pauluz',
  'Anastasia', 'Dominikus', 'Veronica', 'Francisca', 'Benediktus'
]

const LAST_NAMES = [
  'Sugeng', 'Francisca', 'Budi', 'Wati', 'Koko',
  'Rossi', 'Setiawati', 'Hartono', 'Tri', 'Bambang',
  'Santoso', 'Wijaya', 'Kusuma', 'Purnama', 'Sutrisno',
  'Pratama', 'Hidayat', 'Gunawan', 'Laksana', 'Handoko'
]

export function getDummyKkListForLingkungan(lingkunganId: string, namaLingkungan: string): KepalaKeluarga[] {
  const cleanName = (namaLingkungan || '').replace(/^lingkungan\s+/i, '').trim() || 'Lingkungan'
  const normalizedKey = cleanName.toLowerCase().trim()
  const slugKey = normalizedKey.replace(/[^a-z0-9]/g, '-')
  
  // Hash function based strictly on normalized Lingkungan name for 100% consistency across all pages
  let hash = 0
  for (let i = 0; i < normalizedKey.length; i++) {
    hash = (hash << 5) - hash + normalizedKey.charCodeAt(i)
    hash |= 0
  }
  const absHash = Math.abs(hash)

  const result: KepalaKeluarga[] = []
  
  for (let i = 0; i < 5; i++) {
    const fnIdx = (absHash + i * 3) % CATHOLIC_FIRST_NAMES.length
    const lnIdx = (absHash + i * 7 + 2) % LAST_NAMES.length
    const namaKK = `${CATHOLIC_FIRST_NAMES[fnIdx]} ${LAST_NAMES[lnIdx]}`
    
    // 4 out of 5 are BIDUK registered by default
    const isBiduk = i !== 4
    
    result.push({
      id: `dummy-kk-${slugKey}-${i + 1}`,
      lingkungan_id: lingkunganId,
      nama_kk: namaKK,
      alamat: `Jl. ${cleanName} No. ${(i + 1) * 3 + (absHash % 5)}`,
      is_biduk: isBiduk
    })
  }

  return result
}

export function ensureDummyKksForLingkungan(lingkunganId: string, namaLingkungan: string, existingList: KepalaKeluarga[]): KepalaKeluarga[] {
  if (existingList && existingList.length >= 5) {
    return existingList
  }

  const dummyList = getDummyKkListForLingkungan(lingkunganId, namaLingkungan)
  
  // Merge existing custom entries with dummy list
  const combinedMap = new Map<string, KepalaKeluarga>()
  dummyList.forEach(k => combinedMap.set(k.id, k))
  if (existingList) {
    existingList.forEach(k => combinedMap.set(k.id, k))
  }
  
  return Array.from(combinedMap.values()).sort((a, b) => a.nama_kk.localeCompare(b.nama_kk))
}
