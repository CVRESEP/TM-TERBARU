import React, { useState, useRef } from 'react';

export default function ImportModuleButton({ 
  moduleName, 
  onImport, 
  disabled = false, 
  label = '📥 Import Data',
  style = {}
}) {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    if (!isExcel) {
      alert('Mohon pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        let jsonSheet = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
        
        if (jsonSheet.length === 0) {
          alert('Data pada file Excel/CSV kosong!');
          setIsImporting(false);
          return;
        }

        jsonSheet = fixMalformedCSVRows(jsonSheet);

        if (jsonSheet.length === 0) {
          alert('Tidak ada data valid setelah parsing. Periksa format file CSV.');
          setIsImporting(false);
          return;
        }

        // Delegate to onImport handler (opens slide modal with preview and mode selection)
        if (onImport) {
          await onImport(moduleName, jsonSheet, file.name);
        }
        
      } catch (err) {
        console.error('Import Error:', err);
        alert(`Gagal membaca file: ${err.message}`);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button 
        type="button"
        className="btn-secondary" 
        style={{ 
          backgroundColor: '#fef3c7', 
          color: '#92400e', 
          borderColor: '#fde68a',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          ...style
        }}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isImporting}
        title={`Import Data ${moduleName} dari Excel/CSV ke Database Turso`}
      >
        {isImporting ? '⏳ Membaca...' : label}
      </button>
    </>
  );
}

function fixMalformedCSVRows(rows) {
  if (!rows || rows.length === 0) return rows;
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const isMalformed = keys.length === 1 && keys[0].includes(',');
  if (!isMalformed) return rows;
  const headerRaw = keys[0].replace(/""/g, '"');
  const headers = parseCSVLine(headerRaw);
  console.log('[ImportModuleButton] Format CSV Firestore terdeteksi. Headers:', headers);
  const result = [];
  for (const row of rows) {
    const rawValue = row[keys[0]];
    if (rawValue === undefined || rawValue === null) continue;
    const valueStr = String(rawValue).replace(/""/g, '"');
    const values = parseCSVLine(valueStr);
    const obj = {};
    headers.forEach((h, i) => {
      const cleanHeader = h.replace(/^"(.*)"$/, '$1').trim();
      const cleanValue = (values[i] !== undefined ? String(values[i]) : '').replace(/^"(.*)"$/, '$1').trim();
      if (cleanHeader) obj[cleanHeader] = cleanValue;
    });
    const hasData = Object.values(obj).some(v => v && String(v).trim() !== '');
    if (hasData) result.push(obj);
  }
  console.log(`[ImportModuleButton] Berhasil parse ${result.length} baris dari format CSV Firestore.`);
  return result;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
