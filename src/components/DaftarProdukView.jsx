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
  const [buyPrice, setBuyPrice] = useState(2100000);
  const [sellPrice, setSellPrice] = useState(2250000);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [priceChangeNotes, setPriceChangeNotes] = useState('');

  const filtered = fertilizers.filter(item => {
    const matchBranch = selectedBranch === 'ALL' || !item.branch || item.branch === 'ALL' || item.branch === selectedBranch;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchBranch && matchSearch;
  });

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setBranch(selectedBranch !== 'ALL' ? selectedBranch : 'ALL');
    setBuyPrice(2100000);
    setSellPrice(2250000);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setPriceChangeNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setName(item.name);
    setBranch(item.branch || 'ALL');
    setBuyPrice(item.buyPrice || item.defaultPriceTon || 2100000);
    setSellPrice(item.sellPrice || item.defaultPriceTon || 2250000);
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setPriceChangeNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bPrice = Number(buyPrice);
    const sPrice = Number(sellPrice);

    if (editingItem) {
      const prevBuy = editingItem.buyPrice || editingItem.defaultPriceTon || 0;
      const prevSell = editingItem.sellPrice || editingItem.defaultPriceTon || 0;

      let updatedHistory = [...(editingItem.priceHistory || [])];

      // If price changed, push to history timeline using effectiveDate
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
        name,
        branch,
        buyPrice: bPrice,
        sellPrice: sPrice,
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
        name,
        branch,
        unit: 'Ton',
        buyPrice: bPrice,
        sellPrice: sPrice,
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

  return (
    <div>
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Master Daftar Produk & Harga Pupuk</h2>
          <p className="page-desc">Kelola patokan <strong>Harga Beli (Penebusan)</strong> dari supplier dan <strong>Harga Jual (Penyaluran)</strong> per cabang. Klik nama produk untuk melihat riwayat perubahan harga.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          + Tambah Produk Baru
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <input 
            type="text" 
            placeholder="Cari nama produk / kode..." 
            className="search-input" 
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
              <th>Cabang</th>
              <th>ID Produk</th>
              <th>Nama Produk Pupuk</th>
              <th>Satuan</th>
              <th style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Harga Beli / Ton (Penebusan)</th>
              <th style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>Harga Jual / Ton (Penyaluran)</th>
              <th>Margin / Ton</th>
              <th>Riwayat Harga</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const bPrice = item.buyPrice || item.defaultPriceTon || 0;
              const sPrice = item.sellPrice || item.defaultPriceTon || 0;
              const margin = sPrice - bPrice;
              const historyCount = (item.priceHistory || []).length;
              const itemBranch = item.branch || 'ALL';

              return (
                <tr key={item.id}>
                  <td>
                    <span className={`badge ${itemBranch === 'Magetan' ? 'badge-branch-magetan' : itemBranch === 'Sragen' ? 'badge-branch-sragen' : 'badge-info'}`}>
                      {itemBranch === 'ALL' ? 'Semua Cabang' : itemBranch}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{item.id}</td>
                  <td>
                    <span
                      onClick={() => setHistoryProduct(item)}
                      style={{
                        fontWeight: 800,
                        color: '#15803d',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px'
                      }}
                      title="Klik untuk melihat riwayat perubahan harga produk ini"
                    >
                      {item.name}
                    </span>
                  </td>
                  <td><span className="badge badge-info">Ton</span></td>
                  <td style={{ fontWeight: 700, color: '#1d4ed8' }}>{formatRp(bPrice)}</td>
                  <td style={{ fontWeight: 800, color: '#15803d' }}>{formatRp(sPrice)}</td>
                  <td style={{ fontWeight: 700, color: margin >= 0 ? '#16a34a' : '#dc2626' }}>
                    {formatRp(margin)}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 7px', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                      onClick={() => setHistoryProduct(item)}
                    >
                      Riwayat ({historyCount})
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-secondary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => handleOpenEdit(item)}>Edit</button>
                      <button className="btn-danger" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => onDeleteFertilizer(item.id)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
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
                  <label className="form-label">Satuan Produk:</label>
                  <input type="text" className="form-input" value="Ton" disabled />
                  <small style={{ color: '#6b7280' }}>Satuan standar aplikasi adalah TON.</small>
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



