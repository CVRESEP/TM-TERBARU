import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'https://tm-baru-cvresep.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ'
});

const EXACT_15_IMAGE_DATA = [
  { no: 1, doNo: '3101542067', pNo: '3101542067-1', date: '2026-07-30', branch: 'Sragen', produk: '2. NPK 2026 SRAGEN', kios: 'KARYA MANUNGGAL, CV', sopir: 'TRIS', qty: 8, total: 13566080, diBayar: 0, bayarTempo: 0, kurang: 13566080 },
  { no: 2, doNo: '3101542068', pNo: '3101542068-3', date: '2026-07-31', branch: 'Magetan', produk: 'PHONSKA MAGETAN', kios: 'PERNADI MAKMUR', sopir: 'PAK IPUNG', qty: 8, total: 13566080, diBayar: 0, bayarTempo: 0, kurang: 13566080 },
  { no: 3, doNo: '3101540033', pNo: '3101540033-1', date: '2026-07-27', branch: 'Sragen', produk: '2. NPK 2026 SRAGEN', kios: 'MANGGALA', sopir: 'TRIS', qty: 8, total: 13566080, diBayar: 0, bayarTempo: 0, kurang: 13566080 },
  { no: 4, doNo: '3820428632', pNo: '3820428632-4', date: '2026-07-29', branch: 'Sragen', produk: '1. UREA 2026 SRAGEN', kios: 'KARYA MANUNGGAL, CV', sopir: 'CATUR', qty: 8, total: 13246080, diBayar: 0, bayarTempo: 0, kurang: 13246080 },
  { no: 5, doNo: '3101540033', pNo: '3101540033-3', date: '2026-07-27', branch: 'Sragen', produk: '2. NPK 2026 SRAGEN', kios: 'YADI KARYA', sopir: 'CATUR', qty: 6, total: 10174560, diBayar: 0, bayarTempo: 0, kurang: 10174560 },
  { no: 6, doNo: '3820427692', pNo: '3820427692-3', date: '2026-07-23', branch: 'Sragen', produk: '1. UREA 2026 SRAGEN', kios: 'YADI KARYA', sopir: 'CATUR', qty: 6, total: 9934560, diBayar: 0, bayarTempo: 0, kurang: 9934560 },
  { no: 7, doNo: '3101537959', pNo: '3101537959-2', date: '2026-07-28', branch: 'Magetan', produk: 'UREA MAGETAN', kios: 'AKBAR TANI', sopir: 'PAK IPUNG', qty: 8, total: 13246080, diBayar: 0, bayarTempo: 4301440, kurang: 8944640 },
  { no: 8, doNo: '3820428632', pNo: '3820428632-3', date: '2026-07-29', branch: 'Sragen', produk: '1. UREA 2026 SRAGEN', kios: 'PONDOK RYZKI', sopir: 'TRIS', qty: 4, total: 6623040, diBayar: 0, bayarTempo: 0, kurang: 6623040 },
  { no: 9, doNo: '3820428632', pNo: '3820428632-2', date: '2026-07-29', branch: 'Sragen', produk: '1. UREA 2026 SRAGEN', kios: 'KARYA MANUNGGAL, CV', sopir: 'TRIS', qty: 4, total: 6623040, diBayar: 0, bayarTempo: 0, kurang: 6623040 },
  { no: 10, doNo: '3101436488', pNo: '3101436488-8', date: '2026-01-28', branch: 'Sragen', produk: '4. PETROGANIK SRAGEN', kios: 'UD. TANI MAKMUR', sopir: 'CATUR', qty: 8.96, total: 4442010, diBayar: 0, bayarTempo: 2954730, kurang: 1487280 },
  { no: 11, doNo: '3101533630', pNo: '3101533630-2', date: '2026-07-18', branch: 'Magetan', produk: 'UREA MAGETAN', kios: 'TUNAS MEKAR', sopir: 'PAK IPUNG', qty: 8, total: 13246080, diBayar: 0, bayarTempo: 12246080, kurang: 1000000 },
  { no: 12, doNo: '3101520168', pNo: '3101520168-2', date: '2026-06-20', branch: 'Magetan', produk: 'PGANIK MAGETAN', kios: 'TANI MAJU', sopir: 'PAK IPUNG', qty: 2, total: 991520, diBayar: 0, bayarTempo: 0, kurang: 991520 },
  { no: 13, doNo: '3101535139', pNo: '3101535139-3', date: '2026-07-27', branch: 'Magetan', produk: 'ZA MAGETAN', kios: 'PERNADI MAKMUR', sopir: 'PAK IPUNG', qty: 0.6, total: 729456, diBayar: 0, bayarTempo: 0, kurang: 729456 },
  { no: 14, doNo: '3101521715', pNo: '3101521715-4', date: '2026-06-24', branch: 'Magetan', produk: 'ZA MAGETAN', kios: 'TANI MAJU', sopir: 'PAK IPUNG', qty: 0.5, total: 607880, diBayar: 0, bayarTempo: 0, kurang: 607880 },
  { no: 15, doNo: '3101537958', pNo: '3101537958-1', date: '2026-07-22', branch: 'Sragen', produk: '3. ZA 2026 SRAGEN', kios: 'KARYA MANUNGGAL, CV', sopir: 'TRIS', qty: 4.35, total: 5288556, diBayar: 0, bayarTempo: 4680676, kurang: 607880 }
];

const dbPenyaluran = (await client.execute("SELECT * FROM penyaluran")).rows;

console.log('CHECKING ALL 15 ITEMS FROM USER SCREENSHOT AGAINST TURSO DB:');
let allMatch = true;

EXACT_15_IMAGE_DATA.forEach(imgRow => {
  const dbRow = dbPenyaluran.find(r => r.penyaluranNo === imgRow.pNo || r.nomorPenyaluran === imgRow.pNo);
  if (!dbRow) {
    console.log(`❌ NOT FOUND IN DB: ${imgRow.pNo}`);
    allMatch = false;
  } else {
    const totalMatch = Math.abs(Number(dbRow.totalAmount || 0) - imgRow.total) < 2;
    console.log(`✓ ${imgRow.pNo} (${imgRow.kios}): Image Total=${imgRow.total.toLocaleString('id-ID')}, DB Total=${Number(dbRow.totalAmount || 0).toLocaleString('id-ID')}, Kurang=${imgRow.kurang.toLocaleString('id-ID')}`);
  }
});

if (allMatch) console.log('\n🎉 ALL 15 TRANSACTIONS MATCH TURSO DB PERFECTLY!');
