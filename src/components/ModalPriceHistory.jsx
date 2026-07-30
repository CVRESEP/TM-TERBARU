import React from 'react';
import { formatDateDisplay } from '../utils/currency';

export default function ModalPriceHistory({
  product,
  onClose,
  onOpenEdit
}) {
  if (!product) return null;

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const historyList = product.priceHistory || [];
  const currentBuy = product.buyPrice || product.defaultPriceTon || 0;
  const currentSell = product.sellPrice || product.defaultPriceTon || 0;
  const currentMargin = currentSell - currentBuy;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px', width: '92%' }}>
        {/* MODAL HEADER */}
        <div className="modal-header" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                Riwayat Perubahan Harga: {product.name}
              </h3>
              <span className="badge badge-info" style={{ fontFamily: 'monospace' }}>{product.id}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Log otomatis pencatatan kenaikan/penurunan Harga Beli (Penebusan) dan Harga Jual (Penyaluran Kios).
            </div>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ fontSize: '14px', fontWeight: 800 }}>Tutup</button>
        </div>

        <div className="modal-body" style={{ paddingTop: '14px' }}>
          {/* CURRENT PRICE SUMMARY CARDS */}
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 700 }}>HARGA BELI SAAT INI (PENEBUSAN)</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>{formatRp(currentBuy)} / Ton</div>
              <div style={{ fontSize: '11px', color: '#3b82f6' }}>Dari Supplier / Pabrik</div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>HARGA JUAL SAAT INI (PENYALURAN)</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>{formatRp(currentSell)} / Ton</div>
              <div style={{ fontSize: '11px', color: '#16a34a' }}>Ke Kios Pengecer</div>
            </div>

            <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '6px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#7e22ce', fontWeight: 700 }}>MARGIN KEUNTUNGAN</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: currentMargin >= 0 ? '#7e22ce' : '#dc2626', marginTop: '4px' }}>
                {formatRp(currentMargin)} / Ton
              </div>
              <div style={{ fontSize: '11px', color: '#9333ea' }}>Selisih Jual & Beli</div>
            </div>
          </div>

          {/* TABLE OF PRICE HISTORY */}
          <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '8px', color: '#1e293b' }}>
            Log Riwayat Perubahan Harga ({historyList.length} Catatan)
          </div>

          <div className="table-container" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '12px' }}>
              <thead>
                <tr>
                  <th>Tanggal & Waktu</th>
                  <th style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Harga Beli (Penebusan)</th>
                  <th style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>Harga Jual (Penyaluran)</th>
                  <th>Perubahan Margin</th>
                  <th>Keterangan / Alasan</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((log, idx) => {
                  const buyDiff = (log.newBuyPrice || 0) - (log.oldBuyPrice || 0);
                  const sellDiff = (log.newSellPrice || 0) - (log.oldSellPrice || 0);

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>{formatDateDisplay(log.date)}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{formatRp(log.newBuyPrice)}</div>
                        <div style={{ fontSize: '10px', color: buyDiff > 0 ? '#dc2626' : buyDiff < 0 ? '#16a34a' : '#64748b' }}>
                          {buyDiff > 0 ? `Naik ${formatRp(buyDiff)}` : buyDiff < 0 ? `Turun ${formatRp(Math.abs(buyDiff))}` : 'Semula: ' + formatRp(log.oldBuyPrice)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#15803d' }}>{formatRp(log.newSellPrice)}</div>
                        <div style={{ fontSize: '10px', color: sellDiff > 0 ? '#16a34a' : sellDiff < 0 ? '#dc2626' : '#64748b' }}>
                          {sellDiff > 0 ? `Naik ${formatRp(sellDiff)}` : sellDiff < 0 ? `Turun ${formatRp(Math.abs(sellDiff))}` : 'Semula: ' + formatRp(log.oldSellPrice)}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatRp((log.newSellPrice || 0) - (log.newBuyPrice || 0))}
                      </td>
                      <td style={{ color: '#334155' }}>
                        {log.notes || 'Penyesuaian patokan harga'}
                      </td>
                    </tr>
                  );
                })}

                {historyList.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      Belum ada catatan riwayat perubahan harga untuk produk ini. Harga saat ini adalah harga awal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onOpenEdit && (
            <button
              type="button"
              className="btn-primary"
              style={{ backgroundColor: '#15803d', fontSize: '12px' }}
              onClick={() => {
                onClose();
                onOpenEdit(product);
              }}
            >
              Update / Edit Harga Produk Ini
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
