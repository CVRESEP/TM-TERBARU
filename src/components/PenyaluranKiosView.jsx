import React, { useState } from 'react';
import { formatDateDisplay } from '../utils/currency';
import ModalKiosHistory from './ModalKiosHistory';
import DateFilterBar, { matchesDateFilter } from './DateFilterBar';
import { useSortableTable, SortIcon } from '../utils/useSortableTable';
import { usePagination } from '../utils/usePagination';
import TablePagination from './TablePagination';
import ModalDetailTransaksi from './ModalDetailTransaksi';

import { getPenyaluranPaymentStats } from '../utils/paymentStats';

export default function PenyaluranKiosView({ 
  selectedBranch, penyaluranList, kiosks, payments = [], deposits = [], onAddNew, onEdit, onDelete, onDeleteMultiple, onOpenPrint, settings, onNavigate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [historyKios, setHistoryKios] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [filterState, setFilterState] = useState({
    mode: 'all', dailyDate: '', startDate: '', endDate: '', month: '',
    year: new Date().getFullYear().toString()
  });

  const filtered = penyaluranList.map(item => {
    const stats = getPenyaluranPaymentStats(item, payments);
    return { 
      ...item, 
      calculatedTerbayar: stats.terbayar, 
      kurangBayar: stats.sisa, 
      remainingAmount: stats.sisa,
      paymentStatus: stats.statusDisplay === 'Lunas' ? 'Lunas' : 'Tempo',
      keterangan: stats.statusDisplay === 'Lunas' ? 'LUNAS' : 'BELUM LUNAS'
    };
  }).filter(item => {
    if (!item) return false;
    const matchBranch = selectedBranch === 'ALL' || item.branch === selectedBranch;
    const matchSearch = (item.doNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.penyaluranNo || item.nomorPenyaluran || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.kiosName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.fertilizerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || item.paymentStatus === statusFilter;
    const matchDate = matchesDateFilter(item.date, filterState);
    return matchBranch && matchSearch && matchStatus && matchDate;
  });

  const formatRp = (v) => {
    const num = Number(v);
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(isNaN(num) ? 0 : num);
  };
  const { sorted, sortKey, sortDir, thProps } = useSortableTable(filtered, 'date', 'desc');
  const { currentPage, setCurrentPage, totalPages, paginatedData, itemsPerPage, setItemsPerPage } = usePagination(sorted, 10);

  const handleOpenKiosHistoryByKiosId = (kiosId, fallbackName = '') => {
    const foundKios = kiosks.find(k => k.id === kiosId);
    if (foundKios) {
      setHistoryKios(foundKios);
    } else {
      setHistoryKios({ id: kiosId, name: fallbackName || 'Kios', owner: '-', branch: selectedBranch, address: '-', phone: '-' });
    }
  };

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">{settings.stage3Name || '3. Penyaluran Ke Kios Pengecer'}</h2>
          <p className="page-desc">Distribusi pupuk dari Gudang Distributor ke Kios Pengecer menggunakan <strong>Nomor DO</strong> yang sama.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onNavigate && (
            <>
              <button className="btn-secondary" onClick={() => onNavigate('pengeluaran_do')}>
                ← Ke Pengeluaran DO
              </button>
              <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
                Dashboard
              </button>
              <button className="btn-primary" style={{ backgroundColor: '#1d4ed8' }} onClick={() => onNavigate('pembayaran_kios')}>
                Lanjut ke Pembayaran Kios →
              </button>
            </>
          )}
          <button className="btn-primary" onClick={() => onAddNew('penyaluran')}>+ Input Penyaluran Kios</button>
        </div>
      </div>

      <div className="table-container">
        <DateFilterBar filterState={filterState} setFilterState={setFilterState} />
        
        {/* BAR PENGHAPUSAN TERPILIH */}
        {selectedIds.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
              📌 <strong>{selectedIds.length}</strong> data penyaluran dipilih
            </span>
            <button 
              className="btn-danger" 
              style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}
              onClick={() => {
                if (onDeleteMultiple) {
                  onDeleteMultiple('penyaluran', selectedIds);
                  setSelectedIds([]);
                }
              }}
            >
              🗑️ Hapus {selectedIds.length} Data Terpilih
            </button>
          </div>
        )}

        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" placeholder="Cari No. DO / No. Penyaluran / Kios / Pupuk..." className="search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Semua Pembayaran</option>
              <option value="Lunas">Lunas</option>
              <option value="Tempo">Tempo / Utang</option>
            </select>
          </div>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Total: <strong>{filtered.length} Penyaluran</strong></span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id))}
                  onChange={() => {
                    const allSelected = paginatedData.every(item => selectedIds.includes(item.id));
                    if (allSelected) {
                      setSelectedIds(prev => prev.filter(id => !paginatedData.some(item => item.id === id)));
                    } else {
                      const newIds = new Set([...selectedIds, ...paginatedData.map(item => item.id)]);
                      setSelectedIds(Array.from(newIds));
                    }
                  }}
                  title="Pilih Semua di Halaman Ini"
                />
              </th>
              <th style={{ width: '40px' }} className="text-center">NO</th>
              <th {...thProps('doNo')} className="sortable-th" style={{ backgroundColor: '#dcfce7' }}>NO DO <SortIcon colKey="doNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('penyaluranNo')} className="sortable-th" style={{ backgroundColor: '#eff6ff' }}>NO PENYALURAN <SortIcon colKey="penyaluranNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('date')} className="sortable-th text-center" style={{ width: '100px' }}>TANGGAL <SortIcon colKey="date" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('branch')} className="sortable-th text-center" style={{ width: '90px' }}>KABUPATEN <SortIcon colKey="branch" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('fertilizerName')} className="sortable-th">NAMA PRODUK <SortIcon colKey="fertilizerName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('kiosName')} className="sortable-th">NAMA KIOS <SortIcon colKey="kiosName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('driverName')} className="sortable-th">NAMA SOPIR <SortIcon colKey="driverName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('qtyTon')} className="sortable-th text-right">QTY <SortIcon colKey="qtyTon" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('totalAmount')} className="sortable-th text-right">TOTAL <SortIcon colKey="totalAmount" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right">DI BAYAR</th>
              <th className="text-right">TOTAL BAYAR TEMPO</th>
              <th {...thProps('kurangBayar')} className="sortable-th text-right">KURANG BAYAR <SortIcon colKey="kurangBayar" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('paymentStatus')} className="sortable-th text-center">KETERANGAN <SortIcon colKey="paymentStatus" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-center">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => {
              const totalAmt = Number(item.totalAmount || 0);
              const terbayar = item.calculatedTerbayar !== undefined ? item.calculatedTerbayar : 0;
              const dpAmount = Number(item.dpAmount || item.diBayar || 0);
              const bayarTempo = Math.max(0, terbayar - dpAmount);
              const kurangBayar = item.kurangBayar !== undefined ? item.kurangBayar : Math.max(0, totalAmt - terbayar);
              const isLunas = kurangBayar <= 0.01 && totalAmt > 0;
              const pNo = item.penyaluranNo || item.nomorPenyaluran || (item.doNo ? `${item.doNo}-01` : '-');
              const rowNo = (currentPage - 1) * itemsPerPage + idx + 1;

              return (
                <tr 
                  key={item.id} 
                  style={{ backgroundColor: selectedIds.includes(item.id) ? '#fef2f2' : undefined, cursor: 'pointer' }}
                  onClick={() => setDetailModalItem(item)}
                  className="table-row-hover"
                >
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(item.id)}
                      onChange={() => {
                        setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]);
                      }}
                    />
                  </td>
                  <td className="text-center" style={{ fontWeight: 600, color: '#64748b' }}>{rowNo}</td>
                  <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{item.doNo || item.doRefId || item.id}</td>
                  <td style={{ fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace' }}>{pNo}</td>
                  <td className="text-center">{formatDateDisplay(item.date)}</td>
                  <td className="text-center" style={{ fontWeight: 700 }}>{(item.branch || '').toUpperCase()}</td>
                  <td style={{ fontWeight: 600 }}>{item.fertilizerName}</td>
                  <td>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenKiosHistoryByKiosId(item.kiosId, item.kiosName);
                      }}
                      style={{
                        fontWeight: 700,
                        color: '#15803d',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px'
                      }}
                      title="Klik untuk melihat riwayat transaksi lengkap kios ini"
                    >
                      {item.kiosName}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.driverName || item.namaSopir || '-'}</td>
                  <td className="text-right" style={{ fontWeight: 700 }}>{Number(item.qtyTon || item.qty || 0).toFixed(Number.isInteger(Number(item.qtyTon || item.qty || 0)) ? 0 : 2)}</td>
                  <td className="text-right" style={{ fontWeight: 700 }}>{formatRp(totalAmt)}</td>
                  <td className="text-right" style={{ color: '#15803d' }}>{formatRp(dpAmount)}</td>
                  <td className="text-right" style={{ color: '#2563eb' }}>{formatRp(bayarTempo)}</td>
                  <td className="text-right" style={{ color: kurangBayar > 0 ? '#dc2626' : '#6b7280', fontWeight: 700 }}>{formatRp(kurangBayar)}</td>
                  <td className="text-center">
                    <span className={`badge ${isLunas ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                      {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onEdit('penyaluran', item)}>Edit</button>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onOpenPrint(item, 'penyaluran')}>Cetak SJ</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDelete('penyaluran', item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={16} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                Belum ada data penyaluran kios.
              </td></tr>
            )}
          </tbody>
          {paginatedData.length > 0 && (
            <tfoot>
              {/* BARIS 1: TOTAL HALAMAN INI */}
              <tr style={{ fontWeight: 800, backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={9} style={{ textAlign: 'right', padding: '8px 14px', color: '#475569' }}>TOTAL HALAMAN INI:</td>
                <td className="text-right" style={{ color: '#0284c7' }}>
                  {paginatedData.reduce((s, i) => s + Number(i.qtyTon || i.qty || 0), 0).toFixed(2)}
                </td>
                <td className="text-right" style={{ color: '#166534' }}>
                  {formatRp(paginatedData.reduce((s, i) => s + Number(i.totalAmount || 0), 0))}
                </td>
                <td className="text-right" style={{ color: '#15803d' }}>
                  {formatRp(paginatedData.reduce((s, i) => s + Number(i.dpAmount || i.diBayar || 0), 0))}
                </td>
                <td className="text-right" style={{ color: '#2563eb' }}>
                  {formatRp(paginatedData.reduce((s, i) => s + Math.max(0, (i.calculatedTerbayar || 0) - Number(i.dpAmount || i.diBayar || 0)), 0))}
                </td>
                <td className="text-right" style={{ color: '#dc2626' }}>
                  {formatRp(paginatedData.reduce((sum, item) => sum + Number(item.kurangBayar || 0), 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
              {/* BARIS 2: TOTAL KESELURUHAN */}
              <tr style={{ fontWeight: 900, backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1' }}>
                <td colSpan={9} style={{ textAlign: 'right', padding: '8px 14px', color: '#0f172a' }}>TOTAL KESELURUHAN:</td>
                <td className="text-right" style={{ color: '#0369a1' }}>
                  {filtered.reduce((s, i) => s + Number(i.qtyTon || i.qty || 0), 0).toFixed(2)}
                </td>
                <td className="text-right" style={{ color: '#14532d' }}>
                  {formatRp(filtered.reduce((s, i) => s + Number(i.totalAmount || 0), 0))}
                </td>
                <td className="text-right" style={{ color: '#15803d' }}>
                  {formatRp(filtered.reduce((s, i) => s + Number(i.dpAmount || i.diBayar || 0), 0))}
                </td>
                <td className="text-right" style={{ color: '#2563eb' }}>
                  {formatRp(filtered.reduce((s, i) => s + Math.max(0, (i.calculatedTerbayar || 0) - Number(i.dpAmount || i.diBayar || 0)), 0))}
                </td>
                <td className="text-right" style={{ color: '#991b1b' }}>
                  {formatRp(filtered.reduce((sum, item) => sum + Number(item.kurangBayar || 0), 0))}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
        <TablePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          setCurrentPage={setCurrentPage} 
          totalItems={filtered.length} 
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>

      {historyKios && (
        <ModalKiosHistory
          kios={historyKios}
          penyaluranList={penyaluranList}
          payments={payments}
          deposits={deposits}
          onClose={() => setHistoryKios(null)}
        />
      )}

      <ModalDetailTransaksi 
        isOpen={Boolean(detailModalItem)}
        onClose={() => setDetailModalItem(null)}
        data={detailModalItem}
        type="penyaluran"
      />
    </div>
  );
}

