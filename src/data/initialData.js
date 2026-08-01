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

export const DEFAULT_KIOSKS = [
  { id: 'KS-MGT-01', name: 'Kios Tani Subur', owner: 'Sugeng', branch: 'Magetan', address: 'Maospati, Magetan', phone: '0852-1111-2222', code: 'Kios-352001' },
  { id: 'KS-MGT-02', name: 'Kios Makmur Jaya', owner: 'Slamet', branch: 'Magetan', address: 'Sukomoro, Magetan', phone: '0852-3333-4444', code: 'Kios-352002' },
  { id: 'KS-SRG-01', name: 'Kios Tani Mandiri', owner: 'Bambang', branch: 'Sragen', address: 'Sidoharjo, Sragen', phone: '0813-7777-8888', code: 'Kios-331401' },
  { id: 'KS-SRG-02', name: 'Kios Gemah Ripah', owner: 'Joko', branch: 'Sragen', address: 'Masaran, Sragen', phone: '0813-9999-0000', code: 'Kios-331402' },
];

export const DEFAULT_PENEBUSAN = [
  { id: 'DO-MGT-001', doNo: 'DO-MGT-001', spjbNo: 'SPJB-MGT-001', date: '2026-07-01', supplierId: 'PT PETROKIMIA GRESIK', supplierName: 'PT PETROKIMIA GRESIK', fertilizerId: 'UREA', fertilizerName: 'Urea Bersubsidi', qty: 50.0, qtyTon: 50.0, pricePerTon: 2250000, totalAmount: 112500000, status: 'Selesai', branch: 'Magetan', notes: 'Penebusan Alokasi Juli Magetan' },
  { id: 'DO-MGT-002', doNo: 'DO-MGT-002', spjbNo: 'SPJB-MGT-002', date: '2026-07-10', supplierId: 'PT PETROKIMIA GRESIK', supplierName: 'PT PETROKIMIA GRESIK', fertilizerId: 'PHONSKA', fertilizerName: 'NPK Phonska', qty: 40.0, qtyTon: 40.0, pricePerTon: 2300000, totalAmount: 92000000, status: 'Selesai', branch: 'Magetan', notes: 'Penebusan Phonska Magetan' },
  { id: 'DO-SRG-001', doNo: 'DO-SRG-001', spjbNo: 'SPJB-SRG-001', date: '2026-07-05', supplierId: 'PT Pupuk Indonesia (Persero)', supplierName: 'PT Pupuk Indonesia (Persero)', fertilizerId: 'UREA', fertilizerName: 'Urea Bersubsidi', qty: 60.0, qtyTon: 60.0, pricePerTon: 2250000, totalAmount: 135000000, status: 'Selesai', branch: 'Sragen', notes: 'Penebusan Alokasi Juli Sragen' },
  { id: 'DO-SRG-002', doNo: 'DO-SRG-002', spjbNo: 'SPJB-SRG-002', date: '2026-07-15', supplierId: 'PT Pupuk Indonesia (Persero)', supplierName: 'PT Pupuk Indonesia (Persero)', fertilizerId: 'ZA', fertilizerName: 'ZA Bersubsidi', qty: 30.0, qtyTon: 30.0, pricePerTon: 1700000, totalAmount: 51000000, status: 'Selesai', branch: 'Sragen', notes: 'Penebusan ZA Sragen' }
];

export const DEFAULT_DO_EXPENSES = [
  { id: 'DO-MGT-001', doNo: 'DO-MGT-001', penebusanId: 'DO-MGT-001', date: '2026-07-02', fertilizerName: 'Urea Bersubsidi', qty: 30.0, qtyTon: 30.0, driverName: 'Pak Budi', vehiclePlate: 'AE 8899 MGT', truckNumber: 'AE 8899 MGT', targetWarehouse: 'Gudang Utama Magetan', branch: 'Magetan', notes: 'Pengeluaran DO Gudang Magetan' },
  { id: 'DO-MGT-002', doNo: 'DO-MGT-002', penebusanId: 'DO-MGT-002', date: '2026-07-11', fertilizerName: 'NPK Phonska', qty: 25.0, qtyTon: 25.0, driverName: 'Pak Sujono', vehiclePlate: 'AE 8492 MGT', truckNumber: 'AE 8492 MGT', targetWarehouse: 'Gudang Utama Magetan', branch: 'Magetan', notes: 'Pengeluaran DO Gudang Phonska' },
  { id: 'DO-SRG-001', doNo: 'DO-SRG-001', penebusanId: 'DO-SRG-001', date: '2026-07-06', fertilizerName: 'Urea Bersubsidi', qty: 40.0, qtyTon: 40.0, driverName: 'Pak Joko', vehiclePlate: 'AD 9012 SRG', truckNumber: 'AD 9012 SRG', targetWarehouse: 'Gudang Utama Sragen', branch: 'Sragen', notes: 'Pengeluaran DO Gudang Sragen' }
];

