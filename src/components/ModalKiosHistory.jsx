import React, { useState } from 'react';
import { formatDateDisplay } from '../utils/currency';

export default function ModalKiosHistory({
  kios,
  penyaluranList = [],
  payments = [],
  deposits = [],
  onClose,
  onOpenPayment,
  onOpenDeposit
}) {
  const [activeTab, setActiveTab] = useState('salur'); // 'salur' | 'bayar'

  if (!kios) return null;

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // Helper pencocokan kios fleksibel (support ID, Name, & Code dari data legacy)
  const matchKios = (item) => {
    if (!item) return false;
    const kId = String(kios.id || '').toLowerCase().trim();
    const kName = String(kios.name || '').toLowerCase().trim();
    const kCode = String(kios.code || '').toLowerCase().trim();

    const itemKId = String(item.kiosId || '').toLowerCase().trim();
    const itemKName = String(item.kiosName || '').toLowerCase().trim();

    return (
      (itemKId && itemKId === kId) ||
      (itemKName && itemKName === kName) ||
      (itemKId && itemKId === kName) ||
      (itemKId && itemKId === kCode) ||
      (itemKName && itemKName === kId)
    );
  };

  // Filter transactions for this specific kiosk
  const kiosSalur = (penyaluranList || []).filter(p => matchKios(p));
  const kiosPayments = (payments || []).filter(pm => matchKios(pm));
  const kiosDeposits = (deposits || []).filter(d => matchKios(d));

  // Financial calculations
  const totalTagihan = kiosSalur.reduce((s, p) => s + Number(p?.totalAmount || 0), 0);
  
  const getPenyaluranPaymentStats = (pItem) => {
    if (!pItem) return { total: 0, terbayar: 0, sisa: 0 };
    const itemPayments = (payments || []).filter(pm => {
      if (!pm) return false;
      const matchDirect = pm.penyaluranId && (pm.penyaluranId === pItem.id || pm.penyaluranId === pItem.penyaluranNo || pm.penyaluranId === pItem.nomorPenyaluran);
      const matchDoKios = pm.doNo && pItem.doNo && pm.doNo === pItem.doNo && matchKios(pm);
      return matchDirect || matchDoKios;
    });
    const paidSum = itemPayments.reduce((s, pm) => s + Number(pm?.amount || 0), 0);
    const initialDp = Number(pItem.dpAmount || 0);
    const total = Number(pItem.totalAmount || 0);
    let terbayar = paidSum + initialDp;
    if (pItem.paymentStatus === 'Lunas' && itemPayments.length === 0) terbayar = total;
    else if (pItem.paymentStatus === 'Lunas') terbayar = Math.max(total, terbayar);
    const sisa = Math.max(0, total - terbayar);
    return { total, terbayar, sisa };
  };

  const totalTerbayar = kiosSalur.reduce((s, p) => s + getPenyaluranPaymentStats(p).terbayar, 0);
  const kekuranganPembayaran = Math.max(0, totalTagihan - totalTerbayar);
  const depositTotal = kiosDeposits.reduce((s, d) => s + Number(d?.amount || 0), 0);

  // Combine payments & deposits for audit trail
  const combinedHistory = [
    ...kiosPayments.map(p => ({ ...p, logType: 'Pelunasan', method: p.method || p.paymentMethod })),
    ...kiosDeposits.map(d => ({ ...d, logType: 'Deposit', method: d.method || d.paymentMethod }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px', width: '92%' }}>
        {/* MODAL HEADER */}
        <div className="modal-header" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                Riwayat Transaksi: {kios.name}
              </h3>
              <span className={`badge ${kios.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>
                {kios.branch}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Pemilik: <strong>{kios.owner || '-'}</strong> | Telepon/WA: <strong>{kios.phone || '-'}</strong> | Alamat: <strong>{kios.address || '-'}</strong>
            </div>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '14px', fontWeight: 800 }}>Tutup</button>
        </div>

        <div className="modal-body" style={{ paddingTop: '14px' }}>
          {/* SUMMARY MINI CARDS */}
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>TOTAL TAGIHAN</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{formatRp(totalTagihan)}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{kiosSalur.length} Pengiriman DO</div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#15803d', fontWeight: 700 }}>TERBAYAR (DP/LUNAS)</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>{formatRp(totalTerbayar)}</div>
              <div style={{ fontSize: '10px', color: '#16a34a' }}>Uang Masuk</div>
            </div>

            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>KEKURANGAN TAGIHAN</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{formatRp(kekuranganPembayaran)}</div>
              <div style={{ fontSize: '10px', color: '#ef4444' }}>Sisa Tempo</div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700 }}>SALDO DEPOSIT</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>{formatRp(depositTotal)}</div>
              <div style={{ fontSize: '10px', color: '#2563eb' }}>Titipan Kios</div>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <button
              type="button"
              className={activeTab === 'salur' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab('salur')}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              Penyaluran Pupuk ({kiosSalur.length})
            </button>
            <button
              type="button"
              className={activeTab === 'bayar' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTab('bayar')}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              Pelunasan & Deposit ({combinedHistory.length})
            </button>
          </div>

          {/* TAB 1: PENYALURAN DO */}
          {activeTab === 'salur' && (
            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th style={{ backgroundColor: '#dcfce7' }}>Nomor DO</th>
                    <th>Pupuk</th>
                    <th>Qty (Ton)</th>
                    <th>Total Tagihan</th>
                    <th>Terbayar</th>
                    <th>Kekurangan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kiosSalur.map(p => {
                    const stats = getPenyaluranPaymentStats(p);
                    return (
                      <tr key={p.id}>
                        <td>{formatDateDisplay(p.date)}</td>
                        <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{p.doNo}</td>
                        <td style={{ fontWeight: 600 }}>{p.fertilizerName}</td>
                        <td style={{ fontWeight: 700 }}>{Number(p.qtyTon || 0).toFixed(1)} Ton</td>
                        <td>{formatRp(stats.total)}</td>
                        <td style={{ color: '#15803d', fontWeight: 600 }}>{formatRp(stats.terbayar)}</td>
                        <td style={{ color: stats.sisa > 0 ? '#dc2626' : '#6b7280', fontWeight: 700 }}>{formatRp(stats.sisa)}</td>
                        <td>
                          <span className={`badge ${stats.sisa === 0 ? 'badge-success' : 'badge-warning'}`}>
                            {stats.sisa === 0 ? 'Lunas' : 'Tempo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {kiosSalur.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>Belum ada riwayat penyaluran pupuk untuk kios ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: PELUNASAN & DEPOSIT */}
          {activeTab === 'bayar' && (
            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Tipe Log</th>
                    <th>No. DO Terkait</th>
                    <th>Nominal (Rp)</th>
                    <th>Metode / Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedHistory.map(log => (
                    <tr key={log.id}>
                      <td>{formatDateDisplay(log.date)}</td>
                      <td>
                        <span className={`badge ${log.logType === 'Pelunasan' ? 'badge-success' : 'badge-info'}`}>
                          {log.logType === 'Pelunasan' ? 'Pelunasan' : 'Deposit'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#15803d' }}>{log.doNo || '-'}</td>
                      <td style={{ fontWeight: 800, color: log.logType === 'Pelunasan' ? '#15803d' : '#1d4ed8' }}>
                        {formatRp(log.amount)}
                      </td>
                      <td>{log.method ? `[${log.method}] ` : ''}{log.notes || '-'}</td>
                    </tr>
                  ))}
                  {combinedHistory.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>Belum ada riwayat pembayaran atau deposit untuk kios ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ backgroundColor: '#15803d', fontSize: '12px' }}
              onClick={() => {
                onClose();
                if (onOpenPayment) onOpenPayment(kios.id);
              }}
            >
              + Terima Pelunasan Kios Ini
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ backgroundColor: '#1d4ed8', fontSize: '12px' }}
              onClick={() => {
                onClose();
                if (onOpenDeposit) onOpenDeposit(kios.id);
              }}
            >
              + Catat Deposit Kios Ini
            </button>
          </div>

          <button type="button" className="btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
