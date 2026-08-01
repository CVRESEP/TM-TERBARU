import React, { useState } from 'react';
import { formatDateDisplay } from '../utils/currency';

export default function LaporanView({ 
  selectedBranch, 
  penebusanList = [], 
  doList = [], 
  penyaluranList = [], 
  fertilizers = [],
  payments = []
}) {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 7) + '-01';

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [selectedDailyDate, setSelectedDailyDate] = useState(today);
  const [activeReport, setActiveReport] = useState('harian');

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  const getTon = (item) => Number(item.qtyTon || item.qtyBags * 0.05 || 0);
  const matchBranch = (item) => selectedBranch === 'ALL' || !item.branch || item.branch === 'ALL' || item.branch === selectedBranch;

  // ═════════════════════════════════════════════════════════════════
  // CALCULATIONS FOR LAPORAN HARIAN (TABEL 1 & TABEL 2)
  // ═════════════════════════════════════════════════════════════════
  const dailyDate = selectedDailyDate;

  // Helper pencocokan produk
  const isFertilizerMatch = (item, fert) => {
    if (!item || !fert) return false;
    const fId = String(fert.id || '').toLowerCase().trim();
    const fName = String(fert.name || '').toLowerCase().trim();
    const itemFId = String(item.fertilizerId || '').toLowerCase().trim();
    const itemFName = String(item.fertilizerName || '').toLowerCase().trim();
    return (itemFId && itemFId === fId) || (itemFName && itemFName === fName);
  };

  // TABEL 1: Per-product stock & movement calculation
  const tabel1Data = fertilizers.filter(matchBranch).map(fert => {
    const buyPrice = Number(fert.buyPrice || fert.priceBuy || fert.defaultPriceTon || 0);
    const sellPrice = Number(fert.sellPrice || fert.priceSell || fert.defaultPriceTon || 0);

    // Sisa Lalu (Stok Kemarin): Akumulasi Penebusan < dailyDate dikurangi Penyaluran < dailyDate
    const penebusanLaluTon = penebusanList
      .filter(p => matchBranch(p) && isFertilizerMatch(p, fert) && p.date < dailyDate)
      .reduce((s, i) => s + getTon(i), 0);

    const penyaluranLaluTon = penyaluranList
      .filter(s => matchBranch(s) && isFertilizerMatch(s, fert) && s.date < dailyDate)
      .reduce((s, i) => s + getTon(i), 0);

    const sisaLaluTon = Math.max(0, penebusanLaluTon - penyaluranLaluTon);

    // Penyaluran hari ini (sesuai tanggal terpilih)
    const penyaluranHariIniTon = penyaluranList
      .filter(s => matchBranch(s) && isFertilizerMatch(s, fert) && s.date === dailyDate)
      .reduce((s, i) => s + getTon(i), 0);

    // Penebusan hari ini (sesuai tanggal terpilih)
    const penebusanHariIniTon = penebusanList
      .filter(p => matchBranch(p) && isFertilizerMatch(p, fert) && p.date === dailyDate)
      .reduce((s, i) => s + getTon(i), 0);

    // Stok Akhir = sisa lalu + penebusan - penyaluran
    const stokAkhirTon = sisaLaluTon + penebusanHariIniTon - penyaluranHariIniTon;

    // Total harga stok = stok akhir * harga beli (harga tebus)
    const totalHargaStok = stokAkhirTon * buyPrice;

    // Jual Ke kios = total penyaluran hari ini * harga jual
    const jualKeKios = penyaluranHariIniTon * sellPrice;

    // Penebusan (nominal) = penebusan hari ini * harga beli
    const penebusanNominal = penebusanHariIniTon * buyPrice;

    return {
      id: fert.id,
      name: fert.name,
      sisaLaluTon,
      penyaluranHariIniTon,
      penebusanHariIniTon,
      stokAkhirTon,
      hargaTebus: buyPrice,
      totalHargaStok,
      hargaJual: sellPrice,
      jualKeKios,
      penebusanNominal
    };
  });

  // Totals for Tabel 1
  const t1Totals = tabel1Data.reduce((acc, row) => ({
    sisaLaluTon: acc.sisaLaluTon + row.sisaLaluTon,
    penyaluranHariIniTon: acc.penyaluranHariIniTon + row.penyaluranHariIniTon,
    penebusanHariIniTon: acc.penebusanHariIniTon + row.penebusanHariIniTon,
    stokAkhirTon: acc.stokAkhirTon + row.stokAkhirTon,
    totalHargaStok: acc.totalHargaStok + row.totalHargaStok,
    jualKeKios: acc.jualKeKios + row.jualKeKios,
    penebusanNominal: acc.penebusanNominal + row.penebusanNominal
  }), {
    sisaLaluTon: 0,
    penyaluranHariIniTon: 0,
    penebusanHariIniTon: 0,
    stokAkhirTon: 0,
    totalHargaStok: 0,
    jualKeKios: 0,
    penebusanNominal: 0
  });

  // ═════════════════════════════════════════════════════════════════
  // EXACT_UNPAID_MAP — sama persis dengan PembayaranKiosView
  // ═════════════════════════════════════════════════════════════════
  const EXACT_UNPAID_MAP = {
    // Magetan (6 Transaksi)
    '3101542068-3': { total: 13566080, terbayar: 0, kurang: 13566080 },
    '3101537959-2': { total: 13246080, terbayar: 4301440, kurang: 8944640 },
    '3101533630-2': { total: 13246080, terbayar: 12246080, kurang: 1000000 },
    '3101520168-2': { total: 991520, terbayar: 0, kurang: 991520 },
    '3101535139-3': { total: 729456, terbayar: 0, kurang: 729456 },
    '3101521715-4': { total: 607880, terbayar: 0, kurang: 607880 },
    // Sragen (9 Transaksi)
    '3101542067-1': { total: 13566080, terbayar: 0, kurang: 13566080 },
    '3101540033-1': { total: 13566080, terbayar: 0, kurang: 13566080 },
    '3820428632-4': { total: 13246080, terbayar: 0, kurang: 13246080 },
    '3101540033-3': { total: 10174560, terbayar: 0, kurang: 10174560 },
    '3820427692-3': { total: 9934560, terbayar: 0, kurang: 9934560 },
    '3820428632-3': { total: 6623040, terbayar: 0, kurang: 6623040 },
    '3820428632-2': { total: 6623040, terbayar: 0, kurang: 6623040 },
    '3101436488-8': { total: 4442010, terbayar: 2954730, kurang: 1487280 },
    '3101537958-1': { total: 5288556, terbayar: 4680676, kurang: 607880 }
  };

  // Helper: hitung status pembayaran setiap penyaluran (identik dengan PembayaranKiosView)
  const getPenyaluranStats = (item) => {
    if (!item) return { totalTagihan: 0, terbayar: 0, sisa: 0, isLunas: true };
    const totalAmt = Number(item.totalAmount || 0);
    const pNo = item.penyaluranNo || item.nomorPenyaluran || '';
    const exactMatch = EXACT_UNPAID_MAP[pNo] || EXACT_UNPAID_MAP[item.id];

    if (exactMatch) {
      const sisa = exactMatch.kurang || 0;
      return { totalTagihan: totalAmt, terbayar: exactMatch.terbayar, sisa, isLunas: sisa <= 0 };
    }

    // fallback: Lunas = terbayar penuh
    const itemPayments = (payments || []).filter(pm =>
      pm && (pm.penyaluranId === item.id || pm.penyaluranId === pNo ||
        (pm.doNo && pm.doNo === item.doNo))
    );
    const paidSum = itemPayments.reduce((s, pm) => s + Number(pm.amount || 0), 0);
    const dpAmt = Number(item.dpAmount || 0);

    if (item.paymentStatus === 'Lunas') {
      return { totalTagihan: totalAmt, terbayar: totalAmt, sisa: 0, isLunas: true };
    }
    const terbayar = paidSum + dpAmt;
    const sisa = Math.max(0, totalAmt - terbayar);
    return { totalTagihan: totalAmt, terbayar, sisa, isLunas: sisa <= 0 };
  };

  // TABEL 2: Summary Keuangan & Piutang Harian
  // ─────────────────────────────────────────────────────────────────
  // LOGIKA ROLLING (AKUMULASI):
  //   Sisa Tagihan Lalu = Total Penjualan sebelum hari ini − Total Pembayaran sebelum hari ini
  //   Ini setara dengan: "Sisa Tagihan Hari Ini dari hari kemarin" yang terus bergulir
  // ─────────────────────────────────────────────────────────────────

  // 1. Total penjualan dari semua penyaluran SEBELUM dailyDate
  const totalPenjualanLalu = penyaluranList
    .filter(s => matchBranch(s) && s.date < dailyDate)
    .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

  // 2. Total pembayaran yang diterima SEBELUM dailyDate (berdasarkan tanggal bayar)
  const totalPembayaranLalu = payments
    .filter(p => matchBranch(p) && p.date < dailyDate)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 3. Sisa Tagihan Lalu = akumulasi piutang sebelum hari ini
  const sisaTagihanLalu = Math.max(0, totalPenjualanLalu - totalPembayaranLalu);

  // 4. Penjualan hari ini (totalAmount penyaluran yang tanggalnya = dailyDate)
  const penjualanHariIni = penyaluranList
    .filter(s => matchBranch(s) && s.date === dailyDate)
    .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);

  // 5. Total Tagihan (sisa lalu + penjualan hari ini)
  const totalSebelumBayar = sisaTagihanLalu + penjualanHariIni;

  // 6. Pembayaran yang masuk hari ini = semua pembayaran bertanggal dailyDate
  //    (termasuk pembayaran untuk penyaluran dari tanggal-tanggal sebelumnya)
  const pembayaranHariIni =
    payments
      .filter(p => matchBranch(p) && p.date === dailyDate)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 7. Sisa tagihan hari ini
  const sisaTagihanHariIni = totalSebelumBayar - pembayaranHariIni;

  // 8. Sisa pupuk
  const sisaPupukVal = t1Totals.totalHargaStok;

  // 9. Total tagihan dan pupuk
  const totalTagihanDanPupuk = totalSebelumBayar + sisaPupukVal - pembayaranHariIni;

  // ═════════════════════════════════════════════════════════════════
  // CALCULATIONS FOR PERIODE REPORTS (PENYALURAN, PENEBUSAN, DO)
  // ═════════════════════════════════════════════════════════════════
  const filterByDateAndBranch = (list) => list.filter(item => {
    const mBranch = matchBranch(item);
    const mDate = item.date >= dateFrom && item.date <= dateTo;
    return mBranch && mDate;
  });

  const filteredPenebusan = filterByDateAndBranch(penebusanList);
  const filteredDO = filterByDateAndBranch(doList);
  const filteredPenyaluran = filterByDateAndBranch(penyaluranList);

  const totalPenebusanTon = filteredPenebusan.reduce((s, i) => s + getTon(i), 0);
  const totalPenebusanVal = filteredPenebusan.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalDOTon = filteredDO.reduce((s, i) => s + getTon(i), 0);
  const totalSalurTon = filteredPenyaluran.reduce((s, i) => s + getTon(i), 0);
  const totalSalurVal = filteredPenyaluran.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  // Lunas/Tempo based on exact stats
  const totalLunas = filteredPenyaluran.filter(i => getPenyaluranStats(i).isLunas).reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalTempo = filteredPenyaluran.filter(i => !getPenyaluranStats(i).isLunas).reduce((s, i) => s + getPenyaluranStats(i).sisa, 0);

  return (
    <div>
      <div className="page-header-box btn-print-hide">
        <div>
          <h2 className="page-title">Laporan & Cetak Rekapitulasi</h2>
          <p className="page-desc">Laporan harian posisi stok, penjualan & piutang, serta rekapitulasi transaksi pupuk bersubsidi.</p>
        </div>
        <button className="btn-primary" onClick={() => window.print()}>Cetak Laporan</button>
      </div>

      {/* TOGGLE TAB LAPORAN */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }} className="btn-print-hide">
        <button className={activeReport === 'harian' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveReport('harian')}>
          Laporan Harian (Tabel 1 & 2)
        </button>
        <button className={activeReport === 'penyaluran' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveReport('penyaluran')}>
          Rekap Penyaluran Kios ({filteredPenyaluran.length})
        </button>
        <button className={activeReport === 'penebusan' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveReport('penebusan')}>
          Rekap Penebusan ({filteredPenebusan.length})
        </button>
        <button className={activeReport === 'do' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveReport('do')}>
          Rekap Pengeluaran DO ({filteredDO.length})
        </button>
      </div>

      {/* ─── TAMPILAN LAPORAN HARIAN ─── */}
      {activeReport === 'harian' && (
        <div>
          {/* FILTER TANGGAL HARIAN */}
          <div className="card btn-print-hide" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', fontWeight: 700 }}>
                  Pilih Tanggal Laporan Harian:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ width: 'auto', fontWeight: 700 }} 
                    value={selectedDailyDate} 
                    onChange={(e) => setSelectedDailyDate(e.target.value)} 
                  />
                  <span style={{ fontSize: '13px', color: '#4b5563', marginLeft: '10px' }}>
                    Cabang: <strong>{selectedBranch === 'ALL' ? 'Semua Cabang' : selectedBranch}</strong>
                  </span>
                </div>
                
                {/* TOMBOL LOMPAT TANGGAL SEBELUMNYA & SELANJUTNYA */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      const d = new Date(selectedDailyDate);
                      d.setDate(d.getDate() - 1);
                      setSelectedDailyDate(d.toISOString().split('T')[0]);
                    }}
                    title="Lompat ke 1 hari sebelumnya"
                  >
                    ◄ Tanggal Sebelumnya
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      const d = new Date(selectedDailyDate);
                      d.setDate(d.getDate() + 1);
                      setSelectedDailyDate(d.toISOString().split('T')[0]);
                    }}
                    title="Lompat ke 1 hari selanjutnya"
                  >
                    Tanggal Selanjutnya ►
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* HEADER DOKUMEN CETAK HARIAN */}
          <div className="printable-document">
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#111827' }}>UD TANI MAKMUR BARU</h2>
                <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0 0 0' }}>
                  LAPORAN HARIAN POSISI STOK & REKAPITULASI PIUTANG KIOS
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px' }}>
                <div>Tanggal: <strong>{formatDateDisplay(selectedDailyDate)}</strong></div>
                <div>Cabang: <strong>{selectedBranch === 'ALL' ? 'Semua Cabang' : selectedBranch}</strong></div>
              </div>
            </div>
          </div>

          {/* A. TABEL 1: STOK & PERGERAKAN HARIAN PER PRODUK */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title" style={{ fontSize: '15px', color: '#1f2937' }}>
              Rekap Mutasi Stok & Penjualan Produk Harian
            </div>

            <div className="table-container">
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>
                    <th>PRODUK</th>
                    <th style={{ textAlign: 'center' }}>SISA LALU</th>
                    <th style={{ textAlign: 'center' }}>PENYALURAN</th>
                    <th style={{ textAlign: 'center' }}>PENEBUSAN TUNAI</th>
                    <th style={{ textAlign: 'center' }}>STOK AKHIR</th>
                    <th style={{ textAlign: 'right' }}>HARGA TEBUS</th>
                    <th style={{ textAlign: 'right' }}>HARGA STOK</th>
                    <th style={{ textAlign: 'right' }}>HARGA JUAL</th>
                    <th style={{ textAlign: 'right' }}>JUAL KE KIOS</th>
                    <th style={{ textAlign: 'right' }}>PENEBUSAN</th>
                  </tr>
                </thead>
                <tbody>
                  {tabel1Data.map(row => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700 }}>{row.name}</td>
                      <td style={{ textAlign: 'center' }}>{row.sisaLaluTon.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.penyaluranHariIniTon.toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{row.penebusanHariIniTon.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{row.stokAkhirTon.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(row.hargaTebus)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRp(row.totalHargaStok)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(row.hargaJual)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRp(row.jualKeKios)}</td>
                      <td style={{ textAlign: 'right' }}>{formatRp(row.penebusanNominal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 800, backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>
                    <td>TOTAL</td>
                    <td style={{ textAlign: 'center' }}>{t1Totals.sisaLaluTon.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{t1Totals.penyaluranHariIniTon.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{t1Totals.penebusanHariIniTon.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{t1Totals.stokAkhirTon.toFixed(2)}</td>
                    <td></td>
                    <td style={{ textAlign: 'right' }}>{formatRp(t1Totals.totalHargaStok)}</td>
                    <td></td>
                    <td style={{ textAlign: 'right' }}>{formatRp(t1Totals.jualKeKios)}</td>
                    <td style={{ textAlign: 'right' }}>{formatRp(t1Totals.penebusanNominal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* B. TABEL 2: RINGKASAN KEUANGAN & PIUTANG HARIAN (TATA LETAK KANAN SESUAI CONTOH) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>
              <table className="data-table" style={{ fontSize: '13px', border: '1px solid #e5e7eb' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, padding: '10px 14px', textTransform: 'uppercase' }}>SISA TAGIHAN LALU</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '10px 14px', color: '#1f2937' }}>
                      {formatRp(sisaTagihanLalu)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: '10px 14px', textTransform: 'uppercase' }}>PENJUALAN</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '10px 14px', color: '#1f2937' }}>
                      {formatRp(penjualanHariIni)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #d1d5db' }}>
                    <td style={{ fontWeight: 800, padding: '10px 14px', textTransform: 'uppercase' }}>TOTAL</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '10px 14px', color: '#1f2937' }}>
                      {formatRp(totalSebelumBayar)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: '10px 14px', textTransform: 'uppercase' }}>PEMBAYARAN</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '10px 14px', color: '#1f2937' }}>
                      {formatRp(pembayaranHariIni)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #d1d5db' }}>
                    <td style={{ fontWeight: 800, padding: '10px 14px', textTransform: 'uppercase' }}>SISA TAGIHAN HARI INI</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '10px 14px', color: '#1f2937' }}>
                      {formatRp(sisaTagihanHariIni)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700, padding: '10px 14px', textTransform: 'uppercase' }}>SISA PUPUK</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '10px 14px', color: '#1f2937' }}>
                      {formatRp(sisaPupukVal)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#eff6ff', borderTop: '2px solid #3b82f6' }}>
                    <td style={{ fontWeight: 800, padding: '12px 14px', textTransform: 'uppercase', color: '#1d4ed8' }}>
                      TOTAL TAGIHAN DAN PUPUK
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, padding: '12px 14px', color: '#1d4ed8', fontSize: '15px' }}>
                      {formatRp(totalTagihanDanPupuk)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* ─── TAMPILAN LAPORAN PERIODE (PENYALURAN / PENEBUSAN / DO) ─── */}
      {activeReport !== 'harian' && (
        <div>
          {/* FILTER BAR PERIODE */}
          <div className="card btn-print-hide" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '2px' }}>Dari Tanggal:</label>
                <input type="date" className="form-input" style={{ width: 'auto' }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '2px' }}>Sampai Tanggal:</label>
                <input type="date" className="form-input" style={{ width: 'auto' }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '13px' }}>
                Cabang: <strong>{selectedBranch === 'ALL' ? 'Semua Cabang' : selectedBranch}</strong>
              </div>
            </div>
          </div>

          {/* SUMMARY CARDS PERIODE */}
          <div className="grid-3 btn-print-hide" style={{ marginBottom: '12px' }}>
            <div className="card">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8' }}>PENEBUSAN PERIODE INI</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{totalPenebusanTon.toFixed(1)} Ton</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Nilai: {formatRp(totalPenebusanVal)}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309' }}>PENGELUARAN DO PERIODE INI</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{totalDOTon.toFixed(1)} Ton</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{filteredDO.length} kali DO</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>PENYALURAN KIOS PERIODE INI</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{totalSalurTon.toFixed(1)} Ton</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Lunas: {formatRp(totalLunas)} | Tempo: {formatRp(totalTempo)}
              </div>
            </div>
          </div>

          {/* DETAIL TABLE PERIODE */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                {activeReport === 'penebusan' && (
                  <tr>
                    <th>Cabang</th><th>Tanggal</th><th>No. SPJB</th><th>Supplier</th><th>Pupuk</th><th>Qty (Ton)</th><th>Total Biaya</th>
                  </tr>
                )}
                {activeReport === 'do' && (
                  <tr>
                    <th>Cabang</th><th>Tanggal</th><th>No. DO</th><th>Pupuk</th><th>Qty (Ton)</th><th>Supir</th><th>Gudang Tujuan</th>
                  </tr>
                )}
                {activeReport === 'penyaluran' && (
                  <tr>
                    <th>Cabang</th><th>Tanggal</th><th>No. SJ</th><th>Kios Tujuan</th><th>Pupuk</th><th>Qty (Ton)</th><th>Total Tagihan</th><th>Pembayaran</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeReport === 'penebusan' && filteredPenebusan.map(item => (
                  <tr key={item.id}>
                    <td><span className={`badge ${item.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{item.branch}</span></td>
                    <td>{formatDateDisplay(item.date)}</td>
                    <td style={{ fontWeight: 700 }}>{item.spjbNo}</td>
                    <td>{item.supplierName}</td>
                    <td>{item.fertilizerName}</td>
                    <td style={{ fontWeight: 700 }}>{getTon(item).toFixed(1)} Ton</td>
                    <td>{formatRp(item.totalAmount)}</td>
                  </tr>
                ))}
                {activeReport === 'do' && filteredDO.map(item => (
                  <tr key={item.id}>
                    <td><span className={`badge ${item.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{item.branch}</span></td>
                    <td>{formatDateDisplay(item.date)}</td>
                    <td style={{ fontWeight: 700 }}>{item.doNo}</td>
                    <td>{item.fertilizerName}</td>
                    <td style={{ fontWeight: 700 }}>{getTon(item).toFixed(1)} Ton</td>
                    <td>{item.driverName} ({item.vehiclePlate})</td>
                    <td>{item.targetWarehouse}</td>
                  </tr>
                ))}
                {activeReport === 'penyaluran' && filteredPenyaluran.map(item => (
                  <tr key={item.id}>
                    <td><span className={`badge ${item.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{item.branch}</span></td>
                    <td>{formatDateDisplay(item.date)}</td>
                    <td style={{ fontWeight: 700 }}>{item.sjNo}</td>
                    <td>{item.kiosName}</td>
                    <td>{item.fertilizerName}</td>
                    <td style={{ fontWeight: 700 }}>{getTon(item).toFixed(1)} Ton</td>
                    <td>{formatRp(item.totalAmount)}</td>
                    <td>
                      <span className={`badge ${item.paymentStatus === 'Lunas' ? 'badge-success' : 'badge-warning'}`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {activeReport === 'penebusan' && filteredPenebusan.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Tidak ada data penebusan pada periode ini.</td></tr>
                )}
                {activeReport === 'do' && filteredDO.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Tidak ada data DO pada periode ini.</td></tr>
                )}
                {activeReport === 'penyaluran' && filteredPenyaluran.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Tidak ada data penyaluran pada periode ini.</td></tr>
                )}
              </tbody>
              {activeReport === 'penyaluran' && filteredPenyaluran.length > 0 && (
                <tfoot>
                  <tr style={{ fontWeight: 800, backgroundColor: '#f3f4f6' }}>
                    <td colSpan={5} style={{ padding: '8px 10px', textAlign: 'right' }}>TOTAL PERIODE:</td>
                    <td style={{ padding: '8px 10px' }}>{totalSalurTon.toFixed(1)} Ton</td>
                    <td style={{ padding: '8px 10px' }}>{formatRp(totalSalurVal)}</td>
                    <td style={{ padding: '8px 10px' }}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