export const DEFAULT_PENYALURAN_KIOS = [
  { id: 'DO-MGT-001-01', sjNo: 'DO-MGT-001-01', penyaluranNo: 'DO-MGT-001-01', nomorPenyaluran: 'DO-MGT-001-01', doRefId: 'DO-MGT-001', doNo: 'DO-MGT-001', date: '2026-07-03', kiosId: 'Kios Tani Subur', kiosName: 'Kios Tani Subur', fertilizerName: 'Urea Bersubsidi', qty: 10.0, qtyTon: 10.0, pricePerTon: 2500000, totalAmount: 25000000, paidAmount: 25000000, remainingAmount: 0, paymentStatus: 'Lunas', driverName: 'Pak Budi', branch: 'Magetan', notes: 'Penyaluran Lunas' },
  { id: 'DO-MGT-001-02', sjNo: 'DO-MGT-001-02', penyaluranNo: 'DO-MGT-001-02', nomorPenyaluran: 'DO-MGT-001-02', doRefId: 'DO-MGT-001', doNo: 'DO-MGT-001', date: '2026-07-04', kiosId: 'Kios Makmur Jaya', kiosName: 'Kios Makmur Jaya', fertilizerName: 'Urea Bersubsidi', qty: 15.0, qtyTon: 15.0, pricePerTon: 2500000, totalAmount: 37500000, paidAmount: 20000000, remainingAmount: 17500000, paymentStatus: 'Tempo', driverName: 'Pak Sujono', branch: 'Magetan', notes: 'Penyaluran Tempo Partial' },
  { id: 'DO-SRG-001-01', sjNo: 'DO-SRG-001-01', penyaluranNo: 'DO-SRG-001-01', nomorPenyaluran: 'DO-SRG-001-01', doRefId: 'DO-SRG-001', doNo: 'DO-SRG-001', date: '2026-07-07', kiosId: 'Kios Tani Mandiri', kiosName: 'Kios Tani Mandiri', fertilizerName: 'Urea Bersubsidi', qty: 20.0, qtyTon: 20.0, pricePerTon: 2500000, totalAmount: 50000000, paidAmount: 50000000, remainingAmount: 0, paymentStatus: 'Lunas', driverName: 'Pak Joko', branch: 'Sragen', notes: 'Penyaluran Lunas Sragen' }
];

export const DEFAULT_PAYMENTS = [
  { id: 'PAY-001', penyaluranId: 'DO-MGT-001-01', doRefId: 'DO-MGT-001', doNo: 'DO-MGT-001', kiosName: 'Kios Tani Subur', date: '2026-07-03', amount: 25000000, paymentMethod: 'Transfer Bank', branch: 'Magetan', notes: 'Pelunasan Transaksi DO-MGT-001-01' },
  { id: 'PAY-002', penyaluranId: 'DO-MGT-001-02', doRefId: 'DO-MGT-001', doNo: 'DO-MGT-001', kiosName: 'Kios Makmur Jaya', date: '2026-07-04', amount: 20000000, paymentMethod: 'Tunai', branch: 'Magetan', notes: 'Pembayaran DP DO-MGT-001-02' },
  { id: 'PAY-003', penyaluranId: 'DO-SRG-001-01', doRefId: 'DO-SRG-001', doNo: 'DO-SRG-001', kiosName: 'Kios Tani Mandiri', date: '2026-07-07', amount: 50000000, paymentMethod: 'Transfer Bank', branch: 'Sragen', notes: 'Pelunasan Transaksi DO-SRG-001-01' }
];

export const DEFAULT_KAS_ANGKUTAN = [
  { id: 'KA-001', branch: 'Magetan', kabupaten: 'MAGETAN', date: '2026-07-03', doNo: 'DO-MGT-001', penyaluranNo: 'DO-MGT-001-01', kiosName: 'Kios Tani Subur', driverName: 'Pak Budi', transactionType: 'PENGELUARAN', description: 'BIAYA ANGKUTAN - DO-MGT-001-01 - UREA BERSUBSIDI - KIOS TANI SUBUR - 10 TON', amount: 136666, adminFee: 20000, admin: 20000, mealFee: 40000, uangMakan: 40000, palangFee: 0, palang: 0, solarFee: 41666, solar: 41666, driverWage: 35000, upahSopir: 35000, overtimeFee: 0, lembur: 0, helperFee: 0, helper: 0, otherFee: 0, lainLain: 0 },
  { id: 'KA-002', branch: 'Sragen', kabupaten: 'SRAGEN', date: '2026-07-07', doNo: 'DO-SRG-001', penyaluranNo: 'DO-SRG-001-01', kiosName: 'Kios Tani Mandiri', driverName: 'Pak Joko', transactionType: 'PENGELUARAN', description: 'BIAYA ANGKUTAN - DO-SRG-001-01 - UREA BERSUBSIDI - KIOS TANI MANDIRI - 20 TON', amount: 250000, adminFee: 40000, admin: 40000, mealFee: 40000, uangMakan: 40000, palangFee: 0, palang: 0, solarFee: 100000, solar: 100000, driverWage: 70000, upahSopir: 70000, overtimeFee: 0, lembur: 0, helperFee: 0, helper: 0, otherFee: 0, lainLain: 0 }
];

import kasUmumData from './kasUmumExcelData.json';

export const DEFAULT_KAS_UMUM = kasUmumData || [];

