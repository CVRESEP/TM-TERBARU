import React from 'react';
import { formatDateDisplay } from '../utils/currency';

export default function ModalDetailTransaksi({ isOpen, onClose, data, type }) {
  if (!isOpen || !data) return null;

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const titles = {
    penebusan: 'RINCIAN DETAIL PENEBUSAN SUPPLIER',
    do: 'RINCIAN DETAIL PENGELUARAN DO GUDANG',
    penyaluran: 'RINCIAN DETAIL PENYALURAN KIOS'
  };

  const headerBg = {
    penebusan: '#15803d',
    do: '#b45309',
    penyaluran: '#0284c7'
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '600px', padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
        {/* MODAL HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid #e5e7eb',
          backgroundColor: headerBg[type] || '#1e293b', color: '#ffffff'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase' }}>
              {titles[type] || 'RINCIAN TRANSAKSI'}
            </h3>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', fontFamily: 'monospace' }}>
              No. DO: <strong>{data.doNo || data.doRefId || data.id || '-'}</strong>
              {data.penyaluranNo || data.nomorPenyaluran ? ` | No. Salur: ${data.penyaluranNo || data.nomorPenyaluran}` : ''}
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#ffffff', fontWeight: 800 }}
          >
            &times;
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#ffffff' }}>
          
          {/* INFORMASI UTAMA TRANSAKSI */}
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '8px' }}>
              INFORMASI UTAMA TRANSAKSI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div><strong>Cabang:</strong> <span className={`badge ${data.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{data.branch}</span></div>
              <div><strong>Tanggal Transaksi:</strong> <span>{formatDateDisplay(data.date)}</span></div>
              <div><strong>Nomor DO:</strong> <span style={{ fontFamily: 'monospace', color: '#15803d', fontWeight: 800 }}>{data.doNo || data.penebusanId || data.id || '-'}</span></div>
              {type === 'penyaluran' && (
                <div><strong>No. Penyaluran:</strong> <span style={{ fontFamily: 'monospace', color: '#1d4ed8', fontWeight: 800 }}>{data.penyaluranNo || data.nomorPenyaluran || '-'}</span></div>
              )}
            </div>
          </div>

          {/* RINCIAN SPESIFIK */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
              RINCIAN BARANG & PIHAK TERKAIT
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              {type === 'penebusan' && (
                <div><strong>Supplier / Produsen:</strong> <span style={{ fontWeight: 700 }}>{data.supplierName || '-'}</span></div>
              )}
              {type === 'penyaluran' && (
                <div><strong>Kios Tujuan:</strong> <span style={{ fontWeight: 800, color: '#15803d' }}>{data.kiosName || '-'}</span></div>
              )}
              {type === 'do' && (
                <div><strong>Tujuan Pengeluaran:</strong> <span style={{ fontWeight: 700 }}>{data.targetWarehouse || `Gudang Utama ${data.branch}`}</span></div>
              )}

              <div><strong>Jenis Pupuk:</strong> <span style={{ fontWeight: 600 }}>{data.fertilizerName || '-'}</span></div>
              <div><strong>Kuantitas (Ton):</strong> <span style={{ fontWeight: 800, color: '#0369a1' }}>{Number(data.qtyTon || data.qty || 0).toFixed(1)} TON</span></div>
              
              {data.pricePerTon !== undefined && (
                <div><strong>Harga / Ton:</strong> <span>{formatRp(data.pricePerTon)}</span></div>
              )}

              {(data.totalAmount !== undefined || data.totalCost !== undefined) && (
                <div><strong>Total Nominal:</strong> <span style={{ fontWeight: 800, color: '#166534' }}>{formatRp(data.totalAmount || data.totalCost)}</span></div>
              )}

              {(data.driverName || data.vehiclePlate) && (
                <div><strong>Sopir / Truk:</strong> <span>{data.driverName || '-'} ({data.vehiclePlate || '-'})</span></div>
              )}
            </div>
          </div>

          {/* STATUS PEMBAYARAN / KETERANGAN */}
          {(() => {
            const rawKet = String(data.keterangan || data.paymentStatus || '').toUpperCase();
            const isUnpaid = rawKet.includes('BELUM LUNAS') || rawKet.includes('TEMPO') || data.paymentStatus === 'Tempo' || (data.kurangBayar > 0);
            const statusText = isUnpaid ? 'Tempo / Utang' : (data.paymentStatus || 'Lunas');
            const statusBg = isUnpaid ? '#fef3c7' : '#dcfce7';
            const statusColor = isUnpaid ? '#b45309' : '#15803d';

            return (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px', backgroundColor: '#ffffff' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                  CATATAN & STATUS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  <div>
                    <strong>Status Pelunasan:</strong> 
                    <span style={{
                      marginLeft: '8px',
                      backgroundColor: statusBg,
                      color: statusColor,
                      padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '12px'
                    }}>
                      {statusText}
                    </span>
                  </div>
                  
                  {data.calculatedTerbayar !== undefined && (
                    <div><strong>Sudah Terbayar:</strong> <span style={{ color: '#15803d', fontWeight: 700 }}>{formatRp(data.calculatedTerbayar)}</span></div>
                  )}
                  {data.kurangBayar !== undefined && data.kurangBayar > 0 && (
                    <div><strong>Sisa Kurang Bayar:</strong> <span style={{ color: '#dc2626', fontWeight: 800 }}>{formatRp(data.kurangBayar)}</span></div>
                  )}

                  {data.notes && (
                    <div style={{ backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', fontStyle: 'italic', fontSize: '12px', marginTop: '4px' }}>
                      "{data.notes}"
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* FOOTER ACTION */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{ padding: '8px 22px' }}
            >
              Tutup Rincian
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
