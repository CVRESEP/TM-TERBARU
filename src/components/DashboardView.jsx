import React from 'react';
import { formatDateDisplay } from '../utils/currency';

export default function DashboardView({ 
  selectedBranch, penebusanList, doList, penyaluranList,
  fertilizers, onNavigate, onAddNew, onOpenPrint, settings
}) {
  const filterByBranch = (item) => selectedBranch === 'ALL' || item.branch === selectedBranch;

  const currentPenebusan = penebusanList.filter(filterByBranch);
  const currentDO = doList.filter(filterByBranch);
  const currentPenyaluran = penyaluranList.filter(filterByBranch);

  const totalPenebusanTon = currentPenebusan.reduce((s, i) => s + Number(i.qtyTon || 0), 0);
  const totalPenebusanVal = currentPenebusan.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const totalDOTon = currentDO.reduce((s, i) => s + Number(i.qtyTon || 0), 0);
  const totalSalurTon = currentPenyaluran.reduce((s, i) => s + Number(i.qtyTon || 0), 0);
  const totalSalurVal = currentPenyaluran.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const sisaQuotaTon = Math.max(0, totalPenebusanTon - totalDOTon);
  const stokGudangKitaTon = Math.max(0, totalDOTon - totalSalurTon);

  const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  return (
    <div>
      {/* Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">
            Dashboard Distribusi Pupuk — {selectedBranch === 'ALL' ? 'Semua Cabang' : `Cabang ${selectedBranch}`}
          </h2>
          <p className="page-desc">Ringkasan alur 3 tahap (satuan TON): Penebusan → Pengeluaran DO → Penyaluran Kios</p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          SHORTCUT BAR — aksi cepat 3 tahap
         ══════════════════════════════════════ */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginRight: '4px' }}>
          Shortcut:
        </span>

        {/* Tahap 1 */}
        <button
          className="btn-primary"
          style={{ fontSize: '12px', padding: '5px 12px', backgroundColor: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={() => onAddNew('penebusan')}
        >
          + Penebusan Baru
        </button>

        <span style={{ color: '#d1d5db', fontWeight: 700 }}>→</span>

        {/* Tahap 2 */}
        <button
          className="btn-primary"
          style={{ fontSize: '12px', padding: '5px 12px', backgroundColor: '#b45309', display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={() => onAddNew('do')}
        >
          + Pengeluaran DO
        </button>

        <span style={{ color: '#d1d5db', fontWeight: 700 }}>→</span>

        {/* Tahap 3 */}
        <button
          className="btn-primary"
          style={{ fontSize: '12px', padding: '5px 12px', backgroundColor: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}
          onClick={() => onAddNew('penyaluran')}
        >
          + Penyaluran Kios
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => onAddNew('kios')}>+ Kios Baru</button>
          <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => onAddNew('supplier')}>+ Supplier Baru</button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          3 WORKFLOW CARDS
         ══════════════════════════════════════ */}
      <div className="grid-3">
        {/* Card 1 */}
        <div className="card" style={{ borderTop: '3px solid #1d4ed8' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.5px' }}>TAHAP 1 — PENEBUSAN SUPPLIER</div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0', color: '#111827' }}>{totalPenebusanTon.toFixed(1)} Ton</div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '10px' }}>Total Nilai: {formatRp(totalPenebusanVal)}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={{ flex: 1, fontSize: '12px', padding: '4px 0', backgroundColor: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 700 }}
              onClick={() => onAddNew('penebusan')}
            >
              + Input
            </button>
            <button className="btn-secondary" style={{ flex: 1, fontSize: '12px' }} onClick={() => onNavigate('penebusan')}>
              Lihat Daftar
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="card" style={{ borderTop: '3px solid #b45309' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', letterSpacing: '0.5px' }}>TAHAP 2 — PENGELUARAN DO</div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0', color: '#111827' }}>{totalDOTon.toFixed(1)} Ton</div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '10px' }}>Sisa Kuota Supplier: {sisaQuotaTon.toFixed(1)} Ton</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={{ flex: 1, fontSize: '12px', padding: '4px 0', backgroundColor: '#b45309', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 700 }}
              onClick={() => onAddNew('do')}
            >
              + Input
            </button>
            <button className="btn-secondary" style={{ flex: 1, fontSize: '12px' }} onClick={() => onNavigate('pengeluaran_do')}>
              Lihat Daftar
            </button>
          </div>
        </div>

        {/* Card 3 */}
        <div className="card" style={{ borderTop: '3px solid #15803d' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', letterSpacing: '0.5px' }}>TAHAP 3 — PENYALURAN KIOS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0', color: '#111827' }}>{totalSalurTon.toFixed(1)} Ton</div>
          <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '10px' }}>Stok Gudang Siap Salur: {stokGudangKitaTon.toFixed(1)} Ton</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={{ flex: 1, fontSize: '12px', padding: '4px 0', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 700 }}
              onClick={() => onAddNew('penyaluran')}
            >
              + Input
            </button>
            <button className="btn-secondary" style={{ flex: 1, fontSize: '12px' }} onClick={() => onNavigate('penyaluran_kios')}>
              Lihat Daftar
            </button>
          </div>
        </div>
      </div>

      {/* REKAP PER PUPUK */}
      <div className="card" style={{ marginBottom: '15px' }}>
        <div className="card-title">
          <span>Stok Fisik Gudang Distributor (Ton)</span>
          <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => onNavigate('stok_mutasi')}>Detail Stok Mutasi</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Jenis Pupuk</th>
              <th>1. Total Penebusan (Ton)</th>
              <th>2. Total DO (Ton)</th>
              <th>Sisa Kuota (Ton)</th>
              <th>Stok Gudang Kita (Ton)</th>
              <th>3. Total Salur (Ton)</th>
              <th>Aksi Cepat</th>
            </tr>
          </thead>
          <tbody>
            {fertilizers.map((fert) => {
              const fPenebusan = currentPenebusan.filter(p => p.fertilizerId === fert.id).reduce((s, i) => s + Number(i.qtyTon || 0), 0);
              const fDO = currentDO.filter(d => d.fertilizerId === fert.id).reduce((s, i) => s + Number(i.qtyTon || 0), 0);
              const fSalur = currentPenyaluran.filter(s => s.fertilizerId === fert.id).reduce((s, i) => s + Number(i.qtyTon || 0), 0);
              const stok = Math.max(0, fDO - fSalur);
              const sisa = Math.max(0, fPenebusan - fDO);
              return (
                <tr key={fert.id}>
                  <td style={{ fontWeight: 700 }}>{fert.name}</td>
                  <td>{fPenebusan.toFixed(1)}</td>
                  <td>{fDO.toFixed(1)}</td>
                  <td style={{ color: sisa > 0 ? '#1d4ed8' : '#9ca3af' }}>{sisa.toFixed(1)}</td>
                  <td style={{ fontWeight: 800, color: stok > 0 ? '#15803d' : '#dc2626' }}>{stok.toFixed(1)}</td>
                  <td>{fSalur.toFixed(1)}</td>
                  <td>
                    {stok > 0 ? (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => onAddNew('penyaluran')}
                      >
                        + Salur
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Habis</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TRANSAKSI TERBARU */}
      <div className="table-container">
        <div className="table-toolbar">
          <strong>Transaksi Penyaluran Ke Kios Terbaru</strong>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn-primary"
              style={{ fontSize: '12px', padding: '4px 12px', backgroundColor: '#15803d' }}
              onClick={() => onAddNew('penyaluran')}
            >
              + Penyaluran Baru
            </button>
            <button className="btn-secondary" style={{ fontSize: '12px' }} onClick={() => onNavigate('penyaluran_kios')}>
              Lihat Semua
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cabang</th>
              <th>Nomor DO</th>
              <th>Tanggal</th>
              <th>Kios Tujuan</th>
              <th>Jenis Pupuk</th>
              <th>Qty (Ton)</th>
              <th>Total Tagihan</th>
              <th>Pembayaran</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentPenyaluran.slice(0, 5).map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={`badge ${item.branch === (settings?.branch1Name || 'Magetan') ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>
                    {item.branch}
                  </span>
                </td>
                <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#15803d' }}>{item.doNo}</td>
                <td>{formatDateDisplay(item.date)}</td>
                <td>{item.kiosName}</td>
                <td>{item.fertilizerName}</td>
                <td style={{ fontWeight: 700 }}>{Number(item.qtyTon || 0).toFixed(1)} Ton</td>
                <td>{formatRp(item.totalAmount || 0)}</td>
                <td>
                  <span className={`badge ${item.paymentStatus === 'Lunas' ? 'badge-success' : 'badge-warning'}`}>
                    {item.paymentStatus}
                  </span>
                </td>
                <td>
                  <button className="btn-secondary" style={{ fontSize: '11px' }} onClick={() => onOpenPrint(item, 'penyaluran')}>
                    Cetak SJ
                  </button>
                </td>
              </tr>
            ))}
            {currentPenyaluran.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Belum ada penyaluran. Gunakan tombol shortcut di atas untuk mulai input.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
