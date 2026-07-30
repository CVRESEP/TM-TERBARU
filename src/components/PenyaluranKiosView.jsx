import React, { useState } from 'react';
import { formatDateDisplay } from '../utils/currency';
import ModalKiosHistory from './ModalKiosHistory';
import DateFilterBar, { matchesDateFilter } from './DateFilterBar';
import { useSortableTable, SortIcon } from '../utils/useSortableTable';
import { usePagination } from '../utils/usePagination';
import TablePagination from './TablePagination';

export default function PenyaluranKiosView({ 
  selectedBranch, penyaluranList, kiosks, payments = [], deposits = [], onAddNew, onEdit, onDelete, onOpenPrint, settings, onNavigate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [historyKios, setHistoryKios] = useState(null);
  const [filterState, setFilterState] = useState({
    mode: 'all', dailyDate: '', startDate: '', endDate: '', month: '',
    year: new Date().getFullYear().toString()
  });

  const filtered = penyaluranList.filter(item => {
    const matchBranch = selectedBranch === 'ALL' || item.branch === selectedBranch;
    const matchSearch = (item.doNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.penyaluranNo || item.nomorPenyaluran || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.kiosName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.fertilizerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || item.paymentStatus === statusFilter;
    const matchDate = matchesDateFilter(item.date, filterState);
    return matchBranch && matchSearch && matchStatus && matchDate;
  });

  const formatRp = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
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
              <th {...thProps('branch')} className="sortable-th text-center" style={{ width: '90px' }}>Cabang <SortIcon colKey="branch" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('doNo')} className="sortable-th" style={{ backgroundColor: '#dcfce7' }}>Nomor DO <SortIcon colKey="doNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('penyaluranNo')} className="sortable-th" style={{ backgroundColor: '#eff6ff' }}>No. Penyaluran <SortIcon colKey="penyaluranNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('date')} className="sortable-th text-center" style={{ width: '100px' }}>Tanggal <SortIcon colKey="date" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('kiosName')} className="sortable-th" >Kios Tujuan <SortIcon colKey="kiosName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('fertilizerName')} className="sortable-th" >Jenis Pupuk <SortIcon colKey="fertilizerName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('qtyTon')} className="sortable-th text-right" >Qty (Ton) <SortIcon colKey="qtyTon" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('pricePerTon')} className="sortable-th text-right" >Harga / Ton <SortIcon colKey="pricePerTon" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('totalAmount')} className="sortable-th text-right" >Total Tagihan <SortIcon colKey="totalAmount" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right" >Terbayar</th>
              <th className="text-right" >Kurang Bayar</th>
              <th {...thProps('paymentStatus')} className="sortable-th text-center" >Keterangan <SortIcon colKey="paymentStatus" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-center" >Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => {
              const totalAmt = Number(item.totalAmount || 0);
              const itemPayments = payments.filter(pm => pm.penyaluranId === item.id || pm.penyaluranId === item.nomorPenyaluran || pm.doRefId === item.doRefId);
              const paidSum = itemPayments.reduce((s, pm) => s + Number(pm.amount || 0), 0);
              const initialDp = Number(item.dpAmount || item.paidAmount || 0);

              let terbayar = paidSum + initialDp;
              if (item.paymentStatus === 'Lunas' && itemPayments.length === 0) {
                terbayar = totalAmt;
              } else if (item.paymentStatus === 'Lunas') {
                terbayar = Math.max(totalAmt, terbayar);
              }

              const kurangBayar = Math.max(0, totalAmt - terbayar);
              const isLunas = kurangBayar === 0;
              const pNo = item.penyaluranNo || item.nomorPenyaluran || (item.doNo ? `${item.doNo}-01` : '-');

              return (
                <tr key={item.id}>
                  <td className="text-center"><span className={`badge ${item.branch === (settings.branch1Name || 'Magetan') ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{item.branch}</span></td>
                  <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{item.doNo || item.doRefId || item.id}</td>
                  <td style={{ fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace' }}>{pNo}</td>
                  <td className="text-center">{formatDateDisplay(item.date)}</td>
                  <td>
                    <span
                      onClick={() => handleOpenKiosHistoryByKiosId(item.kiosId, item.kiosName)}
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
                  <td style={{ fontWeight: 600 }}>{item.fertilizerName}</td>
                  <td className="text-right" style={{ fontWeight: 700 }}>{Number(item.qtyTon || item.qty || 0).toFixed(1)} Ton</td>
                  <td className="text-right">{formatRp(item.pricePerTon || 0)}</td>
                  <td className="text-right" style={{ fontWeight: 700 }}>{formatRp(totalAmt)}</td>
                  <td className="text-right" style={{ color: '#15803d', fontWeight: 600 }}>{formatRp(terbayar)}</td>
                  <td className="text-right" style={{ color: kurangBayar > 0 ? '#dc2626' : '#6b7280', fontWeight: 700 }}>{formatRp(kurangBayar)}</td>
                  <td>
                    <span className={`badge ${isLunas ? 'badge-success' : 'badge-warning'}`}>
                      {isLunas ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onEdit('penyaluran', item)}>Edit</button>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onOpenPrint(item, 'penyaluran')}>Cetak SJ</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDelete('penyaluran', item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={12} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                Belum ada data penyaluran kios.
              </td></tr>
            )}
          </tbody>
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
    </div>
  );
}

