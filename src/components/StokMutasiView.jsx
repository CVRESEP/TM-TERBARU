import React from 'react';

export default function StokMutasiView({ 
  selectedBranch, 
  penebusanList, 
  doList, 
  penyaluranList, 
  fertilizers 
}) {
  const filterByBranch = (item) => selectedBranch === 'ALL' || item.branch === selectedBranch;

  const currentPenebusan = penebusanList.filter(filterByBranch);
  const currentDO = doList.filter(filterByBranch);
  const currentPenyaluran = penyaluranList.filter(filterByBranch);

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Rekap Stok & Mutasi Realtime (Satuan: TON)</h2>
          <p className="page-desc">Monitoring saldo kuota penebusan, stok fisik gudang distributor, dan total penyaluran ke kios per jenis pupuk.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '15px' }}>
        <div className="card-title">Rincian Saldo Mutasi Pupuk ({selectedBranch === 'ALL' ? 'Semua Cabang' : `Cabang ${selectedBranch}`})</div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Jenis Pupuk</th>
              <th>1. Total Penebusan (Ton)</th>
              <th>2. Total DO Diambil (Ton)</th>
              <th>Sisa Kuota Supplier (Ton)</th>
              <th>Stok Fisik Gudang Kita (Ton)</th>
              <th>3. Total Salur Kios (Ton)</th>
              <th>Status Stok Gudang</th>
            </tr>
          </thead>
          <tbody>
            {fertilizers.map((fert) => {
              const fertPenebusan = currentPenebusan.filter(p => p.fertilizerId === fert.id).reduce((s, i) => s + Number(i.qtyTon || i.qtyBags * 0.05 || 0), 0);
              const fertDO = currentDO.filter(d => d.fertilizerId === fert.id).reduce((s, i) => s + Number(i.qtyTon || i.qtyBags * 0.05 || 0), 0);
              const fertSalur = currentPenyaluran.filter(s => s.fertilizerId === fert.id).reduce((s, i) => s + Number(i.qtyTon || i.qtyBags * 0.05 || 0), 0);

              const stokGudangTon = Math.max(0, fertDO - fertSalur);
              const sisaQuotaTon = Math.max(0, fertPenebusan - fertDO);

              return (
                <tr key={fert.id}>
                  <td style={{ fontWeight: 700 }}>{fert.name}</td>
                  <td>{fertPenebusan.toFixed(1)} Ton</td>
                  <td>{fertDO.toFixed(1)} Ton</td>
                  <td style={{ color: sisaQuotaTon > 0 ? '#1d4ed8' : '#9ca3af' }}>{sisaQuotaTon.toFixed(1)} Ton</td>
                  <td style={{ fontWeight: 800, color: stokGudangTon > 0 ? '#15803d' : '#dc2626' }}>
                    {stokGudangTon.toFixed(1)} Ton
                  </td>
                  <td>{fertSalur.toFixed(1)} Ton</td>
                  <td>
                    {stokGudangTon > 5 ? (
                      <span className="badge badge-success">Stok Aman</span>
                    ) : stokGudangTon > 0 ? (
                      <span className="badge badge-warning">Stok Terbatas</span>
                    ) : (
                      <span className="badge badge-danger">Stok Kosong</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
