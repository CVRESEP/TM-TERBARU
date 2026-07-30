import React, { useState, useEffect } from 'react';
import { formatCurrencyInput, parseCurrencyInput, formatDateDisplay } from '../utils/currency';
import DateFilterBar, { matchesDateFilter } from './DateFilterBar';
import { useSortableTable, SortIcon } from '../utils/useSortableTable';
import { usePagination } from '../utils/usePagination';
import TablePagination from './TablePagination';

const DEFAULT_TRANSPORT_RATES = {
  rateType: 'perTon',
  adminRate: 2000,
  uangMakanRate: 0,
  palangRate: 0,
  solarRate: 4166.625,
  upahSopirRate: 3500,
  lemburRate: 0,
  helperRate: 0,
};

export default function KasAngkutanView({
  selectedBranch,
  kasAngkutanList = [],
  drivers = [],
  penyaluranList = [],
  doList = [],
  onAddKasAngkutan,
  onDeleteKasAngkutan,
  settings = {},
  onSaveSettings
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterState, setFilterState] = useState({
    mode: 'all', dailyDate: '', startDate: '', endDate: '', month: '',
    year: new Date().getFullYear().toString()
  });

  // Transport Rates Settings Modal
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [rates, setRates] = useState(settings.transportRates || DEFAULT_TRANSPORT_RATES);

  useEffect(() => {
    if (settings.transportRates) {
      setRates(settings.transportRates);
    }
  }, [settings.transportRates]);

  // Main Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State (Matching Screenshot exactly)
  const [kabupaten, setKabupaten] = useState(selectedBranch === 'ALL' ? (settings.branch1Name || 'MAGETAN').toUpperCase() : selectedBranch.toUpperCase());
  const [doNo, setDoNo] = useState('');
  const [penyaluranNo, setPenyaluranNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('PENGELUARAN');
  const [kiosName, setKiosName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [uraian, setUraian] = useState('');

  // Cost Breakdown Fields
  const [adminCost, setAdminCost] = useState('0');
  const [uangMakanCost, setUangMakanCost] = useState('0');
  const [palangCost, setPalangCost] = useState('0');
  const [solarCost, setSolarCost] = useState('0');
  const [upahSopirCost, setUpahSopirCost] = useState('0');
  const [lemburCost, setLemburCost] = useState('0');
  const [helperCost, setHelperCost] = useState('0');
  const [lainLainCost, setLainLainCost] = useState('0');

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // Auto-calculated Total Nominal sum
  const totalNominal = 
    parseCurrencyInput(adminCost) +
    parseCurrencyInput(uangMakanCost) +
    parseCurrencyInput(palangCost) +
    parseCurrencyInput(solarCost) +
    parseCurrencyInput(upahSopirCost) +
    parseCurrencyInput(lemburCost) +
    parseCurrencyInput(helperCost) +
    parseCurrencyInput(lainLainCost);

  const filtered = kasAngkutanList.filter(item => {
    const matchBranch = selectedBranch === 'ALL' || (item.kabupaten || item.branch || '').toUpperCase() === selectedBranch.toUpperCase();
    const matchSearch = (item.doNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.penyaluranNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.kiosName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.uraian || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = matchesDateFilter(item.date, filterState);
    return matchBranch && matchSearch && matchDate;
  });

  const { sorted, sortKey, sortDir, thProps } = useSortableTable(filtered, 'date', 'desc');
  const { currentPage, setCurrentPage, totalPages, paginatedData, itemsPerPage, setItemsPerPage } = usePagination(sorted, 10);

  // Totals
  const totalPengeluaran = filtered.filter(i => (i.type || 'PENGELUARAN') === 'PENGELUARAN').reduce((s, i) => s + Number(i.nominal || i.amount || 0), 0);
  const totalPemasukan = filtered.filter(i => (i.type || 'PENGELUARAN') === 'PEMASUKAN').reduce((s, i) => s + Number(i.nominal || i.amount || 0), 0);
  const saldoKas = totalPemasukan - totalPengeluaran;

  // Auto-fill form when a Penyaluran transaction is selected
  const handleSelectPenyaluran = (refNo) => {
    setPenyaluranNo(refNo);
    if (!refNo) return;

    const foundSalur = penyaluranList.find(s => (s.penyaluranNo || s.doNo || s.id) === refNo || s.id === refNo);
    if (foundSalur) {
      const bName = (foundSalur.branch || settings.branch1Name || 'MAGETAN').toUpperCase();
      const dNo = foundSalur.doNo || '';
      const dt = foundSalur.date || new Date().toISOString().split('T')[0];
      const kN = foundSalur.kiosName || '';
      
      // Driver lookup from DO if not directly set
      let drv = foundSalur.driverName || '';
      if (!drv && dNo) {
        const foundDO = doList.find(d => d.doNo === dNo);
        if (foundDO) drv = foundDO.driverName || '';
      }

      const qty = Number(foundSalur.qtyTon || foundSalur.qty || 0);
      const prodName = (foundSalur.fertilizerName || 'PUPUK').toUpperCase();
      const autoUraian = `BIAYA ANGKUTAN - ${refNo} - ${prodName} ${bName} - ${kN.toUpperCase()} - ${qty}`;

      setKabupaten(bName);
      setDoNo(dNo);
      setDate(dt);
      setKiosName(kN);
      setDriverName(drv);
      setUraian(autoUraian);

      // Auto calculate costs based on rates
      const curRates = settings.transportRates || DEFAULT_TRANSPORT_RATES;
      const isPerTon = curRates.rateType === 'perTon';
      const multiplier = isPerTon ? qty : 1;

      setAdminCost(formatCurrencyInput(Math.round((curRates.adminRate || 0) * multiplier)));
      setUangMakanCost(formatCurrencyInput(Math.round((curRates.uangMakanRate || 0) * multiplier)));
      setPalangCost(formatCurrencyInput(Math.round((curRates.palangRate || 0) * multiplier)));
      setSolarCost(formatCurrencyInput(Math.round((curRates.solarRate || 0) * multiplier)));
      setUpahSopirCost(formatCurrencyInput(Math.round((curRates.upahSopirRate || 0) * multiplier)));
      setLemburCost(formatCurrencyInput(Math.round((curRates.lemburRate || 0) * multiplier)));
      setHelperCost(formatCurrencyInput(Math.round((curRates.helperRate || 0) * multiplier)));
      setLainLainCost('0');
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setKabupaten(item.kabupaten || item.branch || 'MAGETAN');
      setDoNo(item.doNo || '');
      setPenyaluranNo(item.penyaluranNo || '');
      setDate(item.date || new Date().toISOString().split('T')[0]);
      setType(item.type || 'PENGELUARAN');
      setKiosName(item.kiosName || '');
      setDriverName(item.driverName || '');
      setUraian(item.uraian || '');
      setAdminCost(formatCurrencyInput(item.admin || 0));
      setUangMakanCost(formatCurrencyInput(item.uangMakan || 0));
      setPalangCost(formatCurrencyInput(item.palang || 0));
      setSolarCost(formatCurrencyInput(item.solar || 0));
      setUpahSopirCost(formatCurrencyInput(item.upahSopir || 0));
      setLemburCost(formatCurrencyInput(item.lembur || 0));
      setHelperCost(formatCurrencyInput(item.helper || 0));
      setLainLainCost(formatCurrencyInput(item.lainLain || 0));
    } else {
      setEditingItem(null);
      const defaultKab = selectedBranch === 'ALL' ? (settings.branch1Name || 'MAGETAN').toUpperCase() : selectedBranch.toUpperCase();
      setKabupaten(defaultKab);
      setDoNo('');
      setPenyaluranNo('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('PENGELUARAN');
      setKiosName('');
      setDriverName('');
      setUraian('');

      // Apply initial defaults if available
      const curRates = settings.transportRates || DEFAULT_TRANSPORT_RATES;
      setAdminCost(formatCurrencyInput(curRates.adminRate || 0));
      setUangMakanCost(formatCurrencyInput(curRates.uangMakanRate || 0));
      setPalangCost(formatCurrencyInput(curRates.palangRate || 0));
      setSolarCost(formatCurrencyInput(curRates.solarRate || 0));
      setUpahSopirCost(formatCurrencyInput(curRates.upahSopirRate || 0));
      setLemburCost(formatCurrencyInput(curRates.lemburRate || 0));
      setHelperCost(formatCurrencyInput(curRates.helperRate || 0));
      setLainLainCost('0');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalNominal <= 0) {
      alert('Total nominal pengeluaran kas angkutan tidak boleh 0!');
      return;
    }

    const payload = {
      id: editingItem ? editingItem.id : `KAS-ANGKUT-${Date.now()}`,
      kabupaten,
      branch: kabupaten,
      doNo,
      penyaluranNo,
      date,
      type,
      kiosName,
      driverName,
      uraian,
      nominal: totalNominal,
      amount: totalNominal,
      admin: parseCurrencyInput(adminCost),
      uangMakan: parseCurrencyInput(uangMakanCost),
      palang: parseCurrencyInput(palangCost),
      solar: parseCurrencyInput(solarCost),
      upahSopir: parseCurrencyInput(upahSopirCost),
      lembur: parseCurrencyInput(lemburCost),
      helper: parseCurrencyInput(helperCost),
      lainLain: parseCurrencyInput(lainLainCost),
    };

    onAddKasAngkutan(payload, Boolean(editingItem));
    setIsModalOpen(false);
  };

  const handleSaveRatesSetting = (e) => {
    e.preventDefault();
    const updatedSettings = {
      ...settings,
      transportRates: rates
    };
    if (onSaveSettings) onSaveSettings(updatedSettings);
    setIsRatesModalOpen(false);
    alert('Pengaturan Tarif/Biaya Angkutan berhasil disimpan!');
  };

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">🚚 Kas Angkutan</h2>
          <p className="page-desc">Otomatisasi pencatatan beban angkutan per penyaluran (Admin, Solar, Upah Sopir, Uang Makan, Palang, Lembur, Helper).</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" style={{ backgroundColor: '#fff', border: '1px solid #166534', color: '#166534', fontWeight: 700 }} onClick={() => setIsRatesModalOpen(true)}>
            ⚙️ Pengaturan Tarif Biaya
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            + Tambah Data Kas Angkutan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '15px' }}>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Total Pengeluaran Kas Angkutan</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{formatRp(totalPengeluaran)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #166534' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Total Pemasukan / Reimburse</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>{formatRp(totalPemasukan)}</div>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${saldoKas >= 0 ? '#15803d' : '#dc2626'}` }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Saldo Kas Angkutan</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: saldoKas >= 0 ? '#15803d' : '#dc2626', marginTop: '4px' }}>
            {formatRp(saldoKas)}
          </div>
        </div>
      </div>

      <div className="table-container">
        <DateFilterBar filterState={filterState} setFilterState={setFilterState} />
        
        {/* BAR PENGHAPUSAN TERPILIH */}
        {selectedIds.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
              📌 <strong>{selectedIds.length}</strong> data kas angkutan dipilih
            </span>
            <button 
              className="btn-danger" 
              style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}
              onClick={() => {
                if (window.confirm(`Yakin ingin menghapus ${selectedIds.length} data kas angkutan terpilih?`)) {
                  selectedIds.forEach(id => onDeleteKasAngkutan(id));
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
            placeholder="Cari No. DO / No. Penyaluran / Kios / Sopir / Uraian..." 
            className="search-input"
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>Total: <strong>{filtered.length} Data Kas</strong></span>
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
              <th {...thProps('kabupaten')} className="sortable-th text-center">Kabupaten <SortIcon colKey="kabupaten" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('date')} className="sortable-th text-center">Tanggal <SortIcon colKey="date" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('doNo')} className="sortable-th" style={{ backgroundColor: '#dcfce7' }}>No. DO <SortIcon colKey="doNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('penyaluranNo')} className="sortable-th">No. Penyaluran <SortIcon colKey="penyaluranNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('kiosName')} className="sortable-th">Nama Kios <SortIcon colKey="kiosName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('driverName')} className="sortable-th">Nama Sopir <SortIcon colKey="driverName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('uraian')} className="sortable-th">Uraian Transaksi <SortIcon colKey="uraian" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('nominal')} className="sortable-th text-right">Nominal (Total) <SortIcon colKey="nominal" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(item => (
              <tr key={item.id} style={{ backgroundColor: selectedIds.includes(item.id) ? '#fef2f2' : undefined }}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item.id)}
                    onChange={() => {
                      setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]);
                    }}
                  />
                </td>
                <td className="text-center">
                  <span className={`badge ${(item.kabupaten || item.branch || '').toUpperCase() === 'MAGETAN' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>
                    {item.kabupaten || item.branch}
                  </span>
                </td>
                <td className="text-center">{formatDateDisplay(item.date)}</td>
                <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{item.doNo || '-'}</td>
                <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{item.penyaluranNo || '-'}</td>
                <td style={{ fontWeight: 600 }}>{item.kiosName || '-'}</td>
                <td>{item.driverName || '-'}</td>
                <td style={{ fontSize: '12px' }}>{item.uraian || '-'}</td>
                <td className="text-right" style={{ fontWeight: 800, color: (item.type || 'PENGELUARAN') === 'PEMASUKAN' ? '#15803d' : '#dc2626' }}>
                  {formatRp(item.nominal || item.amount)}
                </td>
                <td className="text-center">
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => handleOpenModal(item)}>Edit</button>
                    <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDeleteKasAngkutan(item.id)}>Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Belum ada transaksi Kas Angkutan. Klik "+ Tambah Data Kas Angkutan" untuk membuat catatan baru.
                </td>
              </tr>
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

      {/* MODAL FORM TAMBAH DATA KAS ANGKUTAN (EXACT SCREENSHOT LAYOUT) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#111827', letterSpacing: '0.5px' }}>
                {editingItem ? 'EDIT DATA KAS ANGKUTAN' : 'TAMBAH DATA KAS ANGKUTAN'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#ffffff' }}>
              {/* Row 1: KABUPATEN & NO DO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>KABUPATEN</label>
                  <select 
                    className="search-input" 
                    style={{ width: '100%', textTransform: 'uppercase', fontWeight: 600 }} 
                    value={kabupaten} 
                    onChange={(e) => setKabupaten(e.target.value)}
                  >
                    <option value="MAGETAN">{settings.branch1Name || 'MAGETAN'}</option>
                    <option value="SRAGEN">{settings.branch2Name || 'SRAGEN'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>NO DO</label>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Nomor DO..." 
                    style={{ width: '100%', fontWeight: 700 }} 
                    value={doNo} 
                    onChange={(e) => setDoNo(e.target.value)} 
                    list="do-options"
                  />
                  <datalist id="do-options">
                    {doList.map(d => <option key={d.id} value={d.doNo} />)}
                  </datalist>
                </div>
              </div>

              {/* Row 2: NO PENYALURAN & TANGGAL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                    NO PENYALURAN (OTOMATIS)
                  </label>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Pilih atau ketik No. Penyaluran..." 
                    style={{ width: '100%', fontWeight: 700, borderColor: '#22c55e' }} 
                    value={penyaluranNo} 
                    onChange={(e) => handleSelectPenyaluran(e.target.value)} 
                    list="salur-options"
                  />
                  <datalist id="salur-options">
                    {penyaluranList.map(s => <option key={s.id} value={s.penyaluranNo || s.doNo || s.id}>{s.kiosName} - {s.fertilizerName} ({s.qtyTon}T)</option>)}
                  </datalist>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>TANGGAL</label>
                  <input type="date" className="search-input" style={{ width: '100%' }} value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>

              {/* Row 3: TIPE PENGELUARAN & NAMA KIOS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>TIPE PENGELUARAN</label>
                  <select className="search-input" style={{ width: '100%', fontWeight: 700 }} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="PENGELUARAN">PENGELUARAN</option>
                    <option value="PEMASUKAN">PEMASUKAN / REIMBURSE</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>NAMA KIOS</label>
                  <input type="text" className="search-input" placeholder="Nama Kios..." style={{ width: '100%', fontWeight: 600 }} value={kiosName} onChange={(e) => setKiosName(e.target.value)} />
                </div>
              </div>

              {/* Row 4: NAMA SOPIR */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>NAMA SOPIR</label>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Nama Sopir..." 
                  style={{ width: '100%', fontWeight: 600 }} 
                  value={driverName} 
                  onChange={(e) => setDriverName(e.target.value)} 
                  list="driver-options"
                />
                <datalist id="driver-options">
                  {drivers.map(d => <option key={d.id} value={d.name} />)}
                </datalist>
              </div>

              {/* Row 5: URAIAN */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>URAIAN</label>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="BIAYA ANGKUTAN - ..." 
                  style={{ width: '100%', fontWeight: 600, fontSize: '13px' }} 
                  value={uraian} 
                  onChange={(e) => setUraian(e.target.value)} 
                />
              </div>

              {/* Row 6: NOMINAL (TOTAL) */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>NOMINAL (TOTAL JUMLAH BIAYA)</label>
                <input 
                  type="text" 
                  className="search-input" 
                  readOnly 
                  style={{ width: '100%', fontSize: '15px', fontWeight: 800, backgroundColor: '#f9fafb', color: '#15803d' }} 
                  value={formatCurrencyInput(totalNominal)} 
                />
              </div>

              {/* COST BREAKDOWN GRID (EXACT SCREENSHOT INPUTS) */}
              <div style={{
                backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.5px' }}>RINCIAN BIAYA ANGKUTAN</div>
                
                {/* Admin & Uang Makan */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>ADMIN</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={adminCost} onChange={(e) => setAdminCost(formatCurrencyInput(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>UANG MAKAN</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={uangMakanCost} onChange={(e) => setUangMakanCost(formatCurrencyInput(e.target.value))} />
                  </div>
                </div>

                {/* Palang & Solar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>PALANG</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={palangCost} onChange={(e) => setPalangCost(formatCurrencyInput(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>SOLAR</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={solarCost} onChange={(e) => setSolarCost(formatCurrencyInput(e.target.value))} />
                  </div>
                </div>

                {/* Upah Sopir & Lembur */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>UPAH SOPIR</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={upahSopirCost} onChange={(e) => setUpahSopirCost(formatCurrencyInput(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>LEMBUR</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={lemburCost} onChange={(e) => setLemburCost(formatCurrencyInput(e.target.value))} />
                  </div>
                </div>

                {/* Helper & Lain-lain */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>HELPER</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={helperCost} onChange={(e) => setHelperCost(formatCurrencyInput(e.target.value))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>LAIN-LAIN</label>
                    <input type="text" className="search-input" style={{ width: '100%', backgroundColor: '#fff' }} value={lainLainCost} onChange={(e) => setLainLainCost(formatCurrencyInput(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#f1f5f9', border: 'none', color: '#334155',
                    padding: '8px 18px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                  }}
                >
                  BATAL
                </button>
                <button 
                  type="submit" 
                  style={{
                    backgroundColor: '#38bdf8', border: 'none', color: '#ffffff',
                    padding: '8px 22px', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
                  }}
                >
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN TARIF BIAYA ANGKUTAN */}
      {isRatesModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 800 }}>⚙️ Pengaturan Standar Tarif Biaya Angkutan</div>
              <button className="btn-secondary" onClick={() => setIsRatesModalOpen(false)}>Tutup</button>
            </div>
            <form onSubmit={handleSaveRatesSetting} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Pengaturan standar biaya ini akan otomatis dikalkulasikan saat Anda memilih nomor penyaluran pada form Tambah Kas Angkutan.
              </p>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Metode Kalkulasi</label>
                <select 
                  className="search-input" 
                  style={{ width: '100%' }}
                  value={rates.rateType || 'perTon'}
                  onChange={(e) => setRates({ ...rates, rateType: e.target.value })}
                >
                  <option value="perTon">Per Ton (Dikalikan Qty Ton Penyaluran)</option>
                  <option value="flat">Nominal Flat Per Trip</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tarif Admin (Rp)</label>
                  <input type="number" className="search-input" style={{ width: '100%' }} value={rates.adminRate || 0} onChange={(e) => setRates({ ...rates, adminRate: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tarif Uang Makan (Rp)</label>
                  <input type="number" className="search-input" style={{ width: '100%' }} value={rates.uangMakanRate || 0} onChange={(e) => setRates({ ...rates, uangMakanRate: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tarif Palang (Rp)</label>
                  <input type="number" className="search-input" style={{ width: '100%' }} value={rates.palangRate || 0} onChange={(e) => setRates({ ...rates, palangRate: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tarif Solar (Rp)</label>
                  <input type="number" step="any" className="search-input" style={{ width: '100%' }} value={rates.solarRate || 0} onChange={(e) => setRates({ ...rates, solarRate: Number(e.target.value) })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tarif Upah Sopir (Rp)</label>
                  <input type="number" className="search-input" style={{ width: '100%' }} value={rates.upahSopirRate || 0} onChange={(e) => setRates({ ...rates, upahSopirRate: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tarif Lembur (Rp)</label>
                  <input type="number" className="search-input" style={{ width: '100%' }} value={rates.lemburRate || 0} onChange={(e) => setRates({ ...rates, lemburRate: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tarif Helper (Rp)</label>
                <input type="number" className="search-input" style={{ width: '100%' }} value={rates.helperRate || 0} onChange={(e) => setRates({ ...rates, helperRate: Number(e.target.value) })} />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsRatesModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Pengaturan Tarif</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
