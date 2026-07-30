import React, { useState, useEffect } from 'react';
import ModalNotification from './ModalNotification';
import { formatCurrencyInput, parseCurrencyInput } from '../utils/currency';

export default function ModalTransaction({ 
  isOpen, onClose, formType,
  defaultBranch, suppliers, kiosks, fertilizers, drivers = [],
  penebusanList, doList, penyaluranList, onSave,
  editData = null, initialPenebusanId = '', initialDoRefId = ''
}) {
  if (!isOpen) return null;

  const [alertConfig, setAlertConfig] = useState(null);

  const isBranchLocked = defaultBranch !== 'ALL';
  const activeBranch = isBranchLocked ? defaultBranch : (editData?.branch || 'Magetan');

  const [branch, setBranch] = useState(activeBranch);

  useEffect(() => {
    if (isBranchLocked) {
      setBranch(defaultBranch);
    }
  }, [defaultBranch, isBranchLocked]);
  const [date, setDate] = useState(editData?.date || new Date().toISOString().split('T')[0]);
  const [doNo, setDoNo] = useState(editData?.doNo || '');
  const [supplierId, setSupplierId] = useState(editData?.supplierId || suppliers[0]?.id || '');
  const [fertilizerId, setFertilizerId] = useState(editData?.fertilizerId || fertilizers[0]?.id || 'UREA');
  const [qtyTon, setQtyTon] = useState(editData?.qtyTon || 10);
  const [pricePerTon, setPricePerTon] = useState(editData?.pricePerTon || 2250000);
  const [notes, setNotes] = useState(editData?.notes || '');

  // DO fields
  const [penebusanId, setPenebusanId] = useState(editData?.penebusanId || initialPenebusanId || '');
  const [driverName, setDriverName] = useState(editData?.driverName || '');
  const [vehiclePlate, setVehiclePlate] = useState(editData?.vehiclePlate || '');
  const [targetWarehouse, setTargetWarehouse] = useState(editData?.targetWarehouse || '');

  // Penyaluran fields
  const [doRefId, setDoRefId] = useState(editData?.doRefId || initialDoRefId || '');
  const [penyaluranNo, setPenyaluranNo] = useState(editData?.penyaluranNo || editData?.nomorPenyaluran || '');
  const [kiosId, setKiosId] = useState(editData?.kiosId || '');
  const [paymentStatus, setPaymentStatus] = useState(editData?.paymentStatus || 'Lunas');
  const [dpAmount, setDpAmount] = useState(editData?.dpAmount || 0);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Master data: Kios & Supplier
  const [kiosName, setKiosName] = useState(editData?.name || '');
  const [kiosOwner, setKiosOwner] = useState(editData?.owner || '');
  const [kiosAddress, setKiosAddress] = useState(editData?.address || '');
  const [kiosPhone, setKiosPhone] = useState(editData?.phone || '');
  const [supplierName, setSupplierName] = useState(editData?.name || '');
  const [supplierContact, setSupplierContact] = useState(editData?.contact || '');
  const [supplierAddress, setSupplierAddress] = useState(editData?.address || '');

  // Master data: Driver
  const [drName, setDrName] = useState(editData?.name || '');
  const [drPlate, setDrPlate] = useState(editData?.vehiclePlate || '');
  const [drPhone, setDrPhone] = useState(editData?.phone || '');

  const availablePenebusan = penebusanList.filter(p => p.branch === branch);
  const availableDoList = doList.filter(d => d.branch === branch);
  const availableKiosks = kiosks.filter(k => k.branch === branch);
  const availableDrivers = drivers.filter(d => d.branch === branch || d.branch === 'ALL');

  // Auto-fill from selected Penebusan if not editing
  const selectedPenebusan = penebusanList.find(p => p.id === penebusanId);
  useEffect(() => {
    if (selectedPenebusan && !editData) {
      setDoNo(selectedPenebusan.doNo || '');
      setFertilizerId(selectedPenebusan.fertilizerId || fertilizerId);
      setTargetWarehouse(`Gudang Utama ${branch}`);
    }
  }, [penebusanId, editData]);

  // Auto-fill from selected DO for Penyaluran if not editing
  const selectedDO = doList.find(d => d.id === doRefId);
  useEffect(() => {
    if (selectedDO) {
      setDoNo(selectedDO.doNo || '');
      if (!editData) {
        setFertilizerId(selectedDO.fertilizerId || fertilizerId);
        
        // Auto-generate NO PENYALURAN format: [NO_DO]-[INCREMENT] (e.g. 12345-01, 12345-02)
        const targetDoNo = selectedDO.doNo || '';
        const countExisting = penyaluranList.filter(s => 
          s.doNo === targetDoNo || (s.penyaluranNo && s.penyaluranNo.startsWith(`${targetDoNo}-`))
        ).length;
        const nextSeq = countExisting + 1;
        const seqStr = String(nextSeq).padStart(2, '0');
        setPenyaluranNo(`${targetDoNo}-${seqStr}`);
      }
    }
  }, [doRefId, editData, selectedDO, penyaluranList]);

  // Default auto-select first available options if empty
  useEffect(() => {
    if (formType === 'do' && !penebusanId && availablePenebusan.length > 0 && !editData) {
      setPenebusanId(availablePenebusan[0].id);
    }
  }, [formType, availablePenebusan, penebusanId, editData]);

  useEffect(() => {
    if (formType === 'penyaluran' && !doRefId && availableDoList.length > 0 && !editData) {
      setDoRefId(availableDoList[0].id);
    }
  }, [formType, availableDoList, doRefId, editData]);

  useEffect(() => {
    if (formType === 'penyaluran' && !kiosId && availableKiosks.length > 0 && !editData) {
      setKiosId(availableKiosks[0].id);
    }
  }, [formType, availableKiosks, kiosId, editData]);

  // Driver selection handler for Penyaluran
  useEffect(() => {
    if (formType === 'penyaluran') {
      if (editData?.driverName) {
        const match = availableDrivers.find(d => d.name === editData.driverName);
        if (match) {
          setSelectedDriverId(match.id);
        } else {
          setSelectedDriverId('manual');
        }
      } else if (availableDrivers.length > 0 && !selectedDriverId) {
        setSelectedDriverId(availableDrivers[0].id);
        setDriverName(availableDrivers[0].name);
        setVehiclePlate(availableDrivers[0].vehiclePlate);
      }
    }
  }, [formType, branch, editData, availableDrivers.length]);

  const handleDriverSelectChange = (e) => {
    const val = e.target.value;
    setSelectedDriverId(val);
    if (val === 'manual') {
      setDriverName('');
      setVehiclePlate('');
    } else {
      const found = drivers.find(d => d.id === val);
      if (found) {
        setDriverName(found.name);
        setVehiclePlate(found.vehiclePlate);
      }
    }
  };

  // Set defaults on open
  useEffect(() => {
    if (!editData) {
      if (initialPenebusanId) setPenebusanId(initialPenebusanId);
      else if (availablePenebusan.length > 0 && formType === 'do' && !penebusanId) {
        setPenebusanId(availablePenebusan[0].id);
      }

      if (initialDoRefId) setDoRefId(initialDoRefId);
      else if (availableDoList.length > 0 && formType === 'penyaluran' && !doRefId) {
        setDoRefId(availableDoList[0].id);
      }

      if (availableKiosks.length > 0 && formType === 'penyaluran' && !kiosId) {
        setKiosId(availableKiosks[0].id);
      }
    }
  }, [formType, branch, editData, initialPenebusanId, initialDoRefId]);

  // Auto price from fertilizer if not editing
  useEffect(() => {
    if (!editData) {
      const f = fertilizers.find(x => x.id === fertilizerId);
      if (f) {
        if (formType === 'penebusan') {
          setPricePerTon(f.buyPrice || f.defaultPriceTon || 2100000);
        } else if (formType === 'penyaluran') {
          setPricePerTon(f.sellPrice || f.defaultPriceTon || 2250000);
        } else {
          setPricePerTon(f.defaultPriceTon || 2250000);
        }
      }
    }
  }, [fertilizerId, formType, editData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedFert = fertilizers.find(f => f.id === fertilizerId) || fertilizers[0];
    const selectedSup = suppliers.find(s => s.id === supplierId) || suppliers[0];
    const selectedKios = kiosks.find(k => k.id === kiosId) || availableKiosks[0];

    if (formType === 'penebusan') {
      onSave('penebusan', {
        id: editData?.id || `PNB-${Date.now()}`,
        branch, date,
        doNo,
        supplierId,
        supplierName: selectedSup?.name || '-',
        fertilizerId,
        fertilizerName: selectedFert?.name || '',
        qtyTon: Number(qtyTon),
        pricePerTon: Number(pricePerTon),
        totalAmount: Number(qtyTon) * Number(pricePerTon),
        status: editData?.status || 'Aktif', notes
      }, Boolean(editData));
    } else if (formType === 'do') {
      if (!selectedPenebusan) {
        setAlertConfig({
          title: 'Peringatan Data',
          variant: 'warning',
          message: 'Silakan pilih No. DO Penebusan terlebih dahulu!'
        });
        return;
      }

      const takenDo = doList
        .filter(d => (d.penebusanId === selectedPenebusan.id || (selectedPenebusan.doNo && d.doNo === selectedPenebusan.doNo)) && d.id !== editData?.id)
        .reduce((s, i) => s + Number(i.qtyTon || 0), 0);
      const maxAllowedDo = Math.max(0, Number(selectedPenebusan.qtyTon || 0) - takenDo);

      if (Number(qtyTon) > maxAllowedDo + 0.0001) {
        setAlertConfig({
          title: 'Penolakan Transaksi (Batas Kuota DO)',
          variant: 'danger',
          message: `Jumlah Pengeluaran DO (${qtyTon} Ton) melebihi sisa kuota Penebusan No. DO "${selectedPenebusan.doNo}"!\n\n` +
            `• Total Penebusan Awal: ${selectedPenebusan.qtyTon} Ton\n` +
            `• Sudah Dikeluarkan ke Gudang: ${takenDo.toFixed(1)} Ton\n` +
            `• Sisa Kuota Maksimal Boleh Dikeluarkan: ${maxAllowedDo.toFixed(1)} Ton\n\n` +
            `Silakan sesuaikan tonase pengeluaran DO agar tidak melebihi ${maxAllowedDo.toFixed(1)} Ton.`
        });
        return;
      }

      onSave('do', {
        id: editData?.id || `DO-${Date.now()}`,
        branch, date,
        doNo: selectedPenebusan?.doNo || doNo,
        penebusanId,
        fertilizerId: selectedPenebusan?.fertilizerId || fertilizerId,
        fertilizerName: selectedPenebusan?.fertilizerName || selectedFert?.name || '',
        qtyTon: Number(qtyTon),
        driverName: '', vehiclePlate: '', targetWarehouse: `Gudang Utama ${branch}`,
        status: editData?.status || 'Sampai di Gudang', notes
      }, Boolean(editData));
    } else if (formType === 'penyaluran') {
      if (!selectedDO) {
        setAlertConfig({
          title: 'Peringatan Data',
          variant: 'warning',
          message: 'Silakan pilih No. DO yang tersedia!'
        });
        return;
      }

      const salurDariDO = penyaluranList
        .filter(s => (s.doRefId === selectedDO.id || (selectedDO.doNo && s.doNo === selectedDO.doNo)) && s.id !== editData?.id)
        .reduce((s, i) => s + Number(i.qtyTon || 0), 0);
      const sisaStokDO = Math.max(0, Number(selectedDO.qtyTon || 0) - salurDariDO);

      if (Number(qtyTon) > sisaStokDO + 0.0001) {
        setAlertConfig({
          title: 'Penolakan Transaksi (Batas Kuota Penyaluran)',
          variant: 'danger',
          message: `Jumlah Penyaluran ke Kios (${qtyTon} Ton) melebihi sisa stok kuota No. DO "${selectedDO.doNo}"!\n\n` +
            `• Kuota Pengeluaran DO Gudang: ${selectedDO.qtyTon} Ton\n` +
            `• Sudah Disalurkan ke Kios Lain: ${salurDariDO.toFixed(1)} Ton\n` +
            `• Sisa Kuota Maksimal Boleh Disalurkan: ${sisaStokDO.toFixed(1)} Ton\n\n` +
            `Silakan sesuaikan tonase penyaluran ini agar tidak melebihi ${sisaStokDO.toFixed(1)} Ton!`
        });
        return;
      }

      const totalAmt = Number(qtyTon) * Number(pricePerTon);
      const paidDp = paymentStatus === 'Lunas' ? totalAmt : Number(dpAmount || 0);

      onSave('penyaluran', {
        id: editData?.id || `SLR-${Date.now()}`,
        penyaluranNo: penyaluranNo || (selectedDO?.doNo ? `${selectedDO.doNo}-01` : ''),
        nomorPenyaluran: penyaluranNo || (selectedDO?.doNo ? `${selectedDO.doNo}-01` : ''),
        branch, date,
        doNo: selectedDO?.doNo || doNo,
        doRefId,
        kiosId: selectedKios?.id || '',
        kiosName: selectedKios?.name || '-',
        fertilizerId: selectedDO?.fertilizerId || fertilizerId,
        fertilizerName: selectedDO?.fertilizerName || selectedFert?.name || '',
        qtyTon: Number(qtyTon),
        pricePerTon: Number(pricePerTon),
        totalAmount: totalAmt,
        dpAmount: paidDp,
        paymentStatus, driverName, vehiclePlate,
        deliveryStatus: editData?.deliveryStatus || 'Tersalurkan', notes
      }, Boolean(editData));
    } else if (formType === 'kios') {
      onSave('kios', {
        id: editData?.id || `KS-${branch.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        code: editData?.code || `Kios-${branch === 'Magetan' ? '3520' : '3314'}${Math.floor(100 + Math.random() * 900)}`,
        name: kiosName, owner: kiosOwner, branch, address: kiosAddress, phone: kiosPhone
      }, Boolean(editData));
    } else if (formType === 'supplier') {
      onSave('supplier', {
        id: editData?.id || `SUP-${Date.now().toString().slice(-4)}`,
        name: supplierName, contact: supplierContact, address: supplierAddress
      }, Boolean(editData));
    } else if (formType === 'driver') {
      onSave('driver', {
        id: editData?.id || `DRV-${Date.now().toString().slice(-4)}`,
        name: drName, vehiclePlate: drPlate, phone: drPhone, branch
      }, Boolean(editData));
    }
    onClose();
  };

  const isEdit = Boolean(editData);
  const titles = {
    penebusan: isEdit ? 'Edit Data Penebusan' : 'Input Penebusan — Nomor DO sebagai Kunci Transaksi',
    do: isEdit ? 'Edit Data Pengeluaran DO' : 'Input Pengeluaran DO Gudang',
    penyaluran: isEdit ? 'Edit Data Penyaluran Kios' : 'Input Penyaluran Ke Kios',
    kios: isEdit ? 'Edit Data Kios Pengecer' : 'Tambah Kios Pengecer Baru',
    supplier: isEdit ? 'Edit Data Supplier / Produsen' : 'Tambah Supplier / Produsen Baru',
    driver: isEdit ? 'Edit Data Supir / Armada' : 'Tambah Supir / Armada Baru',
  };

  const totalTagihanCalculated = Number(qtyTon || 0) * Number(pricePerTon || 0);
  const sisaUtangCalculated = Math.max(0, totalTagihanCalculated - Number(dpAmount || 0));

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div>{titles[formType]}</div>
          <button className="btn-secondary" onClick={onClose}>Tutup</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Branch selector */}
            {formType !== 'supplier' && (
              <div className="form-group">
                <label className="form-label">Cabang Operasional:</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {['Magetan', 'Sragen'].map(b => (
                    <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isBranchLocked ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isBranchLocked && branch !== b ? 0.4 : 1 }}>
                      <input type="radio" name="br" value={b} checked={branch === b} onChange={() => !isBranchLocked && setBranch(b)} disabled={isBranchLocked} />
                      Cabang {b} {isBranchLocked && branch === b ? '(Terkunci Sesuai Akun)' : ''}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ PENEBUSAN ═══ */}
            {formType === 'penebusan' && (<>
              <div className="form-group" style={{ border: '2px solid #15803d', borderRadius: '4px', padding: '10px', backgroundColor: '#f0fdf4' }}>
                <label className="form-label" style={{ color: '#15803d', fontSize: '13px' }}>
                  NOMOR DO (Kunci seluruh alur transaksi):
                </label>
                <input type="text" className="form-input" placeholder="cth: DO/TMB-MGT/2607/001" value={doNo} onChange={(e) => setDoNo(e.target.value)} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanggal Penebusan:</label>
                  <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier / Produsen:</label>
                  <select className="form-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Jenis Pupuk:</label>
                  <select className="form-select" value={fertilizerId} onChange={(e) => setFertilizerId(e.target.value)}>
                    {fertilizers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jumlah Penebusan (Ton):</label>
                  <input type="number" step="0.1" min="0.1" className="form-input" value={qtyTon} onChange={(e) => setQtyTon(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Harga per Ton (Rp):</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formatCurrencyInput(pricePerTon)} 
                  onChange={(e) => setPricePerTon(parseCurrencyInput(e.target.value))} 
                  placeholder="misal: 2.250.000"
                  required 
                />
              </div>

              <div style={{ backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Nominal Penebusan:</span>
                <strong style={{ color: '#15803d' }}>Rp {(qtyTon * pricePerTon).toLocaleString('id-ID')}</strong>
              </div>
            </>)}

            {/* ═══ PENGELUARAN DO ═══ */}
            {formType === 'do' && (<>
              <div className="form-group">
                <label className="form-label">Pilih No. DO Penebusan (Kunci Transaksi):</label>
                <select className="form-select" value={penebusanId} onChange={(e) => setPenebusanId(e.target.value)} required>
                  {availablePenebusan.length === 0 && <option value="">Belum ada Penebusan di cabang ini</option>}
                  {availablePenebusan.map(p => {
                    const taken = doList.filter(d => d.penebusanId === p.id && d.id !== editData?.id).reduce((s, i) => s + Number(i.qtyTon || 0), 0);
                    const sisa = Math.max(0, (p.qtyTon || 0) - taken);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.doNo} — {p.fertilizerName} (Sisa: {sisa.toFixed(1)} Ton)
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedPenebusan && (() => {
                const takenDo = doList
                  .filter(d => (d.penebusanId === selectedPenebusan.id || (selectedPenebusan.doNo && d.doNo === selectedPenebusan.doNo)) && d.id !== editData?.id)
                  .reduce((s, i) => s + Number(i.qtyTon || 0), 0);
                const maxAllowedDo = Math.max(0, Number(selectedPenebusan.qtyTon || 0) - takenDo);
                const isOver = Number(qtyTon) > maxAllowedDo;

                return (
                  <div style={{ backgroundColor: isOver ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isOver ? '#fca5a5' : '#bbf7d0'}`, borderRadius: '4px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px' }}>
                    <strong>No. DO:</strong> {selectedPenebusan.doNo} &nbsp;|&nbsp;
                    <strong>Penebusan Awal:</strong> {selectedPenebusan.qtyTon} Ton &nbsp;|&nbsp;
                    <strong>Sisa Kuota Boleh Dikeluarkan:</strong> <span style={{ color: isOver ? '#dc2626' : '#15803d', fontWeight: 800 }}>{maxAllowedDo.toFixed(1)} Ton</span>
                    {isOver && (
                      <div style={{ color: '#dc2626', fontWeight: 700, marginTop: '4px' }}>
                        Perhatian: Qty diinput ({qtyTon} Ton) melebihi sisa kuota Penebusan ({maxAllowedDo.toFixed(1)} Ton)!
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanggal Pengeluaran DO:</label>
                  <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Qty Diambil (Ton):</label>
                  <input type="number" step="0.1" min="0.1" className="form-input" value={qtyTon} onChange={(e) => setQtyTon(e.target.value)} required />
                </div>
              </div>
            </>)}

            {/* ═══ PENYALURAN KIOS ═══ */}
            {formType === 'penyaluran' && (<>
              <div className="form-group">
                <label className="form-label">Pilih No. DO (Stok di Gudang — Kunci Transaksi):</label>
                <select className="form-select" value={doRefId} onChange={(e) => setDoRefId(e.target.value)} required>
                  {availableDoList.length === 0 && <option value="">Belum ada DO masuk di cabang ini</option>}
                  {availableDoList.map(d => {
                    const salurDariDO = penyaluranList.filter(s => (s.doRefId === d.id || (d.doNo && s.doNo === d.doNo)) && s.id !== editData?.id).reduce((s, i) => s + Number(i.qtyTon || 0), 0);
                    const stok = Math.max(0, Number(d.qtyTon || 0) - salurDariDO);
                    return (
                      <option key={d.id} value={d.id}>
                        {d.doNo} — {d.fertilizerName} (Sisa Kuota: {stok.toFixed(1)} Ton)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group" style={{ border: '2px solid #3b82f6', borderRadius: '4px', padding: '10px', backgroundColor: '#eff6ff' }}>
                <label className="form-label" style={{ color: '#1d4ed8', fontSize: '13px', fontWeight: 700 }}>
                  NOMOR PENYALURAN (Otomatis: NO DO-Urutan):
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ fontWeight: 800, color: '#1d4ed8', fontFamily: 'monospace', fontSize: '14px' }} 
                  value={penyaluranNo} 
                  onChange={(e) => setPenyaluranNo(e.target.value)} 
                  placeholder="cth: 3101388084-01" 
                  required 
                />
              </div>

              {selectedDO && (() => {
                const salurDariDO = penyaluranList
                  .filter(s => (s.doRefId === selectedDO.id || (selectedDO.doNo && s.doNo === selectedDO.doNo)) && s.id !== editData?.id)
                  .reduce((s, i) => s + Number(i.qtyTon || 0), 0);
                const sisaStokDO = Math.max(0, Number(selectedDO.qtyTon || 0) - salurDariDO);
                const isOver = Number(qtyTon) > sisaStokDO;

                return (
                  <div style={{ backgroundColor: isOver ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isOver ? '#fca5a5' : '#bbf7d0'}`, borderRadius: '4px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px' }}>
                    <strong>No. DO:</strong> {selectedDO.doNo} &nbsp;|&nbsp;
                    <strong>Kuota DO:</strong> {selectedDO.qtyTon} Ton &nbsp;|&nbsp;
                    <strong>Disalurkan Kios Lain:</strong> {salurDariDO.toFixed(1)} Ton &nbsp;|&nbsp;
                    <strong>Sisa Kuota Salur:</strong> <span style={{ color: isOver ? '#dc2626' : '#15803d', fontWeight: 800 }}>{sisaStokDO.toFixed(1)} Ton</span>
                    {isOver && (
                      <div style={{ color: '#dc2626', fontWeight: 700, marginTop: '4px' }}>
                        Perhatian: Qty disalurkan ({qtyTon} Ton) melebihi sisa kuota DO ({sisaStokDO.toFixed(1)} Ton)!
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanggal Penyaluran:</label>
                  <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kios Tujuan ({branch}):</label>
                  <select className="form-select" value={kiosId} onChange={(e) => setKiosId(e.target.value)}>
                    {availableKiosks.length === 0 && <option value="">Belum ada Kios di cabang ini</option>}
                    {availableKiosks.map(k => <option key={k.id} value={k.id}>{k.name} ({k.owner})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Qty Salur (Ton):</label>
                  <input type="number" step="0.1" min="0.1" className="form-input" value={qtyTon} onChange={(e) => setQtyTon(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga HET / Ton (Rp):</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatCurrencyInput(pricePerTon)} 
                    onChange={(e) => setPricePerTon(parseCurrencyInput(e.target.value))} 
                    placeholder="misal: 2.250.000"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status Pembayaran:</label>
                  <select className="form-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                    <option value="Lunas">Lunas (100% Terbayar)</option>
                    <option value="Tempo">Tempo / Utang Kios</option>
                  </select>
                </div>

                {paymentStatus === 'Tempo' && (
                  <div className="form-group" style={{ backgroundColor: '#fffbeb', padding: '6px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                    <label className="form-label" style={{ color: '#92400e', fontWeight: 700 }}>
                      Nominal Pembayaran Awal / DP (Rp):
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0 (kosongkan jika belum bayar)"
                      value={dpAmount ? formatCurrencyInput(dpAmount) : ''}
                      onChange={(e) => setDpAmount(parseCurrencyInput(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Supir & Armada Pengirim ({branch}):</label>
                <select className="form-select" value={selectedDriverId} onChange={handleDriverSelectChange}>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} — Truk {d.vehiclePlate}
                    </option>
                  ))}
                  <option value="manual">+ Input Supir / Truk Manual</option>
                </select>
              </div>

              {selectedDriverId === 'manual' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nama Supir (Manual):</label>
                    <input type="text" className="form-input" placeholder="Pak Sujono" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plat Nomor (Manual):</label>
                    <input type="text" className="form-input" placeholder="AE 8492 UN" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} required />
                  </div>
                </div>
              )}

              <div style={{ backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Tagihan HET:</span>
                  <strong>Rp {totalTagihanCalculated.toLocaleString('id-ID')}</strong>
                </div>
                {paymentStatus === 'Tempo' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontSize: '13px' }}>
                      <span>Pembayaran Awal / DP:</span>
                      <span>- Rp {Number(dpAmount || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 800, borderTop: '1px solid #d1d5db', paddingTop: '4px' }}>
                      <span>Sisa Piutang / Utang Tempo:</span>
                      <span>Rp {sisaUtangCalculated.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>
            </>)}

            {/* ═══ KIOS BARU / EDIT ═══ */}
            {formType === 'kios' && (<>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nama Kios:</label>
                  <input type="text" className="form-input" placeholder="Kios Tani Subur" value={kiosName} onChange={(e) => setKiosName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Pemilik:</label>
                  <input type="text" className="form-input" placeholder="Bpk. Sugeng" value={kiosOwner} onChange={(e) => setKiosOwner(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Alamat:</label>
                <input type="text" className="form-input" placeholder="Desa Barat, Kec. Maospati, Magetan" value={kiosAddress} onChange={(e) => setKiosAddress(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Telepon / WA:</label>
                <input type="text" className="form-input" placeholder="0812-3456-7890" value={kiosPhone} onChange={(e) => setKiosPhone(e.target.value)} required />
              </div>
            </>)}

            {/* ═══ SUPIR / ARMADA BARU / EDIT ═══ */}
            {formType === 'driver' && (<>
              <div className="form-group">
                <label className="form-label">Nama Supir:</label>
                <input type="text" className="form-input" placeholder="Pak Budi" value={drName} onChange={(e) => setDrName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Plat Nomor Truk:</label>
                <input type="text" className="form-input" placeholder="AE 8899 MGT" value={drPlate} onChange={(e) => setDrPlate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Telepon / WA Supir (Opsional):</label>
                <input type="text" className="form-input" placeholder="0812-3456-7890" value={drPhone} onChange={(e) => setDrPhone(e.target.value)} />
              </div>
            </>)}

            {/* ═══ SUPPLIER BARU / EDIT ═══ */}
            {formType === 'supplier' && (<>
              <div className="form-group">
                <label className="form-label">Nama Produsen / Supplier:</label>
                <input type="text" className="form-input" placeholder="PT Pupuk Kaltim" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Kontak / Telepon:</label>
                <input type="text" className="form-input" placeholder="0812-9999-0000" value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat Depo / Gudang:</label>
                <input type="text" className="form-input" placeholder="Jl. Raya Solo - Sragen Km. 12" value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} required />
              </div>
            </>)}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary">{isEdit ? 'Simpan Perubahan' : 'Simpan'}</button>
          </div>
        </form>
      </div>

      {/* CUSTOM IN-APP NOTIFICATION POPUP */}
      {alertConfig && (
        <ModalNotification
          isOpen={Boolean(alertConfig)}
          type="alert"
          variant={alertConfig.variant || 'warning'}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertConfig(null)}
        />
      )}
    </div>
  );
}

