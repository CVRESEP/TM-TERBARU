/**
 * Normalizer & Mapper Data Firestore (Tani Makmur ZF400)
 * Mengubah field & struktur data Firestore lama ke format standar aplikasi Tani Makmur Baru.
 */

export function parseDateStandard(dateVal) {
  if (!dateVal) return new Date().toISOString().slice(0, 10);
  
  if (typeof dateVal === 'object') {
    if (dateVal.seconds || dateVal._seconds) {
      const sec = dateVal.seconds || dateVal._seconds;
      return new Date(sec * 1000).toISOString().slice(0, 10);
    }
  }

  const str = String(dateVal).trim();
  
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-');
    return `${y}-${m}-${d}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }

  if (/^\d{4}[-/]\d{2}[-/]\d{2}/.test(str)) {
    return str.slice(0, 10).replace(/\//g, '-');
  }

  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch {}

  return new Date().toISOString().slice(0, 10);
}

function cleanStr(val, fallback = '') {
  if (!val) return fallback;
  return String(val).replace(/^\s+/, '').replace(/\s+$/, '');
}

export function normalizePenebusanList(rawList = [], rawDoList = [], rawPenyaluranList = []) {
  if (!Array.isArray(rawList)) return [];

  const doTakenMap = {};
  if (Array.isArray(rawDoList)) {
    rawDoList.forEach(doItem => {
      const noDo = cleanStr(doItem.id || doItem.noDo || doItem.penebusanId);
      if (noDo) {
        doTakenMap[noDo] = (doTakenMap[noDo] || 0) + Number(doItem.qtyTon || doItem.qty || 0);
      }
    });
  }

  return rawList.map((item, idx) => {
    const rawId = cleanStr(item.id || item.noDo || item.no_do || `PEN-${idx + 1}`);
    const id = rawId.replace(/^\s+/, '');
    const qty = Number(item.qtyTon || item.qty || item.kuantitas || 0);
    const totalCost = Number(item.totalAmount || item.totalPenebusan || item.totalCost || item.total || 0);
    const pricePerTon = qty > 0 ? Math.round(totalCost / qty) : Number(item.pricePerTon || 0);

    const takenQty = doTakenMap[id] !== undefined 
      ? doTakenMap[id] 
      : Number(item.takenQty || item.sudahDiambil || item.diambil || 0);

    const remainingQty = Math.max(0, qty - takenQty);

    const supplierName = cleanStr(item.supplier || item.supplierName, 'PT PETROKIMIA GRESIK');
    const fertilizerName = cleanStr(item.namaProduk || item.fertilizerName || item.pupuk, 'UREA');
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : (item.kabupaten === 'MAGETAN' ? 'Magetan' : cleanStr(item.branch, 'Magetan'));

    return {
      id,
      doNo: id,
      spjbNo: id,
      date: parseDateStandard(item.tanggal || item.date),
      supplierId: supplierName,
      supplierName,
      fertilizerId: fertilizerName,
      fertilizerName,
      qty,
      qtyTon: qty,
      takenQty,
      remainingQty,
      pricePerTon,
      totalCost,
      totalAmount: totalCost,
      branch,
      notes: cleanStr(item.catatan || item.keterangan || '')
    };
  });
}

export function normalizeDoList(rawList = [], rawPenebusan = []) {
  if (!Array.isArray(rawList)) return [];

  const penMap = {};
  if (Array.isArray(rawPenebusan)) {
    rawPenebusan.forEach(p => {
      const pId = cleanStr(p.id || p.noDo);
      if (pId) penMap[pId] = p;
    });
  }

  return rawList.map((item, idx) => {
    const id = cleanStr(item.id || item.noDo || `DO-${idx + 1}`);
    const penebusanId = cleanStr(item.noDo || item.penebusanId || id);
    const linkedPen = penMap[penebusanId] || {};

    const qty = Number(item.qtyTon || item.qty || 0);
    const fertilizerName = cleanStr(item.namaProduk || linkedPen.namaProduk || item.fertilizerName, 'Pupuk Bersubsidi');
    const driverName = cleanStr(item.namaSopir || item.driverName || item.sopir, 'Sopir Distributor');
    const truckNumber = cleanStr(item.nopol || item.truckNumber, '-');
    const targetWarehouse = cleanStr(item.gudang || item.targetWarehouse, 'Gudang Utama');

    const kabupaten = item.kabupaten || linkedPen.kabupaten;
    const branch = kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';

    return {
      id,
      doNo: penebusanId,
      penebusanId,
      date: parseDateStandard(item.tanggal || item.date || linkedPen.tanggal),
      branch,
      fertilizerName,
      qty,
      qtyTon: qty,
      driverName,
      truckNumber,
      targetWarehouse,
      notes: cleanStr(item.catatan || item.keterangan || '')
    };
  });
}

export function normalizePenyaluranList(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  const doSeqMap = {};

  return rawList.map((item, idx) => {
    const id = cleanStr(item.id || item.nomorPenyaluran || item.penyaluranNo || `SLR-${idx + 1}`);
    const doRefId = cleanStr(item.noDo || item.doRefId || item.doNo);
    
    let penyaluranNo = cleanStr(item.penyaluranNo || item.nomorPenyaluran);
    if (!penyaluranNo || !penyaluranNo.includes('-')) {
      if (doRefId) {
        doSeqMap[doRefId] = (doSeqMap[doRefId] || 0) + 1;
        const seqStr = String(doSeqMap[doRefId]).padStart(2, '0');
        penyaluranNo = `${doRefId}-${seqStr}`;
      } else {
        penyaluranNo = id;
      }
    }

    const qty = Number(item.qtyTon || item.qty || 0);
    const totalAmount = Number(item.total || item.totalAmount || 0);
    const paidAmount = Number(item.diBayar || item.paidAmount || 0);
    const remainingAmount = item.kurangBayar !== undefined 
      ? Number(item.kurangBayar) 
      : Math.max(0, totalAmount - paidAmount);

    const pricePerTon = qty > 0 ? Math.round(totalAmount / qty) : Number(item.pricePerTon || 0);

    let paymentStatus = cleanStr(item.keterangan || item.paymentStatus || 'Tempo');
    if (paymentStatus.toUpperCase().includes('LUNAS') || remainingAmount <= 0) {
      paymentStatus = 'Lunas';
    } else {
      paymentStatus = 'Tempo';
    }

    const kiosName = cleanStr(item.namaKios || item.kiosName, 'Kios Tani');
    const fertilizerName = cleanStr(item.namaProduk || item.fertilizerName, 'Pupuk Bersubsidi');
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';
    const driverName = cleanStr(item.namaSopir || item.driverName, '-');

    return {
      id,
      sjNo: penyaluranNo,
      nomorPenyaluran: penyaluranNo,
      penyaluranNo,
      doRefId,
      doNo: doRefId,
      date: parseDateStandard(item.tanggal || item.date),
      branch,
      kiosId: kiosName,
      kiosName,
      fertilizerName,
      qty,
      qtyTon: qty,
      pricePerTon,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      driverName,
      dueDate: item.dueDate ? parseDateStandard(item.dueDate) : '',
      notes: cleanStr(item.catatan || '')
    };
  });
}

export function normalizeKiosks(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    const name = cleanStr(item.name || item.namaKios || item.nama, `Kios ${idx + 1}`);
    const owner = cleanStr(item.penanggungJawab || item.owner || item.pemilik, '-');
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';
    
    const addrParts = [item.desa, item.kecamatan, item.kabupaten].filter(Boolean);
    const address = addrParts.length > 0 ? addrParts.join(', ') : cleanStr(item.address, '-');

    return {
      id: cleanStr(item.id || `KIO-${idx + 1}`),
      name,
      owner,
      phone: cleanStr(item.phone || item.noHp, '-'),
      address,
      branch
    };
  });
}

export function normalizeFertilizers(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    const name = cleanStr(item.productName || item.namaProduk || item.name, `Pupuk ${idx + 1}`);
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';
    const supplier = cleanStr(item.supplier, 'PT PETROKIMIA GRESIK');

    return {
      id: cleanStr(item.id || `FERT-${idx + 1}`),
      name,
      priceBuy: Number(item.hargaBeli || 0),
      priceSell: Number(item.hargaJual || 0),
      stock: Number(item.stok || 0),
      supplier,
      branch
    };
  });
}

export function normalizePayments(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    const kiosName = cleanStr(item.namaKios || item.kiosName, 'Kios Tani');
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';

    return {
      id: cleanStr(item.id || `PAY-${idx + 1}`),
      penyaluranId: cleanStr(item.nomorPenyaluran || item.penyaluranId || ''),
      doRefId: cleanStr(item.noDo || ''),
      doNo: cleanStr(item.noDo || ''),
      kiosName,
      date: parseDateStandard(item.tanggal || item.date),
      amount: Number(item.totalBayar || item.amount || 0),
      paymentMethod: cleanStr(item.metodePembayaran || item.paymentMethod, 'Transfer Bank'),
      branch,
      notes: cleanStr(item.catatan || '')
    };
  });
}

export function normalizeDrivers(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: cleanStr(item.id || `DRV-${idx + 1}`),
    name: cleanStr(item.name || item.namaSopir || item.nama, `Driver ${idx + 1}`),
    phone: cleanStr(item.phone || item.telepon, '-'),
    truckNumber: cleanStr(item.truckNumber || item.nopol, '-')
  }));
}

export function normalizeSuppliers(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: cleanStr(item.id || `SUP-${idx + 1}`),
    name: cleanStr(item.name || item.supplier || item.nama, `Supplier ${idx + 1}`),
    phone: cleanStr(item.phone, '-'),
    address: cleanStr(item.address, '-')
  }));
}

export function normalizeKasAngkutanList(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => {
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : (item.kabupaten === 'MAGETAN' ? 'Magetan' : cleanStr(item.branch, 'Magetan'));
    const adminFee = Number(item.adminFee || item.admin || 0);
    const mealFee = Number(item.mealFee || item.uangMakan || item.makan || 0);
    const palangFee = Number(item.palangFee || item.palang || 0);
    const solarFee = Number(item.solarFee || item.solar || 0);
    const driverWage = Number(item.driverWage || item.upahSopir || item.upah || 0);
    const overtimeFee = Number(item.overtimeFee || item.lembur || 0);
    const helperFee = Number(item.helperFee || item.helper || 0);
    const otherFee = Number(item.otherFee || item.lainLain || item.lain_lain || 0);

    const calcTotal = adminFee + mealFee + palangFee + solarFee + driverWage + overtimeFee + helperFee + otherFee;
    const amount = Number(item.amount || item.nominal || item.totalCost || item.total || (calcTotal > 0 ? calcTotal : 0));

    return {
      id: cleanStr(item.id || `KA-${idx + 1}`),
      branch,
      date: parseDateStandard(item.tanggal || item.date),
      doNo: cleanStr(item.noDo || item.doNo || ''),
      penyaluranNo: cleanStr(item.penyaluranNo || item.noPenyaluran || item.nomorPenyaluran || ''),
      kiosName: cleanStr(item.kiosName || item.namaKios || ''),
      driverName: cleanStr(item.driverName || item.namaSopir || item.sopir || ''),
      transactionType: cleanStr(item.transactionType || item.tipePengeluaran, 'Pengeluaran Kas Angkutan'),
      description: cleanStr(item.description || item.uraian || item.notes || ''),
      amount,
      adminFee,
      mealFee,
      palangFee,
      solarFee,
      driverWage,
      overtimeFee,
      helperFee,
      otherFee,
      notes: cleanStr(item.catatan || item.notes || '')
    };
  });
}

export function normalizeKasUmumList(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => {
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : (item.kabupaten === 'MAGETAN' ? 'Magetan' : cleanStr(item.branch, 'Magetan'));
    let type = cleanStr(item.type || item.tipe || item.jenis || 'Keluar');
    if (type.toLowerCase().includes('masuk') || type.toLowerCase().includes('in')) {
      type = 'Masuk';
    } else {
      type = 'Keluar';
    }

    return {
      id: cleanStr(item.id || `KU-${idx + 1}`),
      branch,
      date: parseDateStandard(item.tanggal || item.date),
      type,
      category: cleanStr(item.category || item.kategori || item.jenisPengeluaran, 'Operasional'),
      description: cleanStr(item.description || item.uraian || item.keterangan || ''),
      amount: Number(item.amount || item.nominal || item.total || 0),
      notes: cleanStr(item.catatan || '')
    };
  });
}

export function normalizeAllData(importedData = {}) {
  const rawPen = importedData.penebusanList || importedData.penebusan || [];
  const rawDO = importedData.doList || importedData.do_expenses || importedData.pengeluaranDo || [];
  const rawSalur = importedData.penyaluranList || importedData.penyaluran_kios || importedData.penyaluranKios || [];
  const rawKios = importedData.kiosks || importedData.kios || [];
  const rawFert = importedData.fertilizers || importedData.products || [];
  const rawPay = importedData.payments || importedData.pembayaran || [];
  const rawSup = importedData.suppliers || [];
  const rawDrv = importedData.drivers || [];
  const rawKasAngkutan = importedData.kasAngkutanList || importedData.kas_angkutan || importedData.kasAngkutan || importedData.beban_angkutan || [];
  const rawKasUmum = importedData.kasUmumList || importedData.kas_umum || importedData.kasUmum || importedData.kas_kantor || [];

  return {
    settings: importedData.settings || {},
    usersList: importedData.usersList || [],
    penebusanList: normalizePenebusanList(rawPen, rawDO, rawSalur),
    doList: normalizeDoList(rawDO, rawPen),
    penyaluranList: normalizePenyaluranList(rawSalur),
    kiosks: normalizeKiosks(rawKios),
    suppliers: normalizeSuppliers(rawSup),
    drivers: normalizeDrivers(rawDrv),
    payments: normalizePayments(rawPay),
    fertilizers: normalizeFertilizers(rawFert),
    deposits: importedData.deposits || [],
    kasAngkutanList: normalizeKasAngkutanList(rawKasAngkutan),
    kasUmumList: normalizeKasUmumList(rawKasUmum)
  };
}
