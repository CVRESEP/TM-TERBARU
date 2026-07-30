import { useState, useMemo } from 'react';

/**
 * Mendapatkan nilai atribut dari object dengan dukungan alias field (misal qty vs qtyTon).
 */
function getFieldValue(item, key) {
  if (!item) return '';
  if (item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
  
  const aliases = {
    qtyTon: ['qty', 'jumlah', 'qty_ton'],
    totalAmount: ['totalCost', 'totalBiaya', 'total', 'grandTotal', 'amount'],
    supplierName: ['supplier', 'supplier_name', 'namaSupplier'],
    fertilizerName: ['fertilizer', 'produk', 'pupuk', 'namaPupuk'],
    kiosName: ['kios', 'namaKios', 'kioskName'],
    driverName: ['driver', 'supir', 'namaSupir'],
    pricePerTon: ['price', 'harga', 'hargaSatuan'],
    paymentStatus: ['status', 'statusPembayaran']
  };

  if (aliases[key]) {
    for (const alias of aliases[key]) {
      if (item[alias] !== undefined && item[alias] !== null && item[alias] !== '') {
        return item[alias];
      }
    }
  }
  return '';
}

/**
 * Parsing tanggal dari berbagai format string (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, ISO).
 */
function parseDateValue(val) {
  if (!val) return NaN;
  if (val instanceof Date) return val.getTime();
  const str = String(val).trim();
  
  if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(str)) {
    const t = Date.parse(str);
    if (!isNaN(t)) return t;
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }
  const fallback = Date.parse(str);
  return isNaN(fallback) ? NaN : fallback;
}

// ─── Komponen mandiri (bukan di dalam hook) ───────────────────────────
export function SortIcon({ colKey, sortKey, sortDir }) {
  if (sortKey !== colKey) {
    return <span className="sort-icon sort-icon--idle">⇅</span>;
  }
  return (
    <span className="sort-icon sort-icon--active">
      {sortDir === 'asc' ? '▲' : '▼'}
    </span>
  );
}

// ─── Hook utama ───────────────────────────────────────────────────────
export function useSortableTable(data, defaultKey = '', defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !Array.isArray(data)) return data;

    return [...data].sort((a, b) => {
      const valA = getFieldValue(a, sortKey);
      const valB = getFieldValue(b, sortKey);

      // Handle null/empty values (taruh nilai kosong di paling bawah)
      const emptyA = valA === undefined || valA === null || valA === '';
      const emptyB = valB === undefined || valB === null || valB === '';
      if (emptyA && emptyB) return 0;
      if (emptyA) return 1;
      if (emptyB) return -1;

      // 1. Sorting Tanggal
      if (sortKey.toLowerCase().includes('date') || sortKey.toLowerCase().includes('tanggal')) {
        const dateA = parseDateValue(valA);
        const dateB = parseDateValue(valB);
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
        }
      }

      // 2. Sorting Angka / Numeric fields
      const isNumericField = /qty|amount|cost|price|total|biaya|sisa|terbayar|kurang/i.test(sortKey);
      if (isNumericField || (typeof valA === 'number' && typeof valB === 'number')) {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }

      // 3. String / Natural Sorting (DO No, Nama, Status)
      const strA = String(valA);
      const strB = String(valB);
      const res = strA.localeCompare(strB, 'id-ID', { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? res : -res;
    });
  }, [data, sortKey, sortDir]);

  const thProps = (colKey) => ({
    className: 'sortable-th',
    onClick: () => handleSort(colKey),
    'data-active': sortKey === colKey ? 'true' : undefined,
  });

  return { sorted, sortKey, sortDir, handleSort, thProps };
}
