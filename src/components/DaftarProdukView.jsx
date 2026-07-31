import React, { useState } from 'react';
import ModalPriceHistory from './ModalPriceHistory';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currency';

export default function DaftarProdukView({ 
  selectedBranch = 'ALL',
  settings = {},
  fertilizers = [], 
  onAddFertilizer,
  onEditFertilizer,
  onDeleteFertilizer 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [historyProduct, setHistoryProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [supplier, setSupplier] = useState('PT PETROKIMIA GRESIK');
  const [buyPrice, setBuyPrice] = useState(2100000);
  const [sellPrice, setSellPrice] = useState(2250000);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [priceChangeNotes, setPriceChangeNotes] = useState('');

  const filtered = fertilizers.filter(item => {
    const matchBranch = selectedBranch === 'ALL' || !item.branch || item.branch === 'ALL' || item.branch === selectedBranch;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        item.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchBranch && matchSearch;
  });

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setBranch(selectedBranch !== 'ALL' ? selectedBranch : 'ALL');
    setSupplier('PT PETROKIMIA GRESIK');
    setBuyPrice(2100000);
    setSellPrice(2250000);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setPriceChangeNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setName(item.name || item.fertilizerName || item.pupukName || '');
    setBranch(item.branch || 'ALL');
    setSupplier(item.supplier || item.supplierName || 'PT PETROKIMIA GRESIK');
    setBuyPrice(item.buyPrice || item.priceBuy || item.defaultPriceTon || item.pricePerTon || 2100000);
    setSellPrice(item.sellPrice || item.priceSell || item.defaultPriceTon || item.pricePerTon || 2250000);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setPriceChangeNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bPrice = Number(buyPrice);
    const sPrice = Number(sellPrice);

    if (editingItem) {
      const prevBuy = editingItem.buyPrice || editingItem.priceBuy || editingItem.defaultPriceTon || 0;
      const prevSell = editingItem.sellPrice || editingItem.priceSell || editingItem.defaultPriceTon || 0;

      let updatedHistory = [...(editingItem.priceHistory || [])];

      if (bPrice !== prevBuy || sPrice !== prevSell) {
        const historyEntry = {
          date: effectiveDate || new Date().toISOString().split('T')[0],
          oldBuyPrice: prevBuy,
          newBuyPrice: bPrice,
          oldSellPrice: prevSell,
          newSellPrice: sPrice,
          notes: priceChangeNotes || 'Penyesuaian patokan harga terbaru'
        };
        updatedHistory = [historyEntry, ...updatedHistory];
      }

      onEditFertilizer({
        ...editingItem,
        name: name || editingItem.fertilizerName || editingItem.id,
        branch,
        supplier,
        buyPrice: bPrice,
        priceBuy: bPrice,
        sellPrice: sPrice,
        priceSell: sPrice,
        defaultPriceTon: sPrice,
        priceHistory: updatedHistory
      });
    } else {
      const initialHistory = [{
        date: effectiveDate || new Date().toISOString().split('T')[0],
        oldBuyPrice: bPrice,
        newBuyPrice: bPrice,
        oldSellPrice: sPrice,
        newSellPrice: sPrice,
        notes: 'Pendaftaran harga awal produk'
      }];

      const newProduct = {
        id: `PROD-${Date.now().toString().slice(-4)}`,
        name: name || 'PRODUK BARU',
        branch,
        supplier,
        unit: 'Ton',
        buyPrice: bPrice,
        priceBuy: bPrice,
        sellPrice: sPrice,
        priceSell: sPrice,
        defaultPriceTon: sPrice,
        priceHistory: initialHistory
      };
      onAddFertilizer(newProduct);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setName('');
    setBranch('ALL');
    setBuyPrice(2100000);
    setSellPrice(2250000);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setPriceChangeNotes('');
  };

  const isBranchLocked = selectedBranch !== 'ALL';

  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Master Daftar Produk & Harga Pupuk</h2>
          <p className="page-desc">Kelola patokan <strong>Harga Beli (Penebusan)</strong> dari supplier dan <strong>Harga Jual (Penyaluran)</strong> per cabang.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          + Tambah Produk Baru
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Cari nama produk / supplier..." 
            className="search-input" 
            style={{ width: '280px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Total: <strong>{filtered.length} Jenis Produk</strong>
          </span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ width: '60px' }}>NO</th>
              <th>NAMA PRODUK ↑↓</th>
              <th>KABUPATEN ↑↓</th>
              <th>SUPPLIER ↑↓</th>
              <th style={{ textAlign: 'right' }}>HARGA BELI ↑↓</th>
              <th style={{ textAlign: 'right' }}>HARGA JUAL ↑↓</th>
              <th style={{ textAlign: 'center', width: '120px' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const bPrice = Number(item.buyPrice || item.priceBuy || item.defaultPriceTon || item.pricePerTon || 0);
              const sPrice = Number(item.sellPrice || item.priceSell || item.defaultPriceTon || item.pricePerTon || 0);
              const prodName = item.name || item.fertilizerName || item.pupukName || item.id;
              const supplierName = item.supplier || item.supplierName || 'PT PETROKIMIA GRESIK';
              const itemBranch = (item.branch || 'MAGETAN').toUpperCase();
              const isChecked = selectedIds.includes(item.id);

              return (
                <tr 
                  key={item.id}
                  style={{ backgroundColor: isChecked ? '#f0f9ff' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setHistoryProduct(item)}
                  className="table-row-hover"
                >
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleSelectOne(item.id)}
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: '#374151' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 800, color: '#15803d' }}>
                    <span 
                      style={{ 
                        textDecoration: 'underline', 
                        textUnderlineOffset: '3px',
                        cursor: 'pointer' 
                      }}
                      title="Klik untuk melihat riwayat perubahan harga produk ini"
                    >
                      {prodName}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#374151' }}>
                    {itemBranch === 'ALL' ? 'SEMUA CABANG' : itemBranch}
                  </td>
                  <td style={{ fontWeight: 600, color: '#4b5563' }}>
                    {supplierName}
                  </td>
                  <td style={{ fontWeight: 700, color: '#111827', textAlign: 'right' }}>
                    Rp {bPrice.toLocaleString('id-ID')}
                  </td>
                  <td style={{ fontWeight: 800, color: '#111827', textAlign: 'right' }}>
                    Rp {sPrice.toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ fontSize: '11px', padding: '3px 8px', color: '#0369a1', borderColor: '#bae6fd' }} 
                        onClick={() => setHistoryProduct(item)}
                        title="Lihat Riwayat Harga"
                      >
                        Riwayat
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ fontSize: '11px', padding: '3px 8px' }} 
                        onClick={() => handleOpenEdit(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-danger" 
                        style={{ fontSize: '11px', padding: '3px 8px' }} 
                        onClick={() => onDeleteFertilizer(item.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Tidak ada produk pupuk yang sesuai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* POPUP MODAL RIWAYAT PERUBAHAN HARGA */}
      {historyProduct && (
        <ModalPriceHistory
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
          onOpenEdit={handleOpenEdit}
        />
      )}

      {/* POPUP MODAL TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>{editingItem ? 'Edit Harga & Data Produk Pupuk' : 'Tambah Produk Pupuk Baru'}</div>
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Tutup</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nama Produk Pupuk:</label>
                    <input type="text" className="form-input" placeholder="misal: NPK Phonska Bersubsidi" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cabang Operasional:</label>
                    <select
                      className="form-select"
                      value={isBranchLocked ? selectedBranch : branch}
                      onChange={(e) => !isBranchLocked && setBranch(e.target.value)}
                      disabled={isBranchLocked}
                      style={{ backgroundColor: isBranchLocked ? '#f3f4f6' : 'white', cursor: isBranchLocked ? 'not-allowed' : 'pointer' }}
                    >
                      <option value="ALL">Semua Cabang (Global)</option>
                      <option value={settings.branch1Name || 'Magetan'}>{settings.branch1Name || 'Magetan'}</option>
                      <option value={settings.branch2Name || 'Sragen'}>{settings.branch2Name || 'Sragen'}</option>
                    </select>
                    {isBranchLocked && <small style={{ color: '#dc2626', fontSize: '10px' }}>Terkunci ke cabang akun Anda ({selectedBranch}).</small>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier Produksi:</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="misal: PT PETROKIMIA GRESIK / PT PUPUK SRIWIDJAJA" 
                    value={supplier} 
                    onChange={(e) => setSupplier(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#1d4ed8', fontWeight: 700 }}>
                      Harga Beli / Ton (Penebusan):
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formatCurrencyInput(buyPrice)} 
                      onChange={(e) => setBuyPrice(parseCurrencyInput(e.target.value))} 
                      placeholder="misal: 2.100.000"
                      required 
                    />
                    <small style={{ color: '#6b7280' }}>Harga awal saat Penebusan dari Produsen.</small>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#15803d', fontWeight: 700 }}>
                      Harga Jual / Ton (Penyaluran):
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formatCurrencyInput(sellPrice)} 
                      onChange={(e) => setSellPrice(parseCurrencyInput(e.target.value))} 
                      placeholder="misal: 2.250.000"
                      required 
                    />
                    <small style={{ color: '#6b7280' }}>Harga penagihan ke Kios Pengecer.</small>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Tanggal Perubahan Harga / Berlaku:
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    required
                  />
                  <small style={{ color: '#6b7280' }}>Tanggal resmi saat patokan harga ini berlaku.</small>
                </div>

                {editingItem && (
                  <div className="form-group">
                    <label className="form-label">Alasan / Keterangan Perubahan Harga (Opsional):</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="misal: Penyesuaian HET Pabrik per 1 Agustus"
                      value={priceChangeNotes}
                      onChange={(e) => setPriceChangeNotes(e.target.value)}
                    />
                  </div>
                )}

                {Number(sellPrice) > 0 && Number(buyPrice) > 0 && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                    Estimasi Margin Keuntungan: <strong style={{ color: '#15803d' }}>{formatRp(Number(sellPrice) - Number(buyPrice))} / Ton</strong>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">{editingItem ? 'Simpan Perubahan' : 'Simpan Produk'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



