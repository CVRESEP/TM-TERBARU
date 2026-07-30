import React, { useState, useMemo } from 'react';
import ModalKiosHistory from './ModalKiosHistory';
import { formatCurrencyInput, parseCurrencyInput, formatDateDisplay } from '../utils/currency';
import DateFilterBar, { matchesDateFilter } from './DateFilterBar';
import { useSortableTable, SortIcon } from '../utils/useSortableTable';
import { usePagination } from '../utils/usePagination';
import TablePagination from './TablePagination';

export default function PembayaranKiosView({
  selectedBranch = 'ALL',
  penyaluranList = [],
  kiosks = [],
  payments = [],
  deposits = [],
  onAddPayment,
  onAddDeposit,
  onDeletePayment,
  onDeleteDeposit,
  settings = {},
  onNavigate
}) {
  const [activeTabSection, setActiveTabSection] = useState('rekap_kios'); // 'rekap_kios' | 'tagihan_do' | 'riwayat'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKiosId, setSelectedKiosId] = useState('ALL');

  // Filter tanggal — per tab
  const [filterStateTagihan, setFilterStateTagihan] = useState({
    mode: 'all', dailyDate: '', startDate: '', endDate: '', month: '',
    year: new Date().getFullYear().toString()
  });
  const [filterStateRiwayat, setFilterStateRiwayat] = useState({
    mode: 'all', dailyDate: '', startDate: '', endDate: '', month: '',
    year: new Date().getFullYear().toString()
  });
  
  // Per-Kios Deposit Deduction Map: { [kiosId]: boolean }
  const [kiosDeductMap, setKiosDeductMap] = useState({});

  // Kios History Modal State
  const [historyKios, setHistoryKios] = useState(null);

  const isKiosDeductEnabled = (kiosId) => {
    return kiosDeductMap[kiosId] !== undefined ? kiosDeductMap[kiosId] : true;
  };

  const toggleKiosDeduct = (kiosId) => {
    setKiosDeductMap(prev => ({
      ...prev,
      [kiosId]: !isKiosDeductEnabled(kiosId)
    }));
  };

  const setAllKiosDeduct = (enabled) => {
    const updatedMap = {};
    filteredKiosks.forEach(k => {
      updatedMap[k.id] = enabled;
    });
    setKiosDeductMap(updatedMap);
  };

  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Form Payment States
  const [payKiosId, setPayKiosId] = useState('');
  const [payPenyaluranId, setPayPenyaluranId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('Tunai');
  const [payNotes, setPayNotes] = useState('');
  const [useDepositForPayment, setUseDepositForPayment] = useState(false);

  // Form Deposit States
  const [depKiosId, setDepKiosId] = useState('');
  const [depDoNo, setDepDoNo] = useState('');
  const [depAmount, setDepAmount] = useState('');
  const [depDate, setDepDate] = useState(new Date().toISOString().split('T')[0]);
  const [depNotes, setDepNotes] = useState('');

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  // Filter items by branch
  const filteredPenyaluran = (penyaluranList || []).filter(item => {
    if (!item) return false;
    const matchBranch = selectedBranch === 'ALL' || item.branch === selectedBranch;
    const matchKios = selectedKiosId === 'ALL' || item.kiosId === selectedKiosId;
    const matchSearch = (item.doNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.kiosName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.fertilizerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = matchesDateFilter(item.date, filterStateTagihan);
    return matchBranch && matchKios && matchSearch && matchDate;
  });

  const filteredKiosks = (kiosks || []).filter(k => k && (selectedBranch === 'ALL' || k.branch === selectedBranch));

  // Sort untuk tab tagihan DO
  const { sorted: sortedTagihan, sortKey: sortKeyTagihan, sortDir: sortDirTagihan, thProps: thTagihan } = useSortableTable(filteredPenyaluran, 'date', 'desc');

  // Log riwayat gabungan (untuk tab 3)
  const riwayatLogs = useMemo(() => [
    ...(payments || []).filter(Boolean).map(p => ({ ...p, method: p.method || p.paymentMethod, logCategory: 'Pelunasan' })),
    ...(penyaluranList || [])
      .filter(s => s && (s.paymentStatus === 'Lunas' || Number(s.dpAmount || 0) > 0))
      .map(s => ({
        id: `BAYAR-TRX-${s.id}`,
        logCategory: 'Pelunasan (Transaksi Direct)',
        date: s.date,
        kiosId: s.kiosId,
        kiosName: s.kiosName,
        doNo: s.doNo,
        amount: s.paymentStatus === 'Lunas' ? Number(s.totalAmount || 0) : Number(s.dpAmount || 0),
        method: s.paymentStatus === 'Lunas' ? 'Lunas Langsung' : 'DP Transaksi',
        notes: `Pembayaran langsung saat penyaluran Surat Jalan: ${s.sjNo || s.id}`,
        isDirectTrx: true
      })),
    ...(deposits || []).filter(Boolean).map(d => ({ ...d, method: d.method || d.paymentMethod, logCategory: 'Deposit' }))
  ].filter(log => {
    if (!log) return false;
    const matchBranch = selectedBranch === 'ALL' || log.branch === selectedBranch;
    const matchKios = selectedKiosId === 'ALL' || log.kiosId === selectedKiosId || log.kiosName === selectedKiosId;
    const matchSearch = !searchTerm || (log.doNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (log.kiosName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = matchesDateFilter(log.date, filterStateRiwayat);
    return matchBranch && matchKios && matchSearch && matchDate;
  }), [payments, penyaluranList, deposits, filterStateRiwayat, selectedBranch, selectedKiosId, searchTerm]);

  const { sorted: sortedRiwayat, sortKey: sortKeyRiwayat, sortDir: sortDirRiwayat, thProps: thRiwayat } = useSortableTable(riwayatLogs, 'date', 'desc');

  const { currentPage: pageKios, setCurrentPage: setPageKios, totalPages: totalKios, paginatedData: paginatedKios, itemsPerPage: limitKios, setItemsPerPage: setLimitKios } = usePagination(filteredKiosks, 10);
  const { currentPage: pageTagihan, setCurrentPage: setPageTagihan, totalPages: totalTagihan, paginatedData: paginatedTagihan, itemsPerPage: limitTagihan, setItemsPerPage: setLimitTagihan } = usePagination(sortedTagihan, 10);
  const { currentPage: pageRiwayat, setCurrentPage: setPageRiwayat, totalPages: totalRiwayat, paginatedData: paginatedRiwayat, itemsPerPage: limitRiwayat, setItemsPerPage: setLimitRiwayat } = usePagination(sortedRiwayat, 10);

  const handleOpenKiosHistoryByKiosId = (kiosId, fallbackName = '') => {
    const kName = String(fallbackName || kiosId || '').toLowerCase().trim();
    const kId = String(kiosId || '').toLowerCase().trim();
    const foundKios = kiosks.find(k => 
      String(k.id || '').toLowerCase().trim() === kId || 
      String(k.name || '').toLowerCase().trim() === kName || 
      String(k.code || '').toLowerCase().trim() === kId
    );
    if (foundKios) {
      setHistoryKios(foundKios);
    } else {
      setHistoryKios({ id: kiosId, name: fallbackName || 'Kios', owner: '-', branch: selectedBranch, address: '-', phone: '-' });
    }
  };

  const getPenyaluranPaymentStats = (pItem) => {
    if (!pItem) return { totalTagihan: 0, terbayar: 0, sisa: 0, statusDisplay: 'Lunas' };
    const itemPayments = (payments || []).filter(pm => {
      if (!pm) return false;
      const matchDirect = pm.penyaluranId && (pm.penyaluranId === pItem.id || pm.penyaluranId === pItem.penyaluranNo || pm.penyaluranId === pItem.nomorPenyaluran);
      const matchDoKios = pm.doNo && pItem.doNo && pm.doNo === pItem.doNo && (pm.kiosName === pItem.kiosName || pm.kiosId === pItem.kiosId);
      return matchDirect || matchDoKios;
    });
    const paidAmountSum = itemPayments.reduce((s, pm) => s + Number(pm?.amount || 0), 0);
    const initialDp = Number(pItem.dpAmount || 0);

    const totalTagihan = Number(pItem.totalAmount || 0);
    let terbayar = paidAmountSum + initialDp;
    if (pItem.paymentStatus === 'Lunas' && itemPayments.length === 0) {
      terbayar = totalTagihan;
    } else if (pItem.paymentStatus === 'Lunas') {
      terbayar = Math.max(totalTagihan, terbayar);
    }

    const sisa = Math.max(0, totalTagihan - terbayar);
    const statusDisplay = sisa <= 0 ? 'Lunas' : (terbayar > 0 ? 'Dicicil' : 'Tempo / Utang');
    return { totalTagihan, terbayar, sisa, statusDisplay };
  };

  const matchKiosObject = (item, kiosObj) => {
    if (!item || !kiosObj) return false;
    const kId = String(kiosObj.id || '').toLowerCase().trim();
    const kName = String(kiosObj.name || '').toLowerCase().trim();
    const kCode = String(kiosObj.code || '').toLowerCase().trim();
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

  const getKiosDepositSum = (kiosId) => {
    if (!kiosId) return 0;
    return (deposits || []).filter(d => d && (d.kiosId === kiosId || d.kiosName === kiosId)).reduce((s, d) => s + Number(d?.amount || 0), 0);
  };

  // Total Recap Stats across filtered list
  const totalTagihanSemua = filteredPenyaluran.reduce((s, p) => s + Number(p?.totalAmount || 0), 0);
  const totalTerbayarSemua = filteredPenyaluran.reduce((s, p) => s + getPenyaluranPaymentStats(p).terbayar, 0);
  const totalPiutangTempoSemua = filteredPenyaluran.reduce((s, p) => s + getPenyaluranPaymentStats(p).sisa, 0);

  // Total Deposits
  const filteredDeposits = (deposits || []).filter(d => {
    if (!d) return false;
    const kios = (kiosks || []).find(k => k && (k.id === d.kiosId || k.name === d.kiosName));
    const matchBranch = selectedBranch === 'ALL' || (kios && kios.branch === selectedBranch);
    const matchKios = selectedKiosId === 'ALL' || d.kiosId === selectedKiosId || d.kiosName === selectedKiosId;
    return matchBranch && matchKios;
  });
  const totalDepositSemua = filteredDeposits.reduce((s, d) => s + Number(d?.amount || 0), 0);

  // Total Net Kekurangan calculated per-kios based on each kiosk's toggle state
  const totalNetKekuranganSemua = filteredKiosks.reduce((total, kios) => {
    if (!kios) return total;
    const kiosSalur = (penyaluranList || []).filter(p => matchKiosObject(p, kios));
    const tagihanTotal = kiosSalur.reduce((s, p) => s + Number(p?.totalAmount || 0), 0);
    const terbayarTotal = kiosSalur.reduce((s, p) => s + getPenyaluranPaymentStats(p).terbayar, 0);
    const kek = Math.max(0, tagihanTotal - terbayarTotal);
    const dep = getKiosDepositSum(kios.id);
    const isDeduct = isKiosDeductEnabled(kios.id);
    const netK = isDeduct ? Math.max(0, kek - dep) : kek;
    return total + netK;
  }, 0);

  // Available Deposit for current selected payKiosId
  const availablePayKiosDeposit = payKiosId ? getKiosDepositSum(payKiosId) : 0;

  // Open Modal Pelunasan
  const handleOpenPayment = (kiosIdParam = '', penyaluranParam = null) => {
    const kId = kiosIdParam || (filteredKiosks[0]?.id || '');
    setPayKiosId(kId);
    setUseDepositForPayment(isKiosDeductEnabled(kId));

    if (penyaluranParam) {
      setPayPenyaluranId(penyaluranParam.id);
      const stats = getPenyaluranPaymentStats(penyaluranParam);
      setPayAmount(stats.sisa > 0 ? stats.sisa : stats.totalTagihan);
    } else {
      setPayPenyaluranId('');
      setPayAmount('');
    }
    setPayNotes('');
    setIsPaymentModalOpen(true);
  };

  // Open Modal Deposit
  const handleOpenDeposit = (kiosIdParam = '', doNoParam = '') => {
    setDepKiosId(kiosIdParam || (filteredKiosks[0]?.id || ''));
    setDepDoNo(doNoParam || '');
    setDepAmount('');
    setDepNotes('');
    setIsDepositModalOpen(true);
  };

  // Submit Pelunasan
  const handleSubmitPayment = (e) => {
    e.preventDefault();
    const selectedKios = (kiosks || []).find(k => k && k.id === payKiosId);
    const selectedPenyaluran = (penyaluranList || []).find(p => p && p.id === payPenyaluranId);

    const totalEnteredAmount = Number(payAmount || 0);

    if (useDepositForPayment && availablePayKiosDeposit > 0) {
      const depositDeducted = Math.min(availablePayKiosDeposit, totalEnteredAmount);
      const cashRemaining = Math.max(0, totalEnteredAmount - depositDeducted);

      // 1. Record deposit deduction payment
      if (depositDeducted > 0) {
        onAddPayment({
          id: `PAY-DEP-${Date.now()}`,
          date: payDate,
          kiosId: payKiosId,
          kiosName: selectedKios?.name || '-',
          penyaluranId: payPenyaluranId || null,
          doNo: selectedPenyaluran?.doNo || '-',
          amount: depositDeducted,
          method: 'Potong Deposit',
          notes: `Pembayaran memotong deposit kios ${payNotes ? '(' + payNotes + ')' : ''}`,
        });

        // Add negative deposit record to deduct balance
        onAddDeposit({
          id: `DEP-USE-${Date.now()}`,
          date: payDate,
          kiosId: payKiosId,
          kiosName: selectedKios?.name || '-',
          doNo: selectedPenyaluran?.doNo || '-',
          amount: -depositDeducted,
          notes: `Potong saldo deposit untuk pelunasan DO ${selectedPenyaluran?.doNo || '-'}`,
        });
      }

      // 2. Record remaining cash payment if any
      if (cashRemaining > 0) {
        onAddPayment({
          id: `PAY-${Date.now()}`,
          date: payDate,
          kiosId: payKiosId,
          kiosName: selectedKios?.name || '-',
          penyaluranId: payPenyaluranId || null,
          doNo: selectedPenyaluran?.doNo || '-',
          amount: cashRemaining,
          method: payMethod,
          notes: payNotes,
        });
      }
    } else {
      // Standard cash/transfer payment
      const paymentRecord = {
        id: `PAY-${Date.now()}`,
        date: payDate,
        kiosId: payKiosId,
        kiosName: selectedKios?.name || '-',
        penyaluranId: payPenyaluranId || null,
        doNo: selectedPenyaluran?.doNo || '-',
        amount: totalEnteredAmount,
        method: payMethod,
        notes: payNotes,
      };
      onAddPayment(paymentRecord);
    }

    setIsPaymentModalOpen(false);
  };

  // Submit Deposit
  const handleSubmitDeposit = (e) => {
    e.preventDefault();
    const selectedKios = (kiosks || []).find(k => k && k.id === depKiosId);

    const depositRecord = {
      id: `DEP-${Date.now()}`,
      date: depDate,
      kiosId: depKiosId,
      kiosName: selectedKios?.name || '-',
      doNo: depDoNo || '-',
      amount: Number(depAmount),
      notes: depNotes,
    };

    onAddDeposit(depositRecord);
    setIsDepositModalOpen(false);
  };

  return (
    <div>
      {/* Header Info */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Pencatatan & Rekap Pembayaran Kios</h2>
          <p className="page-desc">Monitoring otomatis Kekurangan Pembayaran, Pelunasan Tagihan, dan Aksi Deposit <strong>Per Kios</strong>.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {onNavigate && (
            <>
              <button className="btn-secondary" onClick={() => onNavigate('penyaluran_kios')}>
                ← Ke Penyaluran Kios
              </button>
              <button className="btn-secondary" onClick={() => onNavigate('dashboard')}>
                Dashboard
              </button>
              <button className="btn-primary" style={{ backgroundColor: '#475569' }} onClick={() => onNavigate('laporan')}>
                Lanjut ke Laporan & Cetak →
              </button>
            </>
          )}
          <button className="btn-primary" style={{ backgroundColor: '#15803d' }} onClick={() => handleOpenPayment()}>
            + Terima Pelunasan
          </button>
          <button className="btn-primary" style={{ backgroundColor: '#1d4ed8' }} onClick={() => handleOpenDeposit()}>
            + Catat Deposit Kios
          </button>
        </div>
      </div>

      {/* BANNER KONTROL MASSAL PERHITUNGAN DEPOSIT PER KIOS */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1.5px solid #cbd5e1',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#1e293b' }}>
              Pengaturan Perhitungan Deposit Kios: <span style={{ color: '#15803d' }}>Bisa Diatur Independen Per Kios</span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
              Kekurangan Murni Semua Kios: <strong>{formatRp(totalPiutangTempoSemua)}</strong> &nbsp;|&nbsp;
              Total Saldo Deposit: <strong>{formatRp(totalDepositSemua)}</strong> &nbsp;➔&nbsp;
              Net Sisa Kekurangan Gabungan: <strong style={{ color: '#ea580c' }}>{formatRp(totalNetKekuranganSemua)}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAllKiosDeduct(true)}
            style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
          >
            Potong Deposit Semua Kios
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAllKiosDeduct(false)}
            style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }}
          >
            Pisah Deposit Semua Kios
          </button>
        </div>
      </div>

      {/* RECAP SUMMARY CARDS */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
        <div className="card" style={{ padding: '12px', borderLeft: '4px solid #6b7280' }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700 }}>TOTAL TAGIHAN SALUR</div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>{formatRp(totalTagihanSemua)}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{filteredPenyaluran.length} Transaksi Penyaluran</div>
        </div>

        <div className="card" style={{ padding: '12px', borderLeft: '4px solid #15803d' }}>
          <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>TOTAL TERBAYAR (LUNAS/DP)</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>{formatRp(totalTerbayarSemua)}</div>
          <div style={{ fontSize: '11px', color: '#16a34a' }}>Uang Masuk Keuangan</div>
        </div>

        <div className="card" style={{ padding: '12px', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700 }}>NET KEKURANGAN GABUNGAN</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
            {formatRp(totalNetKekuranganSemua)}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            Kekurangan Murni: {formatRp(totalPiutangTempoSemua)}
          </div>
        </div>

        <div className="card" style={{ padding: '12px', borderLeft: '4px solid #1d4ed8' }}>
          <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 700 }}>TOTAL SALDO DEPOSIT KIOS</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>{formatRp(totalDepositSemua)}</div>
          <div style={{ fontSize: '11px', color: '#2563eb' }}>Saldo Titipan Kios</div>
        </div>
      </div>

      {/* SUB TAB & FILTER BAR */}
      <div className="table-container" style={{ marginBottom: '14px', padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={activeTabSection === 'rekap_kios' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTabSection('rekap_kios')}
              style={{ fontSize: '12px' }}
            >
              Rekap per Kios
            </button>
            <button
              className={activeTabSection === 'tagihan_do' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTabSection('tagihan_do')}
              style={{ fontSize: '12px' }}
            >
              Tagihan per No. DO ({filteredPenyaluran.length})
            </button>
            <button
              className={activeTabSection === 'riwayat' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setActiveTabSection('riwayat')}
              style={{ fontSize: '12px' }}
            >
              Riwayat Pelunasan & Deposit ({payments.length + deposits.length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="filter-select"
              value={selectedKiosId}
              onChange={(e) => setSelectedKiosId(e.target.value)}
              style={{ fontSize: '12px' }}
            >
              <option value="ALL">-- Semua Kios ({filteredKiosks.length}) --</option>
              {filteredKiosks.map(k => <option key={k.id} value={k.id}>{k.name} ({k.owner})</option>)}
            </select>

            <input
              type="text"
              placeholder="Cari No. DO / Kios..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px', fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* ─── TAB 1: REKAP PER KIOS ─── */}
      {activeTabSection === 'rekap_kios' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cabang</th>
                <th>Kode Kios</th>
                <th>Nama Kios Pengecer</th>
                <th>Pemilik</th>
                <th>Total Tagihan</th>
                <th>Terbayar</th>
                <th>Kekurangan Pembayaran</th>
                <th>Saldo Deposit</th>
                <th style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>Opsi Deposit Kios</th>
                <th>Net Kekurangan</th>
                <th>Status Keuangan</th>
                <th>Aksi Cepat Per Kios</th>
              </tr>
            </thead>
            <tbody>
              {paginatedKios.map(kios => {
                if (!kios) return null;
                const kiosSalur = (penyaluranList || []).filter(p => matchKiosObject(p, kios));
                const tagihanTotal = kiosSalur.reduce((s, p) => s + Number(p?.totalAmount || 0), 0);
                const terbayarTotal = kiosSalur.reduce((s, p) => s + getPenyaluranPaymentStats(p).terbayar, 0);
                const kekuranganPembayaran = Math.max(0, tagihanTotal - terbayarTotal);

                const depositTotal = getKiosDepositSum(kios.id);
                const isDeduct = isKiosDeductEnabled(kios.id);
                const netKekurangan = isDeduct ? Math.max(0, kekuranganPembayaran - depositTotal) : kekuranganPembayaran;

                return (
                  <tr key={kios.id}>
                    <td><span className={`badge ${kios.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{kios.branch}</span></td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{kios.code || kios.id}</td>
                    <td>
                      <span
                        onClick={() => setHistoryKios(kios)}
                        style={{
                          fontWeight: 800,
                          color: '#15803d',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px'
                        }}
                        title="Klik untuk melihat riwayat transaksi lengkap kios ini"
                      >
                        {kios.name}
                      </span>
                    </td>
                    <td>{kios.owner}</td>
                    <td>{formatRp(tagihanTotal)}</td>
                    <td style={{ color: '#15803d', fontWeight: 600 }}>{formatRp(terbayarTotal)}</td>
                    <td style={{ color: kekuranganPembayaran > 0 ? '#dc2626' : '#6b7280', fontWeight: 700 }}>
                      {formatRp(kekuranganPembayaran)}
                    </td>
                    <td style={{ color: depositTotal > 0 ? '#1d4ed8' : '#6b7280', fontWeight: 700 }}>
                      {formatRp(depositTotal)}
                    </td>
                    
                    {/* SAKELAR TOGGLE PER KIOS */}
                    <td style={{ backgroundColor: '#f8fafc' }}>
                      <button
                        type="button"
                        onClick={() => toggleKiosDeduct(kios.id)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${isDeduct ? '#bbf7d0' : '#fde68a'}`,
                          backgroundColor: isDeduct ? '#f0fdf4' : '#fffbeb',
                          color: isDeduct ? '#15803d' : '#92400e',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Klik untuk mengubah setelan potong deposit untuk kios ini"
                      >
                        {isDeduct ? 'Potong Tagihan' : 'Deposit Dipisah'}
                      </button>
                    </td>

                    <td style={{ color: netKekurangan > 0 ? '#ea580c' : '#15803d', fontWeight: 800 }}>
                      {formatRp(netKekurangan)}
                    </td>

                    <td>
                      {kekuranganPembayaran === 0 && depositTotal === 0 && <span className="badge badge-success">Lunas</span>}
                      {kekuranganPembayaran > 0 && !isDeduct && <span className="badge badge-warning">Kekurangan: {formatRp(kekuranganPembayaran)}</span>}
                      {kekuranganPembayaran > 0 && isDeduct && (
                        <span className={`badge ${netKekurangan === 0 ? 'badge-success' : 'badge-warning'}`}>
                          {netKekurangan === 0 ? 'Lunas via Deposit' : `Net: ${formatRp(netKekurangan)}`}
                        </span>
                      )}
                      {depositTotal > 0 && <span className="badge badge-info">Deposit: {formatRp(depositTotal)}</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#15803d' }}
                          onClick={() => handleOpenPayment(kios.id)}
                          title="Terima Pelunasan Tagihan Kios Ini"
                        >
                          + Pelunasan
                        </button>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#1d4ed8' }}
                          onClick={() => handleOpenDeposit(kios.id)}
                          title="Tambah Deposit Khusus Kios Ini"
                        >
                          + Deposit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredKiosks.length === 0 && (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Tidak ada kios sesuai filter.</td></tr>
              )}
            </tbody>
          </table>
          <TablePagination 
            currentPage={pageKios} totalPages={totalKios} 
            setCurrentPage={setPageKios} totalItems={filteredKiosks.length} 
            itemsPerPage={limitKios} setItemsPerPage={setLimitKios}
          />
        </div>
      )}

      {/* ─── TAB 2: TAGIHAN PER NO DO ─── */}
      {activeTabSection === 'tagihan_do' && (
        <div className="table-container">
          <DateFilterBar filterState={filterStateTagihan} setFilterState={setFilterStateTagihan} />
          <table className="data-table">
            <thead>
              <tr>
                <th {...thTagihan('branch')} className="sortable-th">Cabang <SortIcon colKey="branch" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th {...thTagihan('doNo')} className="sortable-th" style={{ backgroundColor: '#dcfce7' }}>Nomor DO <SortIcon colKey="doNo" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th {...thTagihan('date')} className="sortable-th">Tanggal <SortIcon colKey="date" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th {...thTagihan('kiosName')} className="sortable-th">Kios Tujuan <SortIcon colKey="kiosName" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th {...thTagihan('fertilizerName')} className="sortable-th">Jenis Pupuk <SortIcon colKey="fertilizerName" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th {...thTagihan('qtyTon')} className="sortable-th">Qty (Ton) <SortIcon colKey="qtyTon" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th {...thTagihan('totalAmount')} className="sortable-th">Total Tagihan <SortIcon colKey="totalAmount" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th>Terbayar (Rp)</th>
                <th>Kekurangan Pembayaran</th>
                <th {...thTagihan('paymentStatus')} className="sortable-th">Status Pembayaran <SortIcon colKey="paymentStatus" sortKey={sortKeyTagihan} sortDir={sortDirTagihan} /></th>
                <th>Aksi Per Kios / DO</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTagihan.map(item => {
                const stats = getPenyaluranPaymentStats(item);
                return (
                  <tr key={item.id}>
                    <td><span className={`badge ${item.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>{item.branch}</span></td>
                    <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{item.doNo}</td>
                    <td>{formatDateDisplay(item.date)}</td>
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
                        title="Klik untuk melihat riwayat transaksi kios ini"
                      >
                        {item.kiosName}
                      </span>
                    </td>
                    <td>{item.fertilizerName}</td>
                    <td style={{ fontWeight: 700 }}>{Number(item.qtyTon || 0).toFixed(1)} Ton</td>
                    <td>{formatRp(stats.totalTagihan)}</td>
                    <td style={{ color: '#15803d', fontWeight: 600 }}>{formatRp(stats.terbayar)}</td>
                    <td style={{ color: stats.sisa > 0 ? '#dc2626' : '#6b7280', fontWeight: 700 }}>{formatRp(stats.sisa)}</td>
                    <td>
                      <span className={`badge ${stats.statusDisplay === 'Lunas' ? 'badge-success' : stats.statusDisplay === 'Dicicil' ? 'badge-info' : 'badge-warning'}`}>
                        {stats.statusDisplay}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {stats.sisa > 0 ? (
                          <button
                            className="btn-primary"
                            style={{ fontSize: '11px', padding: '3px 7px', backgroundColor: '#15803d' }}
                            onClick={() => handleOpenPayment(item.kiosId, item)}
                          >
                            Pelunasan →
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 700, alignSelf: 'center' }}>Lunas</span>
                        )}
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '3px 7px', color: '#1d4ed8', borderColor: '#93c5fd' }}
                          onClick={() => handleOpenDeposit(item.kiosId, item.doNo)}
                          title="Tambah Deposit Terkait DO Ini"
                        >
                          + Deposit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPenyaluran.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Tidak ada transaksi penyaluran.</td></tr>
              )}
            </tbody>
          </table>
          <TablePagination 
            currentPage={pageTagihan} totalPages={totalTagihan} 
            setCurrentPage={setPageTagihan} totalItems={filteredPenyaluran.length} 
            itemsPerPage={limitTagihan} setItemsPerPage={setLimitTagihan}
          />
        </div>
      )}

      {/* ─── TAB 3: RIWAYAT PELUNASAN & DEPOSIT ─── */}
      {activeTabSection === 'riwayat' && (
        <div className="table-container">
          <DateFilterBar filterState={filterStateRiwayat} setFilterState={setFilterStateRiwayat} />
          <table className="data-table">
            <thead>
              <tr>
                <th {...thRiwayat('id')} className="sortable-th">ID Log <SortIcon colKey="id" sortKey={sortKeyRiwayat} sortDir={sortDirRiwayat} /></th>
                <th {...thRiwayat('logCategory')} className="sortable-th">Tipe <SortIcon colKey="logCategory" sortKey={sortKeyRiwayat} sortDir={sortDirRiwayat} /></th>
                <th {...thRiwayat('date')} className="sortable-th">Tanggal <SortIcon colKey="date" sortKey={sortKeyRiwayat} sortDir={sortDirRiwayat} /></th>
                <th {...thRiwayat('kiosName')} className="sortable-th">Nama Kios <SortIcon colKey="kiosName" sortKey={sortKeyRiwayat} sortDir={sortDirRiwayat} /></th>
                <th {...thRiwayat('doNo')} className="sortable-th" style={{ backgroundColor: '#dcfce7' }}>Nomor DO <SortIcon colKey="doNo" sortKey={sortKeyRiwayat} sortDir={sortDirRiwayat} /></th>
                <th {...thRiwayat('amount')} className="sortable-th">Nominal (Rp) <SortIcon colKey="amount" sortKey={sortKeyRiwayat} sortDir={sortDirRiwayat} /></th>
                <th>Metode / Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRiwayat.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{log.id}</td>
                  <td>
                    <span className={`badge ${log.logCategory?.includes('Pelunasan') ? 'badge-success' : 'badge-info'}`}>
                      {log.logCategory || 'Log'}
                    </span>
                  </td>
                  <td>{formatDateDisplay(log.date)}</td>
                  <td>
                    <span
                      onClick={() => handleOpenKiosHistoryByKiosId(log.kiosId, log.kiosName)}
                      style={{
                        fontWeight: 700,
                        color: '#15803d',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px'
                      }}
                      title="Klik untuk melihat riwayat transaksi kios ini"
                    >
                      {log.kiosName}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>{log.doNo || '-'}</td>
                  <td style={{ fontWeight: 800, color: log.logCategory?.includes('Pelunasan') ? '#15803d' : '#1d4ed8' }}>
                    {formatRp(log.amount)}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {log.method ? `[${log.method}] ` : ''}{log.notes || '-'}
                  </td>
                  <td>
                    {!log.isDirectTrx && (
                      <button
                        className="btn-danger"
                        style={{ fontSize: '11px', padding: '3px 7px' }}
                        onClick={() => log.logCategory === 'Pelunasan' ? onDeletePayment(log.id) : onDeleteDeposit(log.id)}
                      >
                        Hapus
                      </button>
                    )}
                    {log.isDirectTrx && (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>Terikat SJ</span>
                    )}
                  </td>
                </tr>
              ))}

              {(payments.length === 0 && deposits.length === 0) && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Belum ada log pelunasan atau deposit.</td></tr>
              )}
            </tbody>
          </table>
          <TablePagination 
            currentPage={pageRiwayat} totalPages={totalRiwayat} 
            setCurrentPage={setPageRiwayat} totalItems={riwayatLogs.length} 
            itemsPerPage={limitRiwayat} setItemsPerPage={setLimitRiwayat}
          />
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL RIWAYAT TRANSAKSI KIOS
         ══════════════════════════════════════ */}
      {historyKios && (
        <ModalKiosHistory
          kios={historyKios}
          penyaluranList={penyaluranList}
          payments={payments}
          deposits={deposits}
          onClose={() => setHistoryKios(null)}
          onOpenPayment={handleOpenPayment}
          onOpenDeposit={handleOpenDeposit}
        />
      )}

      {/* ══════════════════════════════════════
          MODAL 1: FORM TERIMA PELUNASAN
         ══════════════════════════════════════ */}
      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>Catat Pelunasan / Kekurangan Pembayaran Kios</div>
              <button className="btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>Tutup</button>
            </div>
            <form onSubmit={handleSubmitPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Pilih Kios Pengecer:</label>
                  <select className="form-select" value={payKiosId} onChange={(e) => {
                    const newKId = e.target.value;
                    setPayKiosId(newKId);
                    setPayPenyaluranId('');
                    setUseDepositForPayment(isKiosDeductEnabled(newKId));
                  }} required>
                    <option value="">-- Pilih Kios --</option>
                    {filteredKiosks.map(k => <option key={k.id} value={k.id}>{k.name} ({k.owner})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Pilih Tagihan / Nomor DO (Tempo):</label>
                  <select className="form-select" value={payPenyaluranId} onChange={(e) => {
                    setPayPenyaluranId(e.target.value);
                    const p = (penyaluranList || []).find(x => x && x.id === e.target.value);
                    if (p) {
                      const stats = getPenyaluranPaymentStats(p);
                      setPayAmount(stats.sisa > 0 ? stats.sisa : stats.totalTagihan);
                    }
                  }}>
                    <option value="">-- Bebas / Pelunasan Umum --</option>
                    {(penyaluranList || []).filter(p => p && p.kiosId === payKiosId).map(p => {
                      const stats = getPenyaluranPaymentStats(p);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.doNo} — {p.fertilizerName} ({p.qtyTon} Ton) | Kekurangan: {formatRp(stats.sisa)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Info Saldo Deposit Kios */}
                {availablePayKiosDeposit > 0 && (
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 700 }}>
                        Saldo Deposit Tersedia Kios Ini:
                      </span>
                      <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>{formatRp(availablePayKiosDeposit)}</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: '#1e3a8a' }}>
                      <input 
                        type="checkbox" 
                        checked={useDepositForPayment} 
                        onChange={(e) => setUseDepositForPayment(e.target.checked)} 
                        style={{ width: '16px', height: '16px', accentColor: '#1d4ed8' }}
                      />
                      Gunakan Saldo Deposit Kios Ini untuk Mengurangi Tagihan
                    </label>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tanggal Bayar:</label>
                    <input type="date" className="form-input" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Metode Pembayaran:</label>
                    <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="Cek / Bilyet Giro">Cek / Giro</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Nominal Pelunasan (Rp):</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="misal: 5.000.000" 
                    value={payAmount ? formatCurrencyInput(payAmount) : ''} 
                    onChange={(e) => setPayAmount(parseCurrencyInput(e.target.value))} 
                    required 
                  />
                </div>

                {/* Preview Potongan Deposit jika dicentang */}
                {useDepositForPayment && availablePayKiosDeposit > 0 && Number(payAmount || 0) > 0 && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Dipotong dari Deposit:</span>
                      <strong style={{ color: '#1d4ed8' }}>- {formatRp(Math.min(availablePayKiosDeposit, Number(payAmount)))}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '4px', fontWeight: 800 }}>
                      <span>Sisa Kekurangan Dibayar Cash/TF:</span>
                      <strong style={{ color: '#15803d' }}>{formatRp(Math.max(0, Number(payAmount) - availablePayKiosDeposit))}</strong>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Catatan / No. Bukti Transfer:</label>
                  <input type="text" className="form-input" placeholder="misal: TF Bank Mandiri an. Sugeng" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#15803d' }}>Simpan Pelunasan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL 2: FORM CATAT DEPOSIT KIOS
         ══════════════════════════════════════ */}
      {isDepositModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>Catat Deposit Kios Baru</div>
              <button className="btn-secondary" onClick={() => setIsDepositModalOpen(false)}>Tutup</button>
            </div>
            <form onSubmit={handleSubmitDeposit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Pilih Kios Pengecer:</label>
                  <select className="form-select" value={depKiosId} onChange={(e) => setDepKiosId(e.target.value)} required>
                    <option value="">-- Pilih Kios --</option>
                    {filteredKiosks.map(k => <option key={k.id} value={k.id}>{k.name} ({k.owner})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Terkait Nomor DO (Opsional):</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="misal: DO/TMB-MGT/2607/001 (Opsional)"
                    value={depDoNo}
                    onChange={(e) => setDepDoNo(e.target.value)}
                  />
                  <small style={{ color: '#6b7280' }}>Jika deposit ini diniatkan untuk penebusan DO tertentu.</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tanggal Deposit:</label>
                    <input type="date" className="form-input" value={depDate} onChange={(e) => setDepDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nominal Deposit (Rp):</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="misal: 10.000.000" 
                      value={depAmount ? formatCurrencyInput(depAmount) : ''} 
                      onChange={(e) => setDepAmount(parseCurrencyInput(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan Deposit:</label>
                  <input type="text" className="form-input" placeholder="misal: Uang muka Penebusan Phonska Agustus" value={depNotes} onChange={(e) => setDepNotes(e.target.value)} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsDepositModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary" style={{ backgroundColor: '#1d4ed8' }}>Simpan Deposit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


