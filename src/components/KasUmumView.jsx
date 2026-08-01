import React, { useState } from 'react';
import { formatCurrencyInput, parseCurrencyInput, formatDateDisplay } from '../utils/currency';
import DateFilterBar, { matchesDateFilter } from './DateFilterBar';
import { useSortableTable, SortIcon } from '../utils/useSortableTable';
import { usePagination } from '../utils/usePagination';
import TablePagination from './TablePagination';

export default function KasUmumView({
  selectedBranch,
  kasUmumList = [],
  onAddKasUmum,
  onDeleteKasUmum,
  settings
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterState, setFilterState] = useState({
    mode: 'all', dailyDate: '', startDate: '', endDate: '', month: '',
    year: new Date().getFullYear().toString()
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [branch, setBranch] = useState(selectedBranch === 'ALL' ? (settings.branch1Name || 'Magetan') : selectedBranch);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Pengeluaran'); // 'Pemasukan' | 'Pengeluaran'
  const [category, setCategory] = useState('Operasional Kantor'); 
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const getItemAmount = (item) => {
    if (!item) return 0;
    const num = Number(item.amount);
    return (!isNaN(num) && num > 0) ? num : 0;
  };

  const filtered = kasUmumList.filter(item => {
    const itemBranch = (item.branch || '').toLowerCase();
    const matchBranch = selectedBranch === 'ALL' || itemBranch === selectedBranch.toLowerCase();
    const matchSearch = (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.recipient || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.description || item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = matchesDateFilter(item.date, filterState);
    return matchBranch && matchSearch && matchDate;
  });

  const { sorted, sortKey, sortDir, thProps } = useSortableTable(filtered, 'date', 'desc');
  const { currentPage, setCurrentPage, totalPages, paginatedData, itemsPerPage, setItemsPerPage } = usePagination(sorted, 10);

  // Calculations — type already normalized to 'Pemasukan' or 'Pengeluaran' by normalizeKasUmumList
  const totalMasuk = filtered
    .filter(i => i.type === 'Pemasukan')
    .reduce((s, i) => s + getItemAmount(i), 0);

  const totalKeluar = filtered
    .filter(i => i.type !== 'Pemasukan')
    .reduce((s, i) => s + getItemAmount(i), 0);

  const saldoAkhir = totalMasuk - totalKeluar;

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setBranch(item.branch);
      setDate(item.date);
      setType(item.type);
      setCategory(item.category);
      setAmount(formatCurrencyInput(item.amount));
      setRecipient(item.recipient || '');
      setNotes(item.notes || '');
    } else {
      setEditingItem(null);
      setBranch(selectedBranch === 'ALL' ? (settings.branch1Name || 'Magetan') : selectedBranch);
      setDate(new Date().toISOString().split('T')[0]);
      setType('Pengeluaran');
      setCategory('Operasional Kantor');
      setAmount('');
      setRecipient('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmt = parseCurrencyInput(amount);
    if (!parsedAmt || parsedAmt <= 0) {
      alert('Masukkan nominal kas umum yang valid!');
      return;
    }

    const payload = {
      id: editingItem ? editingItem.id : `KAS-UMUM-${Date.now()}`,
      branch,
      date,
      type,
      category,
      amount: parsedAmt,
      recipient,
      notes
    };

    onAddKasUmum(payload, Boolean(editingItem));
    setIsModalOpen(false);
  };

  const isBranchLocked = selectedBranch !== 'ALL';

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">🏦 Kas Umum Kantor</h2>
          <p className="page-desc">Pencatatan kas masuk dan pengeluaran operasional umum kantor, gaji karyawan, listrik, ATK, & keperluan kantor lainnya.</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Catat Kas Umum
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '15px' }}>
        <div className="card" style={{ borderLeft: '4px solid #166534' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Total Pemasukan Kas Umum</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>{formatRp(totalMasuk)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Total Pengeluaran Kas Umum</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{formatRp(totalKeluar)}</div>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${saldoAkhir >= 0 ? '#15803d' : '#dc2626'}` }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Saldo Akhir Kas Umum</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: saldoAkhir >= 0 ? '#15803d' : '#dc2626', marginTop: '4px' }}>
            {formatRp(saldoAkhir)}
          </div>
        </div>
      </div>

      <div className="table-container">
        <DateFilterBar filterState={filterState} setFilterState={setFilterState} />
        
        {/* BAR PENGHAPUSAN TERPILIH */}
        {selectedIds.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
              📌 <strong>{selectedIds.length}</strong> data kas umum dipilih
            </span>
            <button 
              className="btn-danger" 
              style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}
              onClick={() => {
                if (window.confirm(`Yakin ingin menghapus ${selectedIds.length} data kas umum terpilih?`)) {
                  selectedIds.forEach(id => onDeleteKasUmum(id));
                  setSelectedIds([]);
                }
              }}
            >
              🗑️ Hapus {selectedIds.length} Data Terpilih
            </button>
          </div>
        )}

        <div className="table-toolbar">
          <input 
            type="text" 
            placeholder="Cari Kategori / Penerima / Keterangan..." 
            className="search-input"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Total: <strong>{filtered.length} Transaksi Kas</strong></span>
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
              <th {...thProps('branch')} className="sortable-th text-center">Cabang <SortIcon colKey="branch" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('date')} className="sortable-th text-center">Tanggal <SortIcon colKey="date" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('category')} className="sortable-th">Kategori <SortIcon colKey="category" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('type')} className="sortable-th text-center">Tipe Kas <SortIcon colKey="type" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('recipient')} className="sortable-th">Penerima / Sumber <SortIcon colKey="recipient" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('amount')} className="sortable-th text-right">Nominal (Rp) <SortIcon colKey="amount" sortKey={sortKey} sortDir={sortDir} /></th>
              <th>Keterangan / Catatan</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(item => (
              <tr 
                key={item.id} 
                style={{ backgroundColor: selectedIds.includes(item.id) ? '#fef2f2' : undefined, cursor: 'pointer' }}
                onClick={() => handleOpenModal(item)}
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
                <td className="text-center">
                  <span className={`badge ${item.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{item.branch}</span>
                </td>
                <td className="text-center">{formatDateDisplay(item.date)}</td>
                <td style={{ fontWeight: 600 }}>{item.category}</td>
                <td className="text-center">
                  <span className={`badge ${item.type === 'Pemasukan' ? 'badge-success' : 'badge-danger'}`}>
                    {item.type === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </td>
                <td>{item.recipient || item.penerima || '-'}</td>
                <td className="text-right" style={{ fontWeight: 800, color: item.type === 'Pemasukan' ? '#15803d' : '#dc2626' }}>
                  {formatRp(getItemAmount(item))}
                </td>
                <td style={{ fontSize: '12px' }}>{item.uraian || item.notes || item.description || item.catatan || '-'}</td>
                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => handleOpenModal(item)}>Edit</button>
                    <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDeleteKasUmum(item.id)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Belum ada transaksi Kas Umum. Klik "+ Catat Kas Umum" untuk membuat catatan baru.
                </td>
              </tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 800, backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={6} style={{ textAlign: 'right', padding: '10px 14px' }}>TOTAL SALDO KAS UMUM:</td>
                <td className="text-right" style={{
                  color: filtered.reduce((s, i) => s + (i.type === 'Pemasukan' ? Number(i.amount || 0) : -Number(i.amount || 0)), 0) >= 0 ? '#15803d' : '#dc2626'
                }}>
                  {formatRp(filtered.reduce((s, i) => s + (i.type === 'Pemasukan' ? Number(i.amount || 0) : -Number(i.amount || 0)), 0))}
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

      {/* MODAL FORM KAS UMUM */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>{editingItem ? 'Edit Transaksi Kas Umum' : 'Tambah Catatan Kas Umum'}</div>
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Tutup</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Cabang</label>
                  <select 
                    className="search-input" 
                    style={{ width: '100%', backgroundColor: isBranchLocked ? '#f3f4f6' : 'white', cursor: isBranchLocked ? 'not-allowed' : 'pointer' }} 
                    value={branch} 
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={isBranchLocked}
                  >
                    <option value="Magetan">{settings.branch1Name || 'Magetan'}</option>
                    <option value="Sragen">{settings.branch2Name || 'Sragen'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tanggal</label>
                  <input type="date" className="search-input" style={{ width: '100%' }} value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Jenis Kas</label>
                  <select className="search-input" style={{ width: '100%' }} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="Pengeluaran">Pengeluaran (Kas Keluar)</option>
                    <option value="Pemasukan">Pemasukan (Kas Masuk)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Kategori</label>
                  <select className="search-input" style={{ width: '100%' }} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Operasional Kantor">Operasional Kantor</option>
                    <option value="Gaji Pegawai">Gaji & Honor Pegawai</option>
                    <option value="Listrik, Air & Internet">Listrik, Air & Internet</option>
                    <option value="ATK & Perlengkapan">ATK & Perlengkapan Kantor</option>
                    <option value="Konsumsi & Dapur">Konsumsi & Dapur</option>
                    <option value="Kasbon Pegawai">Kasbon Pegawai</option>
                    <option value="Setoran Modal / Investor">Setoran Modal / Investor</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Penerima / Sumber Dana</label>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Nama Penerima/Pemberi..." 
                    style={{ width: '100%' }}
                    value={recipient} 
                    onChange={(e) => setRecipient(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nominal (Rp)</label>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="0" 
                    style={{ width: '100%', fontSize: '15px', fontWeight: 700 }}
                    value={amount} 
                    onChange={(e) => setAmount(formatCurrencyInput(e.target.value))} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Keterangan Detail</label>
                <textarea 
                  className="search-input" 
                  rows={2} 
                  placeholder="Deskripsi transaksi kas umum..." 
                  style={{ width: '100%' }}
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Transaksi Kas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
