import React, { useState } from 'react';
import ModalKiosHistory from './ModalKiosHistory';

export default function MasterDataView({ 
  selectedBranch,
  kiosks = [], 
  suppliers = [], 
  drivers = [],
  penyaluranList = [],
  payments = [],
  deposits = [],
  onAddKios, 
  onAddSupplier,
  onAddDriver,
  onEditKios,
  onEditSupplier,
  onEditDriver, 
  onDeleteKios, 
  onDeleteSupplier,
  onDeleteDriver
}) {
  const [activeSection, setActiveSection] = useState('kios');
  const [searchKios, setSearchKios] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [historyKios, setHistoryKios] = useState(null);

  const [selectedKiosIds, setSelectedKiosIds] = useState([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([]);

  const filteredKiosks = kiosks.filter(k => {
    const matchBranch = selectedBranch === 'ALL' || k.branch === selectedBranch;
    const matchSearch = k.name.toLowerCase().includes(searchKios.toLowerCase()) || 
                        k.owner.toLowerCase().includes(searchKios.toLowerCase());
    return matchBranch && matchSearch;
  });

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchSupplier.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d => {
    const matchBranch = selectedBranch === 'ALL' || d.branch === selectedBranch;
    const matchSearch = (d.name || '').toLowerCase().includes(searchDriver.toLowerCase()) ||
                        (d.vehiclePlate || '').toLowerCase().includes(searchDriver.toLowerCase());
    return matchBranch && matchSearch;
  });

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Data Master Kios, Supir & Supplier</h2>
          <p className="page-desc">Kelola direktori kios pengecer, data supir & armada pengiriman, serta supplier pupuk.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={onAddKios}>+ Tambah Kios</button>
          <button className="btn-secondary" onClick={onAddDriver}>+ Tambah Supir</button>
          <button className="btn-secondary" onClick={onAddSupplier}>+ Tambah Supplier</button>
        </div>
      </div>

      {/* Section Toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button 
          className={activeSection === 'kios' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveSection('kios')}
        >
          Daftar Kios Pengecer ({filteredKiosks.length})
        </button>
        <button 
          className={activeSection === 'driver' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveSection('driver')}
        >
          Data Supir & Armada ({filteredDrivers.length})
        </button>
        <button 
          className={activeSection === 'supplier' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setActiveSection('supplier')}
        >
          Daftar Supplier / Produsen ({filteredSuppliers.length})
        </button>
      </div>

      {/* KIOS TABLE */}
      {activeSection === 'kios' && (
        <div className="table-container">
          {selectedKiosIds.length > 0 && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
                📌 <strong>{selectedKiosIds.length}</strong> data kios dipilih
              </span>
              <button 
                className="btn-danger" 
                style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus ${selectedKiosIds.length} kios terpilih?`)) {
                    selectedKiosIds.forEach(id => onDeleteKios(id));
                    setSelectedKiosIds([]);
                  }
                }}
              >
                🗑️ Hapus {selectedKiosIds.length} Kios Terpilih
              </button>
            </div>
          )}

          <div className="table-toolbar">
            <input 
              type="text" 
              placeholder="Cari nama kios / pemilik..." 
              className="search-input" 
              value={searchKios}
              onChange={(e) => setSearchKios(e.target.value)}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Total: <strong>{filteredKiosks.length} Kios</strong></span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredKiosks.length > 0 && filteredKiosks.every(k => selectedKiosIds.includes(k.id))}
                    onChange={() => {
                      if (filteredKiosks.every(k => selectedKiosIds.includes(k.id))) {
                        setSelectedKiosIds([]);
                      } else {
                        setSelectedKiosIds(filteredKiosks.map(k => k.id));
                      }
                    }}
                    title="Pilih Semua Kios"
                  />
                </th>
                <th>Kode Kios</th>
                <th>Nama Kios Pengecer</th>
                <th>Pemilik</th>
                <th>Cabang</th>
                <th>Alamat</th>
                <th>Telepon / WA</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredKiosks.map(k => (
                <tr key={k.id} style={{ backgroundColor: selectedKiosIds.includes(k.id) ? '#fef2f2' : undefined }}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedKiosIds.includes(k.id)}
                      onChange={() => {
                        setSelectedKiosIds(prev => prev.includes(k.id) ? prev.filter(i => i !== k.id) : [...prev, k.id]);
                      }}
                    />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{k.code || k.id}</td>
                  <td>
                    <span
                      onClick={() => setHistoryKios(k)}
                      style={{
                        fontWeight: 800,
                        color: '#15803d',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px'
                      }}
                      title="Klik untuk melihat riwayat transaksi lengkap kios ini"
                    >
                      {k.name}
                    </span>
                  </td>
                  <td>{k.owner}</td>
                  <td>
                    <span className={`badge ${k.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>
                      {k.branch}
                    </span>
                  </td>
                  <td>{k.address}</td>
                  <td>{k.phone}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => setHistoryKios(k)}>Riwayat</button>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onEditKios(k)}>Edit</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDeleteKios(k.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredKiosks.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    Belum ada kios. Klik "+ Tambah Kios" untuk menambah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {historyKios && (
        <ModalKiosHistory
          kios={historyKios}
          penyaluranList={penyaluranList}
          payments={payments}
          deposits={deposits}
          onClose={() => setHistoryKios(null)}
        />
      )}

      {/* DRIVER TABLE */}
      {activeSection === 'driver' && (
        <div className="table-container">
          {selectedDriverIds.length > 0 && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
                📌 <strong>{selectedDriverIds.length}</strong> data supir dipilih
              </span>
              <button 
                className="btn-danger" 
                style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus ${selectedDriverIds.length} supir terpilih?`)) {
                    selectedDriverIds.forEach(id => onDeleteDriver(id));
                    setSelectedDriverIds([]);
                  }
                }}
              >
                🗑️ Hapus {selectedDriverIds.length} Supir Terpilih
              </button>
            </div>
          )}

          <div className="table-toolbar">
            <input 
              type="text" 
              placeholder="Cari nama supir / plat nomor..." 
              className="search-input" 
              value={searchDriver}
              onChange={(e) => setSearchDriver(e.target.value)}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Total: <strong>{filteredDrivers.length} Supir</strong></span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredDrivers.length > 0 && filteredDrivers.every(d => selectedDriverIds.includes(d.id))}
                    onChange={() => {
                      if (filteredDrivers.every(d => selectedDriverIds.includes(d.id))) {
                        setSelectedDriverIds([]);
                      } else {
                        setSelectedDriverIds(filteredDrivers.map(d => d.id));
                      }
                    }}
                    title="Pilih Semua Supir"
                  />
                </th>
                <th>ID Supir</th>
                <th>Nama Supir</th>
                <th>Plat Nomor Truk</th>
                <th>Cabang</th>
                <th>Telepon / WA</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map(d => (
                <tr key={d.id} style={{ backgroundColor: selectedDriverIds.includes(d.id) ? '#fef2f2' : undefined }}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedDriverIds.includes(d.id)}
                      onChange={() => {
                        setSelectedDriverIds(prev => prev.includes(d.id) ? prev.filter(i => i !== d.id) : [...prev, d.id]);
                      }}
                    />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{d.id}</td>
                  <td style={{ fontWeight: 700 }}>{d.name}</td>
                  <td><span className="badge badge-info">{d.vehiclePlate}</span></td>
                  <td>
                    <span className={`badge ${d.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>
                      {d.branch}
                    </span>
                  </td>
                  <td>{d.phone || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onEditDriver(d)}>Edit</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDeleteDriver(d.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    Belum ada data supir. Klik "+ Tambah Supir" untuk menambah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUPPLIER TABLE */}
      {activeSection === 'supplier' && (
        <div className="table-container">
          {selectedSupplierIds.length > 0 && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#991b1b', fontWeight: 700 }}>
                📌 <strong>{selectedSupplierIds.length}</strong> data supplier dipilih
              </span>
              <button 
                className="btn-danger" 
                style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 800 }}
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus ${selectedSupplierIds.length} supplier terpilih?`)) {
                    selectedSupplierIds.forEach(id => onDeleteSupplier(id));
                    setSelectedSupplierIds([]);
                  }
                }}
              >
                🗑️ Hapus {selectedSupplierIds.length} Supplier Terpilih
              </button>
            </div>
          )}

          <div className="table-toolbar">
            <input 
              type="text" 
              placeholder="Cari nama supplier / produsen..." 
              className="search-input" 
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Total: <strong>{filteredSuppliers.length} Supplier</strong></span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredSuppliers.length > 0 && filteredSuppliers.every(s => selectedSupplierIds.includes(s.id))}
                    onChange={() => {
                      if (filteredSuppliers.every(s => selectedSupplierIds.includes(s.id))) {
                        setSelectedSupplierIds([]);
                      } else {
                        setSelectedSupplierIds(filteredSuppliers.map(s => s.id));
                      }
                    }}
                    title="Pilih Semua Supplier"
                  />
                </th>
                <th>ID Supplier</th>
                <th>Nama Produsen / Supplier</th>
                <th>Kontak / Telepon</th>
                <th>Alamat Depo / Gudang</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(s => (
                <tr key={s.id} style={{ backgroundColor: selectedSupplierIds.includes(s.id) ? '#fef2f2' : undefined }}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedSupplierIds.includes(s.id)}
                      onChange={() => {
                        setSelectedSupplierIds(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]);
                      }}
                    />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.id}</td>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.contact}</td>
                  <td>{s.address}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onEditSupplier(s)}>Edit</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDeleteSupplier(s.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                    Belum ada supplier. Klik "+ Tambah Supplier" untuk menambah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

