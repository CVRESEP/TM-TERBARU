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
              <th>Total Penebusan (Ton)</th>
              <th>Total DO (Ton)</th>
              <th>Sisa Penebusan (Ton)</th>
              <th>Stok Gudang (Ton)</th>
              <th>Total Salur (Ton)</th>
              <th>Status Stok</th>
            </tr>
          </thead>
          <tbody>
            {fertilizers.map((fert) => {
              const fertNameClean = (fert.name || '').trim().toLowerCase();

              const matchesFert = (item) => {
                if (item.fertilizerId && item.fertilizerId === fert.id) return true;
                const itemName = (item.fertilizerName || item.pupuk || item.namaPupuk || '').trim().toLowerCase();
                if (itemName && (itemName === fertNameClean || fertNameClean.includes(itemName) || itemName.includes(fertNameClean))) return true;
                return false;
              };

              const fertPenebusan = currentPenebusan.filter(matchesFert).reduce((s, i) => s + Number(i.qtyTon || (i.qtyBags ? i.qtyBags * 0.05 : 0) || 0), 0);
              const fertDO = currentDO.filter(matchesFert).reduce((s, i) => s + Number(i.qtyTon || (i.qtyBags ? i.qtyBags * 0.05 : 0) || 0), 0);
              const fertSalur = currentPenyaluran.filter(matchesFert).reduce((s, i) => s + Number(i.qtyTon || (i.qtyBags ? i.qtyBags * 0.05 : 0) || 0), 0);

              const stokGudangTon = fertDO - fertSalur;
              const sisaQuotaTon = fertPenebusan - fertDO;

              return (
                <tr key={fert.id}>
                  <td style={{ fontWeight: 700 }}>{fert.name}</td>
                  <td>{fertPenebusan.toFixed(1)} Ton</td>
                  <td>{fertDO.toFixed(1)} Ton</td>
                  <td style={{ color: sisaQuotaTon > 0 ? '#1d4ed8' : (sisaQuotaTon < 0 ? '#dc2626' : '#9ca3af'), fontWeight: 700 }}>
                    {sisaQuotaTon.toFixed(1)} Ton
                  </td>
                  <td style={{ fontWeight: 800, color: stokGudangTon > 0 ? '#15803d' : (stokGudangTon < 0 ? '#dc2626' : '#4b5563') }}>
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
