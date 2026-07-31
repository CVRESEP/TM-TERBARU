import React, { useState } from 'react';
import { formatDateDisplay } from '../utils/currency';
import DateFilterBar, { matchesDateFilter } from './DateFilterBar';
import { useSortableTable, SortIcon } from '../utils/useSortableTable';
import { usePagination } from '../utils/usePagination';
import TablePagination from './TablePagination';
import ModalDetailTransaksi from './ModalDetailTransaksi';

export default function PengeluaranDoView({ 
  selectedBranch, doList, penebusanList, penyaluranList = [], onAddNew, onEdit, onOpenNextStage, onDelete, onDeleteMultiple, onOpenPrint, settings, onNavigate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [filterState, setFilterState] = useState({
    mode: 'all', dailyDate: '', startDate: '', endDate: '', month: '',
    year: new Date().getFullYear().toString()
  });

  const filtered = doList.filter(item => {
    const matchBranch = selectedBranch === 'ALL' || item.branch === selectedBranch;
    const matchSearch = (item.doNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.fertilizerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = matchesDateFilter(item.date, filterState);
    return matchBranch && matchSearch && matchDate;
  });
  const { sorted, sortKey, sortDir, thProps } = useSortableTable(filtered, 'date', 'desc');
  const { currentPage, setCurrentPage, totalPages, paginatedData, itemsPerPage, setItemsPerPage } = usePagination(sorted, 10);

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">{settings.stage2Name || '2. Pengeluaran DO Gudang'}</h2>
          <p className="page-desc">Pengambilan pupuk dari Gudang Supplier ke Gudang Distributor menggunakan <strong>Nomor DO</strong> yang sama dengan Penebusan.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onNavigate && (
            <>
              <button className="btn-secondary" onClick={() => onNavigate('penebusan')}>
                ← Ke Penebusan
              </button>
              <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
                Dashboard
              </button>
              <button className="btn-primary" style={{ backgroundColor: '#15803d' }} onClick={() => onNavigate('penyaluran_kios')}>
                Lanjut ke Penyaluran Kios →
              </button>
            </>
          )}
          <button className="btn-primary" onClick={() => onAddNew('do')}>+ Input Pengeluaran DO</button>
        </div>
      </div>

      <div className="table-container">
        <DateFilterBar filterState={filterState} setFilterState={setFilterState} />
        
        {/* BAR PENGHAPUSAN TERPILIH */}
        {selectedIds.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
              📌 <strong>{selectedIds.length}</strong> data DO dipilih
            </span>
            <button 
              className="btn-danger" 
              style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}
              onClick={() => {
                if (onDeleteMultiple) {
                  onDeleteMultiple('do', selectedIds);
                  setSelectedIds([]);
                }
              }}
            >
              🗑️ Hapus {selectedIds.length} Data Terpilih
            </button>
          </div>
        )}

        <div className="table-toolbar">
          <input type="text" placeholder="Cari No. DO / Supir / Pupuk..." className="search-input"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Total: <strong>{filtered.length} DO</strong></span>
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
              <th {...thProps('branch')} className="sortable-th text-center" style={{ width: '90px' }}>Cabang <SortIcon colKey="branch" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('doNo')} className="sortable-th" style={{ backgroundColor: '#dcfce7' }}>Nomor DO <SortIcon colKey="doNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('date')} className="sortable-th text-center" style={{ width: '100px' }}>Tanggal <SortIcon colKey="date" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('fertilizerName')} className="sortable-th" >Jenis Pupuk <SortIcon colKey="fertilizerName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('qtyTon')} className="sortable-th text-right" >Qty DO (Ton) <SortIcon colKey="qtyTon" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-right" >Sudah Disalurkan (Ton)</th>
              <th className="text-right" >Sisa DO Siap Salur (Ton)</th>
              <th className="text-center" >Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => {
              const salurDariDO = (penyaluranList || [])
                .filter(s => (s.doRefId === item.id || (item.doNo && (s.doNo === item.doNo || s.doRefId === item.doNo))))
                .reduce((sum, s) => sum + Number(s.qtyTon || s.qty || 0), 0);
              const sisaStokDO = Math.max(0, Number(item.qtyTon || item.qty || 0) - salurDariDO);

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
                  <td className="text-center"><span className={`badge ${item.branch === (settings.branch1Name || 'Magetan') ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{item.branch}</span></td>
                  <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{item.doNo || item.penebusanId || item.id}</td>
                  <td className="text-center">{formatDateDisplay(item.date)}</td>
                  <td style={{ fontWeight: 600 }}>{item.fertilizerName}</td>
                  <td className="text-right" style={{ fontWeight: 700 }}>{Number(item.qtyTon || item.qty || 0).toFixed(1)} Ton</td>
                  <td className="text-right">{salurDariDO.toFixed(1)} Ton</td>
                  <td className="text-right" style={{ fontWeight: 700, color: sisaStokDO > 0 ? '#15803d' : '#9ca3af' }}>{sisaStokDO.toFixed(1)} Ton</td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {sisaStokDO > 0 && (
                        <button
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '3px 7px', backgroundColor: '#15803d' }}
                          onClick={() => onOpenNextStage('penyaluran', item)}
                          title="Lanjut Penyaluran Ke Kios dari DO ini"
                        >
                          + Salur Kios
                        </button>
                      )}
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onEdit('do', item)}>Edit</button>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onOpenPrint(item, 'do')}>Cetak</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDelete('do', item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                Belum ada data pengeluaran DO.
              </td></tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 800, backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={5} style={{ textAlign: 'right', padding: '10px 14px' }}>TOTAL KESELURUHAN:</td>
                <td className="text-right" style={{ color: '#0369a1' }}>
                  {filtered.reduce((s, i) => s + Number(i.qtyTon || i.qty || 0), 0).toFixed(1)} Ton
                </td>
                <td className="text-right" style={{ color: '#475569' }}>
                  {filtered.reduce((sum, item) => {
                    const salur = (penyaluranList || []).filter(p => p && (p.doNo === item.doNo || p.doRefId === item.id)).reduce((s, p) => s + Number(p.qtyTon || p.qty || 0), 0);
                    return sum + salur;
                  }, 0).toFixed(1)} Ton
                </td>
                <td className="text-right" style={{ color: '#15803d' }}>
                  {filtered.reduce((sum, item) => {
                    const salur = (penyaluranList || []).filter(p => p && (p.doNo === item.doNo || p.doRefId === item.id)).reduce((s, p) => s + Number(p.qtyTon || p.qty || 0), 0);
                    const sisa = Math.max(0, Number(item.qtyTon || item.qty || 0) - salur);
                    return sum + sisa;
                  }, 0).toFixed(1)} Ton
                </td>
                <td></td>
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

      <ModalDetailTransaksi 
        isOpen={Boolean(detailModalItem)}
        onClose={() => setDetailModalItem(null)}
        data={detailModalItem}
        type="do"
      />
    </div>
  );
}
