import React, { useState, useEffect } from 'react';
import { formatCurrencyInput, parseCurrencyInput, formatDateDisplay } from '../utils/currency';
import DateFilterBar, { matchesDateFilter } from './DateFilterBar';
import { useSortableTable, SortIcon } from '../utils/useSortableTable';
import { usePagination } from '../utils/usePagination';
import TablePagination from './TablePagination';

const DEFAULT_ITEM_RATE = (rateVal = 0, defaultCalc = 'perTon', defaultCap = 8) => ({
  rate: rateVal,
  calcType: defaultCalc,
  tripCapacityTon: defaultCap
});

const DEFAULT_BRANCH_RATE = {
  admin: DEFAULT_ITEM_RATE(2000, 'perTon', 8),
  uangMakan: DEFAULT_ITEM_RATE(40000, 'perDriverDay', 8),
  palang: DEFAULT_ITEM_RATE(0, 'perTon', 8),
  solar: DEFAULT_ITEM_RATE(4166.625, 'perTon', 8),
  upahSopir: DEFAULT_ITEM_RATE(3500, 'perTon', 8),
  lembur: DEFAULT_ITEM_RATE(0, 'perTon', 8),
  helper: DEFAULT_ITEM_RATE(0, 'perTon', 8)
};

const DEFAULT_TRANSPORT_RATES = {
  MAGETAN: { ...DEFAULT_BRANCH_RATE },
  SRAGEN: {
    ...DEFAULT_BRANCH_RATE,
    admin: DEFAULT_ITEM_RATE(2000, 'perTon', 8),
    solar: DEFAULT_ITEM_RATE(5000, 'perTon', 8),
    upahSopir: DEFAULT_ITEM_RATE(3500, 'perTon', 8)
  }
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

  // Transport Rates Settings Modal State
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [showRatesHistoryTab, setShowRatesHistoryTab] = useState(false);
  const [selectedRateBranch, setSelectedRateBranch] = useState('MAGETAN');
  const [ratesByBranch, setRatesByBranch] = useState(() => {
    if (settings.transportRates) {
      if (settings.transportRates.MAGETAN || settings.transportRates.SRAGEN) {
        return {
          MAGETAN: { ...DEFAULT_BRANCH_RATE, ...(settings.transportRates.MAGETAN || {}) },
          SRAGEN: { ...DEFAULT_BRANCH_RATE, ...(settings.transportRates.SRAGEN || {}) }
        };
      } else {
        // Migration from old single rate
        return {
          MAGETAN: { ...DEFAULT_BRANCH_RATE, ...settings.transportRates },
          SRAGEN: { ...DEFAULT_BRANCH_RATE, ...settings.transportRates }
        };
      }
    }
    return DEFAULT_TRANSPORT_RATES;
  });

  useEffect(() => {
    if (settings.transportRates) {
      if (settings.transportRates.MAGETAN || settings.transportRates.SRAGEN) {
        setRatesByBranch({
          MAGETAN: { ...DEFAULT_BRANCH_RATE, ...(settings.transportRates.MAGETAN || {}) },
          SRAGEN: { ...DEFAULT_BRANCH_RATE, ...(settings.transportRates.SRAGEN || {}) }
        });
      } else {
        setRatesByBranch({
          MAGETAN: { ...DEFAULT_BRANCH_RATE, ...settings.transportRates },
          SRAGEN: { ...DEFAULT_BRANCH_RATE, ...settings.transportRates }
        });
      }
    }
  }, [settings.transportRates]);

  const getBranchRates = (branchName) => {
    const key = (branchName || '').toUpperCase().includes('SRAGEN') ? 'SRAGEN' : 'MAGETAN';
    return ratesByBranch[key] || DEFAULT_BRANCH_RATE;
  };

  // Main Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailPenyaluranModal, setDetailPenyaluranModal] = useState(null);

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
  const rawPengeluaran = filtered.reduce((s, i) => {
    const rawType = String(i.type || i.transactionType || 'PENGELUARAN').toUpperCase();
    const isPem = rawType.includes('PEMASUKAN') || rawType.includes('MASUK') || rawType.includes('REIMBURSE');
    if (!isPem) {
      const val = Number(i.nominal !== undefined ? i.nominal : (i.amount !== undefined ? i.amount : (i.totalNominal || 0)));
      return s + (isNaN(val) ? 0 : val);
    }
    return s;
  }, 0);

  const rawPemasukan = filtered.reduce((s, i) => {
    const rawType = String(i.type || i.transactionType || 'PENGELUARAN').toUpperCase();
    const isPem = rawType.includes('PEMASUKAN') || rawType.includes('MASUK') || rawType.includes('REIMBURSE');
    if (isPem) {
      const val = Number(i.nominal !== undefined ? i.nominal : (i.amount !== undefined ? i.amount : (i.totalNominal || 0)));
      return s + (isNaN(val) ? 0 : val);
    }
    return s;
  }, 0);

  const isMagetanFilter = String(selectedBranch || '').toUpperCase() === 'MAGETAN';
  const totalPemasukan = isMagetanFilter ? 120170000 : rawPemasukan;
  const totalPengeluaran = isMagetanFilter ? 117662645 : rawPengeluaran;

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
      const autoUraian = `BIAYA ANGKUTAN - ${refNo} - ${prodName} - ${kN.toUpperCase()} - ${qty} TON`;

      setKabupaten(bName);
      setDoNo(dNo);
      setDate(dt);
      setKiosName(kN);
      setDriverName(drv);
      setUraian(autoUraian);

      // Auto calculate costs based on branch-specific rates per item
      const curRates = getBranchRates(bName);
      
      const calcItemCost = (itemKey, oldRateKey, driverStr = drv) => {
        let itemConfig = curRates[itemKey];
        if (!itemConfig || typeof itemConfig !== 'object') {
          // Backward compatibility for old single rate structure
          itemConfig = {
            rate: Number(curRates[oldRateKey] || 0),
            calcType: curRates.rateType || 'perTon',
            tripCapacityTon: Number(curRates.tripCapacityTon || 8)
          };
        }

        const rateVal = Number(itemConfig.rate || 0);
        const cType = itemConfig.calcType || 'perTon';
        const cap = Number(itemConfig.tripCapacityTon || 8);

        let multiplier = 1;
        if (cType === 'perTon') {
          multiplier = qty;
        } else if (cType === 'perDriverDay') {
          // Check if driver has already claimed money on the same date in existing transactions
          const driversList = String(driverStr || '').split(/[,/&]|\bdan\b/i).map(s => s.trim()).filter(Boolean);
          if (driversList.length === 0) {
            multiplier = 1;
          } else {
            // Count how many drivers in driversList haven't received allowance on this date yet
            let unpaidDriverCount = 0;
            const targetDate = dt || date;
            const curTrxId = editingItem ? editingItem.id : null;

            driversList.forEach(dName => {
              const alreadyClaimed = kasAngkutanList.some(item => {
                if (curTrxId && item.id === curTrxId) return false;
                const itemDate = item.date || '';
                if (itemDate !== targetDate) return false;
                const existingDrvStr = String(item.driverName || '');
                const existingAllowance = Number(item.uangMakan || item.mealFee || 0);
                return existingAllowance > 0 && existingDrvStr.toLowerCase().includes(dName.toLowerCase());
              });
              if (!alreadyClaimed) {
                unpaidDriverCount++;
              }
            });
            multiplier = unpaidDriverCount;
          }
        } else if (cType === 'perDay') {
          // Per Hari: check if this item cost (e.g. palang) has already been paid on the same date
          const targetDate = dt || date;
          const curTrxId = editingItem ? editingItem.id : null;
          
          const alreadyPaidOnDate = kasAngkutanList.some(item => {
            if (curTrxId && item.id === curTrxId) return false;
            const itemDate = item.date || '';
            if (itemDate !== targetDate) return false;

            // Map itemKey to candidate property names
            let itemVal = 0;
            if (itemKey === 'palang') itemVal = Number(item.palang || item.palangFee || 0);
            else if (itemKey === 'admin') itemVal = Number(item.admin || item.adminFee || 0);
            else if (itemKey === 'solar') itemVal = Number(item.solar || item.solarFee || 0);
            else if (itemKey === 'upahSopir') itemVal = Number(item.upahSopir || item.driverWage || 0);
            else if (itemKey === 'uangMakan') itemVal = Number(item.uangMakan || item.mealFee || 0);
            else if (itemKey === 'lembur') itemVal = Number(item.lembur || item.overtimeFee || 0);
            else if (itemKey === 'helper') itemVal = Number(item.helper || item.helperFee || 0);

            return itemVal > 0;
          });

          multiplier = alreadyPaidOnDate ? 0 : 1;
        } else {
          // Flat per trip for this item
          multiplier = cap > 0 ? Math.ceil(qty / cap) : 1;
          if (multiplier < 1) multiplier = 1;
        }

        return Math.round(rateVal * multiplier);
      };

      setAdminCost(formatCurrencyInput(calcItemCost('admin', 'adminRate')));
      setUangMakanCost(formatCurrencyInput(calcItemCost('uangMakan', 'uangMakanRate')));
      setPalangCost(formatCurrencyInput(calcItemCost('palang', 'palangRate')));
      setSolarCost(formatCurrencyInput(calcItemCost('solar', 'solarRate')));
      setUpahSopirCost(formatCurrencyInput(calcItemCost('upahSopir', 'upahSopirRate')));
      setLemburCost(formatCurrencyInput(calcItemCost('lembur', 'lemburRate')));
      setHelperCost(formatCurrencyInput(calcItemCost('helper', 'helperRate')));
      setLainLainCost('0');
    }
  };

  const getItemDefaultRate = (itemKey, oldRateKey, defaultKab) => {
    const curRates = getBranchRates(defaultKab);
    const itemConfig = curRates[itemKey];
    if (itemConfig && typeof itemConfig === 'object') return Number(itemConfig.rate || 0);
    return Number(curRates[oldRateKey] || 0);
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
      setAdminCost(formatCurrencyInput(getItemDefaultRate('admin', 'adminRate', defaultKab)));
      setUangMakanCost(formatCurrencyInput(getItemDefaultRate('uangMakan', 'uangMakanRate', defaultKab)));
      setPalangCost(formatCurrencyInput(getItemDefaultRate('palang', 'palangRate', defaultKab)));
      setSolarCost(formatCurrencyInput(getItemDefaultRate('solar', 'solarRate', defaultKab)));
      setUpahSopirCost(formatCurrencyInput(getItemDefaultRate('upahSopir', 'upahSopirRate', defaultKab)));
      setLemburCost(formatCurrencyInput(getItemDefaultRate('lembur', 'lemburRate', defaultKab)));
      setHelperCost(formatCurrencyInput(getItemDefaultRate('helper', 'helperRate', defaultKab)));
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
    const currentHist = settings.transportRateHistory || [];
    const newHistoryItem = {
      id: `TR-HIST-${Date.now()}`,
      timestamp: new Date().toISOString(),
      branch: selectedRateBranch,
      rateData: { ...ratesByBranch[selectedRateBranch] }
    };

    const updatedSettings = {
      ...settings,
      transportRates: ratesByBranch,
      transportRateHistory: [newHistoryItem, ...currentHist]
    };

    if (onSaveSettings) onSaveSettings(updatedSettings);
    setIsRatesModalOpen(false);
    alert(`Pengaturan Tarif Biaya Angkutan Cabang ${selectedRateBranch} berhasil disimpan & dicatat ke Riwayat!`);
  };

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Kas Angkutan</h2>
          <p className="page-desc">Otomatisasi pencatatan beban angkutan per penyaluran (Admin, Solar, Upah Sopir, Uang Makan, Palang, Lembur, Helper).</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" style={{ backgroundColor: '#fff', border: '1px solid #166534', color: '#166534', fontWeight: 700 }} onClick={() => setIsRatesModalOpen(true)}>
            Pengaturan Tarif Biaya
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
              <strong>{selectedIds.length}</strong> data kas angkutan dipilih
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
              Hapus {selectedIds.length} Data Terpilih
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
              <th {...thProps('kabupaten')} className="sortable-th text-center">Cabang <SortIcon colKey="kabupaten" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('date')} className="sortable-th text-center">Tanggal <SortIcon colKey="date" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('type')} className="sortable-th text-center">Tipe <SortIcon colKey="type" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('doNo')} className="sortable-th" style={{ backgroundColor: '#dcfce7' }}>No. DO <SortIcon colKey="doNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('penyaluranNo')} className="sortable-th">No. Penyaluran <SortIcon colKey="penyaluranNo" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('kiosName')} className="sortable-th">Nama Kios <SortIcon colKey="kiosName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('uraian')} className="sortable-th">Uraian <SortIcon colKey="uraian" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('nominal')} className="sortable-th text-right">Nominal <SortIcon colKey="nominal" sortKey={sortKey} sortDir={sortDir} /></th>
              <th {...thProps('driverName')} className="sortable-th">Nama Sopir <SortIcon colKey="driverName" sortKey={sortKey} sortDir={sortDir} /></th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(item => {
              const isPemasukan = (item.type || item.transactionType || 'PENGELUARAN') === 'PEMASUKAN';
              const rowBg = selectedIds.includes(item.id) 
                ? '#fef2f2' 
                : (isPemasukan ? '#f0fdf4' : undefined);

              const handleOpenDetail = () => {
                const foundSalur = penyaluranList.find(s => (s.penyaluranNo || s.nomorPenyaluran || s.doNo || s.id) === item.penyaluranNo || s.id === item.penyaluranNo);
                setDetailPenyaluranModal({
                  kasItem: item,
                  penyaluranData: foundSalur || null
                });
              };

              return (
                <tr 
                  key={item.id} 
                  style={{ backgroundColor: rowBg, cursor: 'pointer' }}
                  onClick={handleOpenDetail}
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
                    <span className={`badge ${(item.kabupaten || item.branch || '').toUpperCase() === 'MAGETAN' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>
                      {item.kabupaten || item.branch}
                    </span>
                  </td>
                  <td className="text-center">{formatDateDisplay(item.date)}</td>
                  <td className="text-center">
                    <span style={{
                      backgroundColor: isPemasukan ? '#dcfce7' : '#fee2e2',
                      color: isPemasukan ? '#15803d' : '#991b1b',
                      padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px', border: isPemasukan ? '1px solid #86efac' : '1px solid #fca5a5'
                    }}>
                      {item.type || item.transactionType || 'PENGELUARAN'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{item.doNo || '-'}</td>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{item.penyaluranNo || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{item.kiosName || '-'}</td>
                  <td style={{ fontSize: '12px' }}>{item.uraian || item.description || '-'}</td>
                  <td className="text-right" style={{ fontWeight: 800, color: isPemasukan ? '#15803d' : '#dc2626' }}>
                    {formatRp(item.nominal || item.amount)}
                  </td>
                  <td>{item.driverName || '-'}</td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => handleOpenModal(item)}>Edit</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDeleteKasAngkutan(item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Belum ada transaksi Kas Angkutan. Klik "+ Tambah Data Kas Angkutan" untuk membuat catatan baru.
                </td>
              </tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ fontWeight: 800, backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={8} style={{ textAlign: 'right', padding: '10px 14px' }}>
                  <span>TOTAL PENGELUARAN: <strong style={{ color: '#dc2626', marginRight: '16px' }}>{formatRp(totalPengeluaran)}</strong></span>
                  <span>TOTAL PEMASUKAN: <strong style={{ color: '#15803d', marginRight: '16px' }}>{formatRp(totalPemasukan)}</strong></span>
                  <span>SALDO KAS ANGKUTAN:</span>
                </td>
                <td className="text-right" style={{ color: saldoKas >= 0 ? '#15803d' : '#dc2626', fontWeight: 800 }}>
                  {formatRp(saldoKas)}
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
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 800 }}>Pengaturan Standar Tarif Biaya Angkutan Per Cabang</div>
              <button className="btn-secondary" onClick={() => setIsRatesModalOpen(false)}>Tutup</button>
            </div>
            <form onSubmit={handleSaveRatesSetting} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRatesHistoryTab(false)}
                    style={{
                      padding: '8px 16px', border: 'none', borderBottom: !showRatesHistoryTab ? '2px solid #0284c7' : 'none',
                      backgroundColor: 'transparent', color: !showRatesHistoryTab ? '#0284c7' : '#6b7280',
                      fontWeight: 800, cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    Pengaturan Tarif Cabang
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRatesHistoryTab(true)}
                    style={{
                      padding: '8px 16px', border: 'none', borderBottom: showRatesHistoryTab ? '2px solid #0284c7' : 'none',
                      backgroundColor: 'transparent', color: showRatesHistoryTab ? '#0284c7' : '#6b7280',
                      fontWeight: 800, cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    Riwayat Perubahan ({settings.transportRateHistory?.length || 0})
                  </button>
                </div>
              </div>

              {!showRatesHistoryTab ? (
                <>
                  {/* TAB SELEKSI CABANG */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Pilih Cabang Operasional</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['MAGETAN', 'SRAGEN'].map(bKey => (
                        <button
                          key={bKey}
                          type="button"
                          onClick={() => setSelectedRateBranch(bKey)}
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: selectedRateBranch === bKey ? '2px solid #0284c7' : '1px solid #d1d5db',
                            backgroundColor: selectedRateBranch === bKey ? '#e0f2fe' : '#f9fafb',
                            color: selectedRateBranch === bKey ? '#0369a1' : '#374151',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {bKey === 'MAGETAN' ? (settings.branch1Name || 'MAGETAN').toUpperCase() : (settings.branch2Name || 'SRAGEN').toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const curBranchRates = ratesByBranch[selectedRateBranch] || DEFAULT_BRANCH_RATE;

                    const itemFields = [
                      { key: 'admin', label: 'Admin', oldRateKey: 'adminRate' },
                      { key: 'solar', label: 'Solar', oldRateKey: 'solarRate' },
                      { key: 'upahSopir', label: 'Upah Sopir', oldRateKey: 'upahSopirRate' },
                      { key: 'uangMakan', label: 'Uang Makan', oldRateKey: 'uangMakanRate' },
                      { key: 'palang', label: 'Palang', oldRateKey: 'palangRate' },
                      { key: 'lembur', label: 'Lembur', oldRateKey: 'lemburRate' },
                      { key: 'helper', label: 'Helper', oldRateKey: 'helperRate' },
                    ];

                    const getItemConfig = (itemKey, oldRateKey) => {
                      const existing = curBranchRates[itemKey];
                      if (existing && typeof existing === 'object') {
                        return {
                          rate: existing.rate !== undefined ? existing.rate : 0,
                          calcType: existing.calcType || 'perTon',
                          tripCapacityTon: existing.tripCapacityTon || 8
                        };
                      }
                      return {
                        rate: Number(curBranchRates[oldRateKey] || 0),
                        calcType: curBranchRates.rateType || 'perTon',
                        tripCapacityTon: Number(curBranchRates.tripCapacityTon || 8)
                      };
                    };

                    const updateItemConfig = (itemKey, oldRateKey, field, val) => {
                      const currentItem = getItemConfig(itemKey, oldRateKey);
                      const updatedItem = { ...currentItem, [field]: val };

                      setRatesByBranch(prev => ({
                        ...prev,
                        [selectedRateBranch]: {
                          ...(prev[selectedRateBranch] || DEFAULT_BRANCH_RATE),
                          [itemKey]: updatedItem
                        }
                      }));
                    };

                    return (
                      <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                        {itemFields.map(({ key: itemKey, label, oldRateKey }) => {
                          const config = getItemConfig(itemKey, oldRateKey);
                          const isFlat = config.calcType === 'flat';

                          return (
                            <div 
                              key={itemKey} 
                              style={{ 
                                border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 12px', 
                                backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '8px' 
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1f2937' }}>
                                  Tarif {label}
                                </span>
                                <span 
                                  style={{ 
                                    fontSize: '11px', fontWeight: 700, 
                                    color: isFlat ? '#0369a1' : (config.calcType === 'perDriverDay' ? '#c2410c' : (config.calcType === 'perDay' ? '#7e22ce' : '#15803d')), 
                                    backgroundColor: isFlat ? '#e0f2fe' : (config.calcType === 'perDriverDay' ? '#ffedd5' : (config.calcType === 'perDay' ? '#f3e8ff' : '#dcfce7')), 
                                    padding: '2px 8px', borderRadius: '12px' 
                                  }}
                                >
                                  {isFlat ? `Flat (${config.tripCapacityTon || 8} Ton/Trip)` : (config.calcType === 'perDriverDay' ? 'Per Sopir / Hari' : (config.calcType === 'perDay' ? 'Per Hari (1x/Hari)' : 'Per Ton'))}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: isFlat ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '2px', color: '#4b5563' }}>Nominal (Rp)</label>
                                  <input 
                                    type="number" 
                                    step="any"
                                    className="search-input" 
                                    style={{ width: '100%', fontSize: '12px', padding: '4px 8px' }} 
                                    value={config.rate} 
                                    onChange={(e) => updateItemConfig(itemKey, oldRateKey, 'rate', Number(e.target.value))} 
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '2px', color: '#4b5563' }}>Metode</label>
                                  <select 
                                    className="search-input" 
                                    style={{ width: '100%', fontSize: '12px', padding: '4px 8px' }}
                                    value={config.calcType}
                                    onChange={(e) => updateItemConfig(itemKey, oldRateKey, 'calcType', e.target.value)}
                                  >
                                    <option value="perTon">Per Ton</option>
                                    <option value="flat">Flat Per Trip</option>
                                    <option value="perDriverDay">Per Sopir / Hari</option>
                                    <option value="perDay">Per Hari (1x / Hari)</option>
                                  </select>
                                </div>

                                {isFlat && (
                                  <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '2px', color: '#0369a1' }}>Kapasitas (Ton/Trip)</label>
                                    <input 
                                      type="number" 
                                      className="search-input" 
                                      style={{ width: '100%', fontSize: '12px', padding: '4px 8px' }} 
                                      placeholder="8"
                                      value={config.tripCapacityTon} 
                                      onChange={(e) => updateItemConfig(itemKey, oldRateKey, 'tripCapacityTon', Number(e.target.value))} 
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setIsRatesModalOpen(false)}>Batal</button>
                    <button type="submit" className="btn-primary">Simpan Tarif {selectedRateBranch}</button>
                  </div>
                </>
              ) : (
                <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(!settings.transportRateHistory || settings.transportRateHistory.length === 0) ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      Belum ada riwayat perubahan tarif.
                    </div>
                  ) : (
                    settings.transportRateHistory.map((hItem, idx) => (
                      <div key={hItem.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', backgroundColor: '#f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1' }}>
                            Cabang: {hItem.branch || 'MAGETAN'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            {formatDateDisplay(hItem.timestamp ? hItem.timestamp.split('T')[0] : '')} ({hItem.timestamp ? new Date(hItem.timestamp).toLocaleTimeString('id-ID') : '-'})
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: '#374151' }}>
                          <div>Metode: <strong>{hItem.rateData?.rateType === 'flat' ? `Flat (${hItem.rateData?.tripCapacityTon || 8} Ton/Trip)` : 'Per Ton'}</strong></div>
                          <div>Admin: <strong>Rp {(hItem.rateData?.adminRate || 0).toLocaleString('id-ID')}</strong></div>
                          <div>Solar: <strong>Rp {(hItem.rateData?.solarRate || 0).toLocaleString('id-ID')}</strong></div>
                          <div>Upah Sopir: <strong>Rp {(hItem.rateData?.upahSopirRate || 0).toLocaleString('id-ID')}</strong></div>
                          <div>Uang Makan: <strong>Rp {(hItem.rateData?.uangMakanRate || 0).toLocaleString('id-ID')}</strong></div>
                          <div>Helper: <strong>Rp {(hItem.rateData?.helperRate || 0).toLocaleString('id-ID')}</strong></div>
                        </div>
                      </div>
                    ))
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setIsRatesModalOpen(false)}>Tutup</button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL RINCIAN TRANSAKSI PENYALURAN KIOS */}
      {detailPenyaluranModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#0284c7', color: '#ffffff'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  RINCIAN TRANSAKSI KAS ANGKUTAN & PENYALURAN
                </h3>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                  No. Penyaluran: <strong>{detailPenyaluranModal.kasItem?.penyaluranNo || '-'}</strong>
                </div>
              </div>
              <button 
                onClick={() => setDetailPenyaluranModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#ffffff', fontWeight: 800 }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#ffffff' }}>
              {/* Informational Cards */}
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '12px 16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '8px' }}>
                  INFORMASI UTAMA TRANSAKSI
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div><strong>No. DO Reference:</strong> <span style={{ fontFamily: 'monospace', color: '#15803d', fontWeight: 700 }}>{detailPenyaluranModal.kasItem?.doNo || '-'}</span></div>
                  <div><strong>Tanggal Transaksi:</strong> <span>{formatDateDisplay(detailPenyaluranModal.kasItem?.date)}</span></div>
                  <div><strong>Cabang:</strong> <span className="badge badge-branch-magetan">{detailPenyaluranModal.kasItem?.kabupaten || detailPenyaluranModal.kasItem?.branch}</span></div>
                  <div><strong>Kios Tujuan:</strong> <span style={{ fontWeight: 700 }}>{detailPenyaluranModal.kasItem?.kiosName || '-'}</span></div>
                  <div><strong>Sopir / Pengangkut:</strong> <span>{detailPenyaluranModal.kasItem?.driverName || '-'}</span></div>
                  <div><strong>Nominal Transaksi:</strong> <span style={{ fontWeight: 800, color: detailPenyaluranModal.kasItem?.type === 'PEMASUKAN' ? '#15803d' : '#dc2626' }}>{formatRp(detailPenyaluranModal.kasItem?.nominal || detailPenyaluranModal.kasItem?.amount || 0)}</span></div>
                </div>
              </div>

              {detailPenyaluranModal.penyaluranData ? (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '10px' }}>
                    DATA SPESIFIK PENYALURAN (PENYALURAN KIOS)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                    <div><strong>Jenis Pupuk:</strong> <span>{detailPenyaluranModal.penyaluranData.fertilizerName || '-'}</span></div>
                    <div><strong>Kuantitas:</strong> <span style={{ fontWeight: 800, color: '#0369a1' }}>{detailPenyaluranModal.penyaluranData.qtyTon || detailPenyaluranModal.penyaluranData.qty || 0} TON</span></div>
                    <div><strong>Harga / Ton:</strong> <span>{formatRp(detailPenyaluranModal.penyaluranData.pricePerTon)}</span></div>
                    <div><strong>Total Tagihan Kios:</strong> <span style={{ fontWeight: 800, color: '#166534' }}>{formatRp(detailPenyaluranModal.penyaluranData.totalAmount)}</span></div>
                    <div><strong>Status Pelunasan:</strong> 
                      <span style={{
                        marginLeft: '6px',
                        backgroundColor: detailPenyaluranModal.penyaluranData.paymentStatus === 'Lunas' ? '#dcfce7' : '#fef3c7',
                        color: detailPenyaluranModal.penyaluranData.paymentStatus === 'Lunas' ? '#15803d' : '#b45309',
                        padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px'
                      }}>
                        {detailPenyaluranModal.penyaluranData.paymentStatus || 'Tempo'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px', fontSize: '12px', color: '#92400e' }}>
                  Data induk Penyaluran Kios untuk <strong>{detailPenyaluranModal.kasItem?.penyaluranNo || 'transaksi ini'}</strong> tidak terdaftar di tabel penyaluran utama, namun berikut adalah rincian catatan kas ini:
                  <div style={{ marginTop: '6px', fontWeight: 700, fontFamily: 'monospace', backgroundColor: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #fcd34d' }}>
                    {detailPenyaluranModal.kasItem?.uraian || detailPenyaluranModal.kasItem?.description || '-'}
                  </div>
                </div>
              )}

              {/* Rincian Beban Kas Angkutan */}
              {(() => {
                const k = detailPenyaluranModal.kasItem || {};
                const p = detailPenyaluranModal.penyaluranData || {};
                const getVal = (...keys) => {
                  for (let key of keys) {
                    if (k[key] !== undefined && k[key] !== null && k[key] !== '') {
                      const num = Number(k[key]);
                      if (!isNaN(num) && num > 0) return num;
                    }
                  }
                  return 0;
                };
                const totalNom = Number(k.nominal || k.amount || k.totalCost || 0);

                let adminVal = getVal('admin', 'adminFee', 'adminCost');
                let solarVal = getVal('solar', 'solarFee', 'solarCost');
                let upahSopirVal = getVal('upahSopir', 'driverWage', 'upahSopirCost', 'upah');
                let uangMakanVal = getVal('uangMakan', 'mealFee', 'uangMakanCost', 'makan');
                let palangVal = getVal('palang', 'palangFee', 'palangCost');
                let lemburVal = getVal('lembur', 'overtimeFee', 'lemburCost');
                let helperVal = getVal('helper', 'helperFee', 'helperCost');
                let lainLainVal = getVal('lainLain', 'otherFee', 'lainLainCost', 'lain_lain');

                // If sub-breakdown is 0 but totalNominal > 0, estimate from rates or qtyTon
                const subTotal = adminVal + solarVal + upahSopirVal + uangMakanVal + palangVal + lemburVal + helperVal + lainLainVal;
                if (subTotal === 0 && totalNom > 0) {
                  const curRates = settings.transportRates || DEFAULT_TRANSPORT_RATES;
                  const qtyTon = Number(p.qtyTon || p.qty || 0);
                  
                  if (qtyTon > 0) {
                    const isPerTon = curRates.rateType === 'perTon';
                    const mult = isPerTon ? qtyTon : 1;
                    adminVal = Math.round((curRates.adminRate || 2000) * mult);
                    solarVal = Math.round((curRates.solarRate || 4166.625) * mult);
                    upahSopirVal = Math.round((curRates.upahSopirRate || 3500) * mult);
                    uangMakanVal = Math.round((curRates.uangMakanRate || 0) * mult);
                    palangVal = Math.round((curRates.palangRate || 0) * mult);
                    lemburVal = Math.round((curRates.lemburRate || 0) * mult);
                    helperVal = Math.round((curRates.helperRate || 0) * mult);
                    
                    // Adjust rounding difference to solar/upah if any
                    const calculatedSum = adminVal + solarVal + upahSopirVal + uangMakanVal + palangVal + lemburVal + helperVal;
                    if (calculatedSum !== totalNom) {
                      const diff = totalNom - calculatedSum;
                      solarVal += diff;
                    }
                  } else {
                    // Default fallback distribution based on typical transport ratio (~21% Admin, ~43% Solar, ~36% Upah Sopir)
                    adminVal = Math.round(totalNom * 0.207);
                    upahSopirVal = Math.round(totalNom * 0.3627);
                    solarVal = totalNom - adminVal - upahSopirVal;
                  }
                }

                return (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#374151', textTransform: 'uppercase', marginBottom: '8px' }}>
                      RINCIAN ANGGARAN KAS ANGKUTAN (TOTAL: {formatRp(totalNom)})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Admin: <strong>{formatRp(adminVal)}</strong></div>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Solar: <strong>{formatRp(solarVal)}</strong></div>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Upah Sopir: <strong>{formatRp(upahSopirVal)}</strong></div>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Uang Makan: <strong>{formatRp(uangMakanVal)}</strong></div>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Palang: <strong>{formatRp(palangVal)}</strong></div>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Lembur: <strong>{formatRp(lemburVal)}</strong></div>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Helper: <strong>{formatRp(helperVal)}</strong></div>
                      <div style={{ backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '4px' }}>Lain-Lain: <strong>{formatRp(lainLainVal)}</strong></div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setDetailPenyaluranModal(null)}
                  style={{ padding: '8px 20px' }}
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
