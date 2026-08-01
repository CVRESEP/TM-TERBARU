// Standard Master Data for Tani Makmur Baru (Magetan & Sragen Branches)

// =============================================
// USER ACCOUNTS & ROLE-BASED ACCESS CONTROL
// =============================================
// role: 'owner'   → akses semua cabang, semua menu, termasuk Pengaturan
// role: 'manajer' → akses semua cabang, semua menu, KECUALI Pengaturan
// role: 'admin'   → akses hanya cabang sendiri (branch terkunci), KECUALI Pengaturan
export const DEFAULT_USERS = [
  // Developer System - Akses penuh tingkat pengembang
  { id: 'USR-00', username: 'developer', password: 'dev123', name: 'System Developer', role: 'developer', branch: 'ALL' },

  // Owner - akses penuh semua cabang
  { id: 'USR-01', username: 'owner', password: 'owner123', name: 'Pemilik Usaha', role: 'owner', branch: 'ALL' },

  // Manajer - akses semua cabang tapi tidak bisa ke Pengaturan
  { id: 'USR-02', username: 'manajer', password: 'manajer123', name: 'Bpk. Manajer Utama', role: 'manajer', branch: 'ALL' },

  // Admin Cabang Magetan - hanya bisa akses data Cabang Magetan
  { id: 'USR-03', username: 'admin_magetan', password: 'magetan123', name: 'Admin Cabang Magetan', role: 'admin', branch: 'Magetan' },

  // Admin Cabang Sragen - hanya bisa akses data Cabang Sragen
  { id: 'USR-04', username: 'admin_sragen', password: 'sragen123', name: 'Admin Cabang Sragen', role: 'admin', branch: 'Sragen' },
];

export const DEFAULT_SETTINGS = {
  companyName: 'UD TANI MAKMUR BARU',
  appSubtitle: 'Sistem Informasi Distribusi Pupuk Bersubsidi',
  branch1Name: 'Magetan',
  branch2Name: 'Sragen',
  
  stage1Name: '1. Penebusan',
  stage2Name: '2. Pengeluaran DO',
  stage3Name: '3. Penyaluran Kios',
  
  // Table Headers - Stage 1 (Penebusan)
  thPenebusanBranch: 'Cabang',
  thPenebusanSpjb: 'No. SPJB / Faktur',
  thPenebusanDate: 'Tanggal',
  thPenebusanSupplier: 'Supplier',
  thPenebusanFertilizer: 'Jenis Pupuk',
  thPenebusanQty: 'Total Penebusan (Ton)',
  thPenebusanTaken: 'Sudah Di-DO (Ton)',
  thPenebusanRemaining: 'Sisa Kuota (Ton)',
  thPenebusanAmount: 'Total Biaya',
  thPenebusanStatus: 'Status',
  thPenebusanAction: 'Aksi',

  // Table Headers - Stage 2 (Pengeluaran DO)
  thDoBranch: 'Cabang',
  thDoNo: 'No. DO Gudang',
  thDoDate: 'Tanggal',
  thDoSpjbRef: 'Ref SPJB Penebusan',
  thDoFertilizer: 'Jenis Pupuk',
  thDoQty: 'Qty Diambil (Ton)',
  thDoDriver: 'Supir & Truk',
  thDoWarehouse: 'Gudang Tujuan',
  thDoStatus: 'Status',
  thDoAction: 'Aksi',

  // Table Headers - Stage 3 (Penyaluran Kios)
  thSalurBranch: 'Cabang',
  thSalurSjNo: 'No. Surat Jalan',
  thSalurDate: 'Tanggal',
  thSalurKios: 'Kios Tujuan',
  thSalurFertilizer: 'Jenis Pupuk',
  thSalurQty: 'Qty Tersalur (Ton)',
  thSalurPrice: 'Harga / Ton',
  thSalurAmount: 'Total Tagihan',
  thSalurPayment: 'Pembayaran',
  thSalurDelivery: 'Pengiriman',
  thSalurAction: 'Aksi'
};

