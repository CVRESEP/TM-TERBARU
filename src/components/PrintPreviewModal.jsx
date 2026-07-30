import React from 'react';
import { formatDateDisplay } from '../utils/currency';

export default function PrintPreviewModal({ isOpen, onClose, printData, printType }) {
  if (!isOpen || !printData) return null;

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const qtyTon = Number(printData.qtyTon || printData.qtyBags * 0.05 || 0);

  return (
    <div className="modal-overlay print-modal-overlay">
      <div className="modal-content print-modal-content" style={{ maxWidth: '750px' }}>
        <div className="modal-header btn-print-hide">
          <div>Pratinjau Dokumen Cetak ({printType === 'penyaluran' ? 'Surat Jalan Kios' : printType === 'penebusan' ? 'Faktur Penebusan' : 'DO Pengeluaran'})</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={() => window.print()}>Cetak Dokumen</button>
            <button className="btn-secondary" onClick={onClose}>Tutup</button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="printable-document" style={{ padding: '30px', background: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
          {/* HEADER DOKUMEN */}
          <div style={{ borderBottom: '2px solid #000000', paddingBottom: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>UD TANI MAKMUR BARU</h2>
              <p style={{ fontSize: '12px', margin: '2px 0' }}>Distributor Pupuk Bersubsidi Resmi - Cabang {printData.branch}</p>
              <p style={{ fontSize: '11px', margin: 0 }}>Wilayah Kerja: Magetan & Sragen</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                {printType === 'penyaluran' && 'SURAT JALAN PENYALURAN KIOS'}
                {printType === 'penebusan' && 'FAKTUR PENEBUSAN SUPPLIER'}
                {printType === 'do' && 'SURAT JALAN DO GUDANG'}
              </h3>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                No: {printData.sjNo || printData.spjbNo || printData.doNo}
              </p>
              <p style={{ fontSize: '11px', margin: 0 }}>Tanggal: {formatDateDisplay(printData.date)}</p>
            </div>
          </div>

          {/* DETAIL TUJUAN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px', fontSize: '12px' }}>
            <div>
              <strong>Pengirim / Asal:</strong><br />
              {printType === 'penebusan' ? (
                <>{printData.supplierName}<br />Produsen / Supplier Pupuk</>
              ) : (
                <>UD Tani Makmur Baru (Cabang {printData.branch})<br />Gudang Distributor Utama</>
              )}
            </div>
            <div>
              <strong>Penerima / Tujuan:</strong><br />
              {printType === 'penyaluran' && <>{printData.kiosName}<br />Kios Pengecer Resmi</>}
              {printType === 'penebusan' && <>Gudang Distributor UD Tani Makmur Baru ({printData.branch})</>}
              {printType === 'do' && <>{printData.targetWarehouse}</>}
            </div>
          </div>

          {/* Rincian Armadas */}
          {(printData.driverName || printData.vehiclePlate) && (
            <div style={{ fontSize: '11px', background: '#f9fafb', padding: '6px 10px', marginBottom: '15px', border: '1px solid #e5e7eb' }}>
              Armada Truk: <strong>{printData.vehiclePlate || '-'}</strong> | Supir: <strong>{printData.driverName || '-'}</strong>
            </div>
          )}

          {/* TABEL BARANG */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '15px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Jenis Pupuk Bersubsidi</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>Jumlah (Ton)</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Harga per Ton</th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>Total Nominal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>{printData.fertilizerName}</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{qtyTon} Ton</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                  {printData.pricePerTon ? formatRp(printData.pricePerTon) : '-'}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                  {printData.totalAmount ? formatRp(printData.totalAmount) : '-'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* TANDA TANGAN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '30px', textAlign: 'center', fontSize: '11px' }}>
            <div>
              <p>Penerima Barang,</p>
              <br /><br />
              <p>( __________________ )</p>
            </div>
            <div>
              <p>Supir / Pengangkut,</p>
              <br /><br />
              <p>( {printData.driverName || '__________________'} )</p>
            </div>
            <div>
              <p>Admin Distributor,</p>
              <br /><br />
              <p>( UD Tani Makmur Baru )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
