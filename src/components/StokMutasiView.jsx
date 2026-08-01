import React, { useState } from 'react';
import { normalizeProductName } from '../utils/dataNormalizer';

export default function StokMutasiView({ 
  selectedBranch, 
  penebusanList = [], 
  doList = [], 
  penyaluranList = [], 
  fertilizers = [] 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filterByBranch = (item) => {
    if (selectedBranch === 'ALL') return true;
    const b = (item.branch || item.kabupaten || '').toUpperCase();
    return b.includes(selectedBranch.toUpperCase());
  };

  const currentPenebusan = penebusanList.filter(filterByBranch);
  const currentDO = doList.filter(filterByBranch);
  const currentPenyaluran = penyaluranList.filter(filterByBranch);

  // Map Penebusan ID/noDo to Penebusan item for DO product name linking
  const penMap = {};
  penebusanList.forEach(p => {
    if (p.id) penMap[p.id] = p;
    if (p.doNo) penMap[p.doNo] = p;
    if (p.noDo) penMap[p.noDo] = p;
  });

  const getNormProductName = (item) => {
    const linkedPen = penMap[item.doNo || item.penebusanId || item.id] || {};
    const raw = item.fertilizerName || item.namaProduk || item.pupuk || linkedPen.fertilizerName || linkedPen.namaProduk || '';
    const branch = item.branch || item.kabupaten || linkedPen.branch || linkedPen.kabupaten || 'MAGETAN';
    return normalizeProductName(raw, branch);
  };

  // Group active database transactions by normalized Master Product name
  const allProductMap = new Map();

  fertilizers.forEach(f => {
    if (f.name) {
      const normName = normalizeProductName(f.name, f.branch || f.kabupaten || selectedBranch);
      allProductMap.set(normName, { id: f.id || normName, name: normName });
    }
  });

  [...currentPenebusan, ...currentDO, ...currentPenyaluran].forEach(item => {
    const normName = getNormProductName(item);
    if (normName && normName !== 'Pupuk') {
      if (!allProductMap.has(normName)) {
        allProductMap.set(normName, { id: normName, name: normName });
      }
    }
  });

  const productList = Array.from(allProductMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  // Calculate row stats for each product
  const rowData = productList.map(fert => {
    const fertNorm = fert.name.toUpperCase();

    const matchesFert = (item) => {
      const itemNorm = getNormProductName(item).toUpperCase();
      return itemNorm === fertNorm;
    };

    const totalPenebusan = currentPenebusan.filter(matchesFert).reduce((s, i) => s + Number(i.qtyTon || (i.qty ? Number(i.qty) : 0) || 0), 0);
    const totalDO = currentDO.filter(matchesFert).reduce((s, i) => s + Number(i.qtyTon || (i.qty ? Number(i.qty) : 0) || 0), 0);
    const totalSalur = currentPenyaluran.filter(matchesFert).reduce((s, i) => s + Number(i.qtyTon || (i.qty ? Number(i.qty) : 0) || 0), 0);

    const sisaQuota = totalPenebusan - totalDO;
    const stokGudang = totalDO - totalSalur;

    return {
      ...fert,
      totalPenebusan,
      totalDO,
      sisaQuota,
      stokGudang,
      totalSalur
    };
  }).filter(r => r.totalPenebusan > 0 || r.totalDO > 0 || r.totalSalur > 0);

  const filteredData = rowData.filter(item => 
    !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Overall totals
  const grandTotalPenebusan = rowData.reduce((acc, r) => acc + r.totalPenebusan, 0);
  const grandTotalDO = rowData.reduce((acc, r) => acc + r.totalDO, 0);
  const grandTotalSisaQuota = rowData.reduce((acc, r) => acc + r.sisaQuota, 0);
  const grandTotalStokGudang = rowData.reduce((acc, r) => acc + r.stokGudang, 0);
  const grandTotalSalur = rowData.reduce((acc, r) => acc + r.totalSalur, 0);

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Rekap Stok & Mutasi Realtime (Satuan: TON)</h2>
          <p className="page-desc">Monitoring total stok fisik gudang, sisa kuota penebusan, dan penyaluran per jenis produk pupuk.</p>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Stok Gudang Fisik</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: grandTotalStokGudang >= 0 ? '#15803d' : '#dc2626', marginTop: '4px' }}>
            {grandTotalStokGudang.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 600 }}>Ton</span>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Total DO - Total Penyaluran</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Kuota Penebusan</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
            {grandTotalPenebusan.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 600 }}>Ton</span>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Total Penebusan Produsen</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #9333ea' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Pengeluaran DO</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#7e22ce', marginTop: '4px' }}>
            {grandTotalDO.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 600 }}>Ton</span>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Masuk Gudang Distributor</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Sisa Kuota DO</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: grandTotalSisaQuota >= 0 ? '#c2410c' : '#dc2626', marginTop: '4px' }}>
            {grandTotalSisaQuota.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 600 }}>Ton</span>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Belum Dikeluarkan dari Pabrik</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Penyaluran Kios</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0e7490', marginTop: '4px' }}>
            {grandTotalSalur.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 600 }}>Ton</span>
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Tersalurkan ke Kios Pengecer</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="card-title" style={{ margin: 0 }}>
            Rincian Total Stok & Mutasi Per Produk ({selectedBranch === 'ALL' ? 'Semua Cabang' : `Cabang ${selectedBranch}`})
          </div>
          <input 
            type="text" 
            placeholder="Cari Produk Pupuk..." 
            className="search-input"
            style={{ maxWidth: '250px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Jenis / Nama Produk</th>
              <th className="text-right">Total Penebusan (Ton)</th>
              <th className="text-right">Total DO (Ton)</th>
              <th className="text-right">Sisa Kuota DO (Ton)</th>
              <th className="text-right" style={{ backgroundColor: '#dcfce7' }}>Stok Gudang (Ton)</th>
              <th className="text-right">Total Salur (Ton)</th>
              <th className="text-center">Status Stok</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700 }}>{item.name}</td>
                <td className="text-right">{item.totalPenebusan.toFixed(1)} Ton</td>
                <td className="text-right">{item.totalDO.toFixed(1)} Ton</td>
                <td className="text-right" style={{ color: item.sisaQuota > 0 ? '#1d4ed8' : (item.sisaQuota < 0 ? '#dc2626' : '#9ca3af'), fontWeight: 700 }}>
                  {item.sisaQuota.toFixed(1)} Ton
                </td>
                <td className="text-right" style={{ fontWeight: 800, backgroundColor: '#f0fdf4', color: item.stokGudang > 0 ? '#15803d' : (item.stokGudang < 0 ? '#dc2626' : '#4b5563') }}>
                  {item.stokGudang.toFixed(1)} Ton
                </td>
                <td className="text-right">{item.totalSalur.toFixed(1)} Ton</td>
                <td className="text-center">
                  {item.stokGudang > 5 ? (
                    <span className="badge badge-success">Stok Melimpah</span>
                  ) : item.stokGudang > 0 ? (
                    <span className="badge badge-warning">Stok Terbatas</span>
                  ) : item.stokGudang < 0 ? (
                    <span className="badge badge-danger">Minus (Over-Salur)</span>
                  ) : (
                    <span className="badge badge-secondary" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>Kosong</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Tidak ada data produk yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc', fontWeight: 800, borderTop: '2px solid #e2e8f0' }}>
                <td style={{ fontSize: '13px' }}>TOTAL KESELURUHAN</td>
                <td className="text-right" style={{ color: '#1d4ed8' }}>{grandTotalPenebusan.toFixed(1)} Ton</td>
                <td className="text-right" style={{ color: '#7e22ce' }}>{grandTotalDO.toFixed(1)} Ton</td>
                <td className="text-right" style={{ color: '#c2410c' }}>{grandTotalSisaQuota.toFixed(1)} Ton</td>
                <td className="text-right" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '14px' }}>
                  {grandTotalStokGudang.toFixed(1)} Ton
                </td>
                <td className="text-right" style={{ color: '#0e7490' }}>{grandTotalSalur.toFixed(1)} Ton</td>
                <td className="text-center">
                  <span className="badge badge-success" style={{ padding: '4px 10px' }}>REKAP FINAL</span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