export const DEFAULT_FERTILIZERS = [
  { id: 'UREA', name: 'Urea Bersubsidi', unit: 'Ton', defaultPriceTon: 2250000 },
  { id: 'PHONSKA', name: 'NPK Phonska', unit: 'Ton', defaultPriceTon: 2300000 },
  { id: 'PETROGANIK', name: 'Organik Petroganik', unit: 'Ton', defaultPriceTon: 800000 },
  { id: 'ZA', name: 'ZA Bersubsidi', unit: 'Ton', defaultPriceTon: 1700000 },
];

export const DEFAULT_BRANCHES = [
  { id: 'Magetan', name: 'Cabang Magetan', warehouse: 'Gudang Utama Magetan' },
  { id: 'Sragen', name: 'Cabang Sragen', warehouse: 'Gudang Utama Sragen' },
];

export const DEFAULT_SUPPLIERS = [
  { id: 'SUP-01', name: 'PT Pupuk Indonesia (Persero)', contact: '0812-3456-7890', address: 'Gudang Lini III Regional' },
  { id: 'SUP-02', name: 'PT Petrokimia Gresik', contact: '0813-9876-5432', address: 'Depo Regional Jawa Tengah' },
];

export const DEFAULT_DRIVERS = [
  { id: 'DRV-01', name: 'Pak Budi', vehiclePlate: 'AE 8899 MGT', phone: '0812-1111-2222', branch: 'Magetan' },
  { id: 'DRV-02', name: 'Pak Sujono', vehiclePlate: 'AE 8492 MGT', phone: '0812-3333-4444', branch: 'Magetan' },
  { id: 'DRV-03', name: 'Pak Joko', vehiclePlate: 'AD 9012 SRG', phone: '0813-5555-6666', branch: 'Sragen' },
];

import firestoreBackup from './firestoreBackup.json';
import { normalizeAllData } from '../utils/dataNormalizer';

const normalizedBackup = normalizeAllData(firestoreBackup || {});

export const DEFAULT_PENEBUSAN = (normalizedBackup.penebusanList && normalizedBackup.penebusanList.length > 0) ? normalizedBackup.penebusanList : [];
export const DEFAULT_DO_EXPENSES = (normalizedBackup.doList && normalizedBackup.doList.length > 0) ? normalizedBackup.doList : [];
export const DEFAULT_PENYALURAN_KIOS = (normalizedBackup.penyaluranList && normalizedBackup.penyaluranList.length > 0) ? normalizedBackup.penyaluranList : [];
export const DEFAULT_PAYMENTS = (normalizedBackup.payments && normalizedBackup.payments.length > 0) ? normalizedBackup.payments : [];
export const DEFAULT_KAS_ANGKUTAN = (normalizedBackup.kasAngkutanList && normalizedBackup.kasAngkutanList.length > 0) ? normalizedBackup.kasAngkutanList : [];
export const DEFAULT_KAS_UMUM = (normalizedBackup.kasUmumList && normalizedBackup.kasUmumList.length > 0) ? normalizedBackup.kasUmumList : [];
export const DEFAULT_KIOSKS = (normalizedBackup.kiosks && normalizedBackup.kiosks.length > 0) ? normalizedBackup.kiosks : [
  { id: 'KS-MGT-01', name: 'Kios Tani Subur', owner: 'Sugeng', branch: 'Magetan', address: 'Maospati, Magetan', phone: '0852-1111-2222', code: 'Kios-352001' },
  { id: 'KS-MGT-02', name: 'Kios Makmur Jaya', owner: 'Slamet', branch: 'Magetan', address: 'Sukomoro, Magetan', phone: '0852-3333-4444', code: 'Kios-352002' },
  { id: 'KS-SRG-01', name: 'Kios Tani Mandiri', owner: 'Bambang', branch: 'Sragen', address: 'Sidoharjo, Sragen', phone: '0813-7777-8888', code: 'Kios-331401' },
  { id: 'KS-SRG-02', name: 'Kios Gemah Ripah', owner: 'Joko', branch: 'Sragen', address: 'Masaran, Sragen', phone: '0813-9999-0000', code: 'Kios-331402' },
];

