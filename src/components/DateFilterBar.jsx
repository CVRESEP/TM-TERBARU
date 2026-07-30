import React from 'react';

/**
 * Helper untuk mencocokkan tanggal transaksi dengan filter tanggal
 */
export function matchesDateFilter(itemDateStr, filterState) {
  if (!filterState || !filterState.mode || filterState.mode === 'all') return true;
  if (!itemDateStr) return false;

  const cleanDate = String(itemDateStr).trim().slice(0, 10);
  if (!cleanDate) return true;

  // 1. Filtrasi Harian
  if (filterState.mode === 'daily') {
    if (!filterState.dailyDate) return true;
    return cleanDate === filterState.dailyDate;
  }

  // 2. Filtrasi Rentang Tanggal
  if (filterState.mode === 'range') {
    const { startDate, endDate } = filterState;
    if (startDate && cleanDate < startDate) return false;
    if (endDate && cleanDate > endDate) return false;
    return true;
  }

  // 3. Filtrasi Bulan & Tahun
  if (filterState.mode === 'monthYear') {
    const { month, year } = filterState;
    const [y, m] = cleanDate.split('-');
    if (year && y !== String(year)) return false;
    if (month && m !== String(month).padStart(2, '0')) return false;
    return true;
  }

  return true;
}

const MONTH_NAMES = [
  { val: '01', name: 'Januari' },
  { val: '02', name: 'Februari' },
  { val: '03', name: 'Maret' },
  { val: '04', name: 'April' },
  { val: '05', name: 'Mei' },
  { val: '06', name: 'Juni' },
  { val: '07', name: 'Juli' },
  { val: '08', name: 'Agustus' },
  { val: '09', name: 'September' },
  { val: '10', name: 'Oktober' },
  { val: '11', name: 'November' },
  { val: '12', name: 'Desember' }
];

const YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function DateFilterBar({ filterState, setFilterState }) {
  const mode = filterState.mode || 'all';

  const handleModeChange = (newMode) => {
    setFilterState(prev => ({
      ...prev,
      mode: newMode
    }));
  };

  const handleReset = () => {
    setFilterState({
      mode: 'all',
      dailyDate: '',
      startDate: '',
      endDate: '',
      month: '',
      year: new Date().getFullYear().toString()
    });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
      backgroundColor: '#f8fafc',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      marginBottom: '10px',
      fontSize: '13px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#334155' }}>
        <span>📅 Filter Tanggal:</span>
        <select
          className="filter-select"
          style={{ fontWeight: 600, color: '#1e293b', padding: '4px 8px' }}
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          <option value="all">Semua Tanggal</option>
          <option value="daily">1. Tanggal Terpilih (Harian)</option>
          <option value="range">2. Rentang Tanggal</option>
          <option value="monthYear">3. Bulan & Tahun</option>
        </select>
      </div>

      {/* Mode 1: Harian */}
      {mode === 'daily' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#64748b' }}>Pilih Tanggal:</span>
          <input
            type="date"
            className="search-input"
            style={{ padding: '4px 8px' }}
            value={filterState.dailyDate || ''}
            onChange={(e) => setFilterState(prev => ({ ...prev, dailyDate: e.target.value }))}
          />
        </div>
      )}

      {/* Mode 2: Rentang Tanggal */}
      {mode === 'range' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#64748b' }}>Dari:</span>
          <input
            type="date"
            className="search-input"
            style={{ padding: '4px 8px' }}
            value={filterState.startDate || ''}
            onChange={(e) => setFilterState(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <span style={{ color: '#64748b' }}>s/d:</span>
          <input
            type="date"
            className="search-input"
            style={{ padding: '4px 8px' }}
            value={filterState.endDate || ''}
            onChange={(e) => setFilterState(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      )}

      {/* Mode 3: Bulan & Tahun */}
      {mode === 'monthYear' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#64748b' }}>Bulan:</span>
          <select
            className="filter-select"
            style={{ padding: '4px 8px' }}
            value={filterState.month || ''}
            onChange={(e) => setFilterState(prev => ({ ...prev, month: e.target.value }))}
          >
            <option value="">-- Semua Bulan --</option>
            {MONTH_NAMES.map(m => (
              <option key={m.val} value={m.val}>{m.name}</option>
            ))}
          </select>

          <span style={{ color: '#64748b' }}>Tahun:</span>
          <select
            className="filter-select"
            style={{ padding: '4px 8px' }}
            value={filterState.year || ''}
            onChange={(e) => setFilterState(prev => ({ ...prev, year: e.target.value }))}
          >
            <option value="">-- Semua Tahun --</option>
            {YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {mode !== 'all' && (
        <button
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '3px 8px', marginLeft: 'auto', backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}
          onClick={handleReset}
          title="Reset filter ke Semua Tanggal"
        >
          ✕ Reset Filter
        </button>
      )}
    </div>
  );
}
