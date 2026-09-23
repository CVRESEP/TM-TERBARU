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

  // Handle Excel Serial Date (e.g. 45959 or 45959.29)
  const num = Number(dateVal);
  if (!isNaN(num) && num > 20000 && num < 80000 && !String(dateVal).includes('-') && !String(dateVal).includes('/')) {
    try {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch {}
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
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s.length > 0 ? s : fallback;
}

/**
 * Mencari nilai field dari object CSV dengan berbagai variasi nama header.
 * Mendukung: spasi, underscore, camelCase, UPPERCASE, lowercase, dll.
 * Contoh: getField(row, ['NO DO','noDo','doNo','no_do']) -> '1234'
 */
function getField(obj, aliases, fallback = undefined) {
  if (!obj || typeof obj !== 'object') return fallback;
  // Build normalized key map once
  const normalize = (k) => String(k).toLowerCase().replace(/[\s_\-\.]/g, '');
  const objKeys = Object.keys(obj);
  for (const alias of aliases) {
    const aliasNorm = normalize(alias);
    // Direct match first (fastest)
    if (obj[alias] !== undefined && obj[alias] !== null && obj[alias] !== '') return obj[alias];
    // Normalized match
    const found = objKeys.find(k => normalize(k) === aliasNorm);
    if (found !== undefined && obj[found] !== undefined && obj[found] !== null && obj[found] !== '') return obj[found];
  }
  return fallback;
}

export function normalizeProductName(rawName, branch = '') {
  const s = String(rawName || '').trim().toUpperCase();
  if (!s || s === 'PUPUK BERSUBSIDI' || s === 'PUPUK') return '';

  const b = String(branch || '').toUpperCase();
  const isSragen = b.includes('SRAGEN');

  if (s.includes('PETROGANIK') || s.includes('PGANIK') || s.includes('PG BARU')) {
    return isSragen ? '4. PETROGANIK SRAGEN' : 'PGANIK MAGETAN';
  }
  if (s.includes('UREA')) {
    return isSragen ? '1. UREA 2026 SRAGEN' : 'UREA MAGETAN';
  }
  if (s.includes('PHONSKA') || s.includes('NPK')) {
    return isSragen ? '2. NPK 2026 SRAGEN' : 'PHONSKA MAGETAN';
  }
  if (s.includes('ZA')) {
    return isSragen ? '3. ZA 2026 SRAGEN' : 'ZA MAGETAN';
  }
  return rawName ? String(rawName).trim() : '';
}

export function normalizePenebusanList(rawList = [], rawDoList = [], rawPenyaluranList = []) {
  if (!Array.isArray(rawList)) return [];

  const doTakenMap = {};
  if (Array.isArray(rawDoList)) {
    rawDoList.forEach(doItem => {
      const noDo = cleanStr(
        getField(doItem, ['id','noDo','doNo','no_do','NO DO','No Do','NODO','no do','penebusanId'])
      );
      if (noDo) {
        doTakenMap[noDo] = (doTakenMap[noDo] || 0) + Number(
          getField(doItem, ['qtyTon','qty','QTY','Qty','kuantitas','KUANTITAS','jumlah'], 0)
        );
      }
    });
  }

  return rawList.map((item, idx) => {
    // Resolve NO DO dari berbagai kemungkinan nama header CSV
    const rawNoDo = getField(item, [
      'id','noDo','doNo','no_do','NO DO','No Do','NODO','no do',
      'nomor_do','NOMOR DO','Nomor DO','NoDO','No.DO','NO.DO'
    ]);
    const rawId = cleanStr(rawNoDo || `PEN-${idx + 1}`);
    const id = rawId;
    const doNo = rawId;
    const spjbNo = cleanStr(
      getField(item, ['spjbNo','noSpjb','spjb','SPJB','No SPJB','NO SPJB']) || doNo
    );
    const qty = Number(
      getField(item, ['qtyTon','qty','QTY','Qty','kuantitas','KUANTITAS','jumlah','JUMLAH'], 0)
    );
    const totalCost = Number(
      getField(item, ['totalAmount','totalPenebusan','totalCost','total','TOTAL','Total',
                      'total_biaya','TOTAL BIAYA','Total Biaya'], 0)
    );
    const pricePerTon = qty > 0 ? Math.round(totalCost / qty) : Number(
      getField(item, ['pricePerTon','hargaPerTon','harga_per_ton','HARGA/TON'], 0)
    );

    const takenQty = doTakenMap[id] !== undefined 
      ? doTakenMap[id] 
      : Number(getField(item, ['takenQty','sudahDiambil','diambil'], 0));
    const remainingQty = Math.max(0, qty - takenQty);

    const supplierName = cleanStr(
      getField(item, ['supplier','supplierName','namaSupplier','nama_supplier',
                      'SUPPLIER','Supplier','Nama Supplier','NAMA SUPPLIER']),
      'PT PETROKIMIA GRESIK'
    );
    const fertilizerName = cleanStr(
      getField(item, ['namaProduk','fertilizerName','pupuk','jenisPupuk',
                      'JENIS PUPUK','Jenis Pupuk','nama_produk','NAMA PRODUK',
                      'Nama Produk','PUPUK','produk']),
      'UREA'
    );
    const rawBranch = cleanStr(
      getField(item, ['kabupaten','branch','cabang','KABUPATEN','Kabupaten',
                      'BRANCH','Branch','wilayah','WILAYAH']),
      'Magetan'
    ).toUpperCase();
    const branch = rawBranch.includes('SRAGEN') ? 'Sragen' : 'Magetan';

    const dateRaw = getField(item, [
      'tanggal','date','tgl','TANGGAL','Tanggal','DATE','Date','tgl_penebusan'
    ]);

    return {
      id,
      doNo,
      spjbNo,
      date: parseDateStandard(dateRaw),
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
      status: cleanStr(getField(item, ['status','STATUS','Status']), 'Complete'),
      notes: cleanStr(getField(item, ['catatan','keterangan','notes','CATATAN','KETERANGAN']) || '')
    };
  });
}

export function normalizeDoList(rawList = [], rawPenebusan = []) {
  if (!Array.isArray(rawList)) return [];

  // Build lookup map dari penebusan: key = noDo / id
  const penMap = {};
  if (Array.isArray(rawPenebusan)) {
    rawPenebusan.forEach(p => {
      const pId = cleanStr(
        getField(p, ['id','noDo','doNo','no_do','NO DO','No Do'])
      );
      if (pId) penMap[pId] = p;
    });
  }

  return rawList.map((item, idx) => {
    // ① Ambil NO DO dari berbagai kemungkinan nama header CSV
    const rawNoDo = getField(item, [
      'noDo','doNo','no_do','NO DO','No Do','NODO','no do',
      'nomor_do','NOMOR DO','Nomor DO','NoDO','No.DO','NO.DO','id'
    ]);
    const penebusanId = cleanStr(rawNoDo || `DO-${idx + 1}`);

    // ID record DO sendiri — pakai penebusanId supaya match satu-ke-satu dengan penebusan
    // Jika item sudah punya id sendiri (dari Turso), pakai itu; kalau tidak, pakai penebusanId
    const id = cleanStr(item.id) || penebusanId;

    // ② Ambil data dari penebusan yang terhubung
    const linkedPen = penMap[penebusanId] || {};

    // ③ Qty
    const qty = Number(
      getField(item, ['qtyTon','qty','QTY','Qty','kuantitas','KUANTITAS','jumlah','JUMLAH'], 0)
    );

    // ④ Jenis pupuk — utamakan dari item, fallback dari penebusan terhubung
    const fertilizerName = cleanStr(
      getField(item, ['namaProduk','fertilizerName','pupuk','jenisPupuk',
                      'JENIS PUPUK','Jenis Pupuk','NAMA PRODUK','Nama Produk','produk']) ||
      getField(linkedPen, ['namaProduk','fertilizerName','pupuk','jenisPupuk']),
      'UREA'
    );

    // ⑤ Data supir & kendaraan
    const driverName = cleanStr(
      getField(item, ['namaSopir','driverName','sopir','nama_sopir',
                      'NAMA SOPIR','Nama Sopir','DRIVER','Driver','supir','SUPIR']),
      'Sopir Distributor'
    );
    const truckNumber = cleanStr(
      getField(item, ['vehiclePlate','truckNumber','nopol','NOPOL','Nopol',
                      'plat_kendaraan','PLAT','Plat','no_kendaraan']),
      '-'
    );
    const targetWarehouse = cleanStr(
      getField(item, ['gudang','targetWarehouse','GUDANG','Gudang','warehouse']),
      'Gudang Utama'
    );

    // ⑥ Branch — utamakan dari item, fallback dari penebusan
    const rawKab = cleanStr(
      getField(item, ['kabupaten','branch','cabang','KABUPATEN','BRANCH']) ||
      getField(linkedPen, ['kabupaten','branch','cabang']),
      'Magetan'
    ).toUpperCase();
    const branch = rawKab.includes('SRAGEN') ? 'Sragen' : 'Magetan';

    // ⑦ Tanggal — utamakan dari item, fallback dari penebusan
    const dateRaw = getField(item, [
      'tanggal','date','tgl','TANGGAL','Tanggal','DATE','Date'
    ]) || getField(linkedPen, ['tanggal','date','tgl']);

    return {
      id,
      doNo: penebusanId,
      penebusanId,
      date: parseDateStandard(dateRaw),
      branch,
      fertilizerId: fertilizerName,
      fertilizerName,
      qty,
      qtyTon: qty,
      driverName,
      truckNumber,
      vehiclePlate: truckNumber,
      targetWarehouse,
      status: cleanStr(getField(item, ['status','STATUS','Status']), 'Selesai'),
      notes: cleanStr(getField(item, ['catatan','keterangan','notes','CATATAN']) || '')
    };
  });
}

export function normalizePenyaluranList(rawList = [], rawPenebusan = [], rawDoList = []) {
  if (!Array.isArray(rawList)) return [];

  const penMap = {};
  if (Array.isArray(rawPenebusan)) {
    rawPenebusan.forEach(p => {
      const pId = cleanStr(
        getField(p, ['id','noDo','doNo','no_do','NO DO','No Do'])
      );
      if (pId) penMap[pId] = p;
    });
  }

  const doSeqMap = {};

  return rawList.map((item, idx) => {
    // Ambil NO DO dari berbagai kemungkinan nama header
    const rawNoDo = getField(item, [
      'noDo','doNo','doRefId','no_do','NO DO','No Do','NODO','no do',
      'nomor_do','NOMOR DO','Nomor DO'
    ]);
    const doRefId = cleanStr(rawNoDo || '');
    const linkedPen = penMap[doRefId] || {};

    // Nomor penyaluran / surat jalan
    const rawPenyaluranNo = getField(item, [
      'penyaluranNo','nomorPenyaluran','sjNo','noSJ','no_sj',
      'NO SJ','No SJ','NO PENYALURAN','No Penyaluran','nomor_sj'
    ]);
    let penyaluranNo = cleanStr(rawPenyaluranNo || '');
    if (!penyaluranNo || !penyaluranNo.includes('-')) {
      if (doRefId) {
        doSeqMap[doRefId] = (doSeqMap[doRefId] || 0) + 1;
        const seqStr = String(doSeqMap[doRefId]).padStart(2, '0');
        penyaluranNo = `${doRefId}-${seqStr}`;
      }
    }

    const id = cleanStr(
      getField(item, ['id']) ||
      rawPenyaluranNo ||
      penyaluranNo ||
      `SLR-${idx + 1}`
    );
    if (!penyaluranNo) penyaluranNo = id;

    const qty = Number(
      getField(item, ['qtyTon','qty','QTY','Qty','kuantitas','jumlah','JUMLAH'], 0)
    );
    const totalAmount = Number(
      getField(item, ['totalAmount','total','TOTAL','Total','total_tagihan',
                      'TOTAL TAGIHAN','Total Tagihan','tagihan'], 0)
    );
    const rawDiBayar = getField(item, [
      'totalBayarTempo','totalBayar','diBayar','paidAmount','DI BAYAR',
      'Di Bayar','DIBAYAR','dibayar','bayar'
    ]);
    const rawDiBayarNum = rawDiBayar !== undefined ? Number(rawDiBayar) : undefined;

    const rawKurangBayar = getField(item, [
      'kurangBayar','remainingAmount','KURANG BAYAR','Kurang Bayar',
      'sisa_bayar','sisaBayar','SISA BAYAR'
    ]);
    const rawKurangBayarNum = rawKurangBayar !== undefined ? Number(rawKurangBayar) : undefined;

    let paidAmount = 0;
    let remainingAmount = 0;

    if (rawKurangBayarNum !== undefined) {
      remainingAmount = rawKurangBayarNum;
      paidAmount = Math.max(0, totalAmount - remainingAmount);
    } else if (rawDiBayarNum !== undefined) {
      paidAmount = rawDiBayarNum;
      remainingAmount = Math.max(0, totalAmount - paidAmount);
    } else {
      paidAmount = 0;
      remainingAmount = totalAmount;
    }

    const pricePerTon = qty > 0 ? Math.round(totalAmount / qty) : Number(
      getField(item, ['pricePerTon','hargaPerTon','harga_per_ton','HARGA/TON'], 0)
    );

    const rawKet = cleanStr(
      getField(item, ['keterangan','paymentStatus','KETERANGAN','status_bayar','statusBayar','LUNAS']) || ''
    ).toUpperCase();
    let paymentStatus = 'Tempo';
    if (rawKet.includes('LUNAS') && !rawKet.includes('BELUM') && remainingAmount <= 0) {
      paymentStatus = 'Lunas';
    } else if (rawKet.includes('BELUM LUNAS') || rawKet.includes('TEMPO') || remainingAmount > 0) {
      paymentStatus = 'Tempo';
    } else if (rawKet.includes('LUNAS') || remainingAmount <= 0) {
      paymentStatus = 'Lunas';
    }

    const kiosName = cleanStr(
      getField(item, ['namaKios','kiosName','nama_kios','NAMA KIOS','Nama Kios','KIOS','Kios',
                      'kios','toko','TOKO']),
      'Kios Tani'
    );
    const fertilizerName = cleanStr(
      getField(item, ['namaProduk','fertilizerName','pupuk','jenisPupuk',
                      'JENIS PUPUK','Jenis Pupuk','NAMA PRODUK','Nama Produk']) ||
      getField(linkedPen, ['namaProduk','fertilizerName','pupuk','jenisPupuk']),
      'UREA'
    );
    const rawBranch = cleanStr(
      getField(item, ['kabupaten','branch','cabang','KABUPATEN','BRANCH']) || 
      getField(linkedPen, ['kabupaten','branch']),
      'Magetan'
    ).toUpperCase();
    const branch = rawBranch.includes('SRAGEN') ? 'Sragen' : 'Magetan';
    const driverName = cleanStr(
      getField(item, ['namaSopir','driverName','sopir','NAMA SOPIR','Nama Sopir','supir','SUPIR']),
      '-'
    );
    const vehiclePlate = cleanStr(
      getField(item, ['vehiclePlate','nopol','NOPOL','Nopol','plat','PLAT','no_kendaraan']),
      ''
    );

    const dateRaw = getField(item, [
      'tanggal','date','tgl','TANGGAL','Tanggal','DATE','Date','tgl_penyaluran'
    ]) || getField(linkedPen, ['tanggal','date','tgl']);

    return {
      id,
      sjNo: penyaluranNo,
      nomorPenyaluran: penyaluranNo,
      penyaluranNo,
      doRefId,
      doNo: doRefId,
      date: parseDateStandard(dateRaw),
      branch,
      kiosId: kiosName,
      kiosName,
      fertilizerId: fertilizerName,
      fertilizerName,
      qty,
      qtyTon: qty,
      pricePerTon,
      totalAmount,
      dpAmount: paidAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      driverName,
      vehiclePlate,
      deliveryStatus: cleanStr(getField(item, ['deliveryStatus','status_kirim']), 'delivered'),
      dueDate: getField(item, ['dueDate','jatuhTempo']) ? parseDateStandard(getField(item, ['dueDate','jatuhTempo'])) : '',
      notes: cleanStr(getField(item, ['catatan','keterangan','notes','CATATAN']) || '')
    };
  });
}

export function normalizeKiosks(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    const name = cleanStr(
      getField(item, ['namaKios', 'name', 'nama_kios', 'NAMA KIOS', 'Nama Kios', 'kios', 'KIOS', 'nama']),
      `Kios ${idx + 1}`
    );
    const owner = cleanStr(
      getField(item, ['penanggungJawab', 'owner', 'pemilik', 'PEMILIK', 'namaPemilik']),
      '-'
    );
    const rawKab = cleanStr(getField(item, ['kabupaten', 'branch', 'cabang', 'KABUPATEN']) || '').toUpperCase();
    const branch = rawKab.includes('SRAGEN') ? 'Sragen' : 'Magetan';
    
    const desa = getField(item, ['desa', 'DESA']);
    const kec = getField(item, ['kecamatan', 'KECAMATAN']);
    const kab = getField(item, ['kabupaten', 'KABUPATEN']);
    const addrParts = [desa, kec, kab].filter(Boolean);
    const address = addrParts.length > 0 
      ? addrParts.join(', ') 
      : cleanStr(getField(item, ['address', 'alamat', 'ALAMAT']), '-');

    return {
      id: cleanStr(getField(item, ['id', 'ID', 'kodeKios', 'code']) || `KIO-${idx + 1}`),
      code: cleanStr(getField(item, ['code', 'kodeKios', 'KODE KIOS', 'id']) || `KIO-${idx + 1}`),
      name,
      owner,
      phone: cleanStr(getField(item, ['phone', 'noHp', 'hp', 'telepon', 'NO HP', 'telp']), '-'),
      address,
      branch
    };
  });
}

export function normalizeFertilizers(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    const name = cleanStr(
      getField(item, ['productName', 'namaProduk', 'name', 'NAMA PRODUK', 'pupuk', 'jenisPupuk']),
      `Pupuk ${idx + 1}`
    );
    const rawKab = cleanStr(getField(item, ['kabupaten', 'branch', 'cabang', 'KABUPATEN']) || '').toUpperCase();
    const branch = rawKab.includes('SRAGEN') ? 'Sragen' : 'Magetan';
    const supplier = cleanStr(getField(item, ['supplier', 'SUPPLIER', 'distributor']), 'PT PETROKIMIA GRESIK');

    return {
      id: cleanStr(getField(item, ['id', 'ID', 'kodeProduk']) || `FERT-${idx + 1}`),
      name,
      priceBuy: Number(getField(item, ['hargaBeli', 'priceBuy', 'HARGA BELI', 'beli']) || 0),
      priceSell: Number(getField(item, ['hargaJual', 'priceSell', 'HARGA JUAL', 'jual']) || 0),
      stock: Number(getField(item, ['stok', 'stock', 'STOK', 'qty']) || 0),
      supplier,
      branch
    };
  });
}

export function normalizePayments(rawList = []) {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    const kiosName = cleanStr(
      getField(item, ['namaKios', 'kiosName', 'nama_kios', 'NAMA KIOS', 'kios', 'KIOS']),
      'Kios Tani'
    );
    const rawKab = cleanStr(getField(item, ['kabupaten', 'branch', 'cabang', 'KABUPATEN']) || '').toUpperCase();
    const branch = rawKab.includes('SRAGEN') ? 'Sragen' : 'Magetan';
    const noDo = cleanStr(getField(item, ['noDo', 'doNo', 'NO DO', 'No DO', 'nodo']) || '');
    const penyaluranId = cleanStr(getField(item, ['nomorPenyaluran', 'penyaluranId', 'sjNo', 'NO PENYALURAN']) || '');

    return {
      id: cleanStr(getField(item, ['id', 'ID']) || `PAY-${idx + 1}`),
      penyaluranId,
      doRefId: noDo,
      doNo: noDo,
      kiosName,
      date: parseDateStandard(getField(item, ['tanggal', 'date', 'tgl', 'TANGGAL', 'Tanggal'])),
      amount: Number(getField(item, ['totalBayar', 'amount', 'nominal', 'jumlah', 'TOTAL BAYAR', 'bayar']) || 0),
      paymentMethod: cleanStr(getField(item, ['metodePembayaran', 'paymentMethod', 'metode', 'METODE']), 'Transfer Bank'),
      branch,
      notes: cleanStr(getField(item, ['catatan', 'keterangan', 'notes', 'CATATAN']) || '')
    };
  });
}

export function normalizeDrivers(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: cleanStr(getField(item, ['id', 'ID']) || `DRV-${idx + 1}`),
    name: cleanStr(getField(item, ['name', 'namaSopir', 'nama', 'sopir', 'supir', 'NAMA SOPIR']), `Driver ${idx + 1}`),
    phone: cleanStr(getField(item, ['phone', 'telepon', 'noHp', 'hp', 'NO HP']), '-'),
    truckNumber: cleanStr(getField(item, ['truckNumber', 'nopol', 'plat', 'NOPOL', 'platNomor']), '-'),
    branch: cleanStr(getField(item, ['branch', 'cabang', 'kabupaten']) || 'Magetan')
  }));
}

export function normalizeSuppliers(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => ({
    id: cleanStr(getField(item, ['id', 'ID']) || `SUP-${idx + 1}`),
    name: cleanStr(getField(item, ['name', 'supplier', 'nama', 'namaSupplier', 'SUPPLIER']), `Supplier ${idx + 1}`),
    phone: cleanStr(getField(item, ['phone', 'telepon', 'noHp', 'hp']), '-'),
    address: cleanStr(getField(item, ['address', 'alamat', 'ALAMAT']), '-')
  }));
}

export function normalizeKasAngkutanList(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => {
    const rawKab = cleanStr(getField(item, ['kabupaten', 'branch', 'cabang', 'KABUPATEN']) || '').toUpperCase();
    const branch = rawKab.includes('SRAGEN') ? 'Sragen' : 'Magetan';
    const adminFee = Number(getField(item, ['adminFee', 'admin', 'ADMIN']) || 0);
    const mealFee = Number(getField(item, ['mealFee', 'uangMakan', 'makan', 'UANG MAKAN']) || 0);
    const palangFee = Number(getField(item, ['palangFee', 'palang', 'PALANG']) || 0);
    const solarFee = Number(getField(item, ['solarFee', 'solar', 'SOLAR', 'bbm']) || 0);
    const driverWage = Number(getField(item, ['driverWage', 'upahSopir', 'upah', 'UPAH SOPIR']) || 0);
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
      uraian: cleanStr(item.description || item.uraian || item.notes || ''),
      amount,
      nominal: amount,
      admin: adminFee,
      adminFee,
      uangMakan: mealFee,
      mealFee,
      palang: palangFee,
      palangFee,
      solar: solarFee,
      solarFee,
      upahSopir: driverWage,
      driverWage,
      lembur: overtimeFee,
      overtimeFee,
      helper: helperFee,
      helperFee,
      lainLain: otherFee,
      otherFee,
      notes: cleanStr(item.catatan || item.notes || '')
    };
  });
}

export function normalizeKasUmumList(rawList = []) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item, idx) => {
    const branch = item.kabupaten === 'SRAGEN' ? 'Sragen' : (item.kabupaten === 'MAGETAN' ? 'Magetan' : cleanStr(item.branch, 'Magetan'));
    
    const pem = Number(item.pemasukan || item.masuk || 0);
    const peng = Number(item.pengeluaran || item.keluar || 0);
    
    let type = 'Pengeluaran';
    let amt = 0;

    if (pem > 0) {
      type = 'Pemasukan';
      amt = pem;
    } else if (peng > 0) {
      type = 'Pengeluaran';
      amt = peng;
    } else {
      let rawType = cleanStr(item.type || item.tipe || item.jenis || 'Pengeluaran');
      if (rawType.toLowerCase().includes('masuk') || rawType.toLowerCase().includes('in')) {
        type = 'Pemasukan';
      } else {
        type = 'Pengeluaran';
      }
      amt = Number(item.amount || item.nominal || item.total || item.jumlah || item.nilai || 0);
    }

    const desc = cleanStr(item.uraian || item.description || item.keterangan || item.catatan || '-');

    return {
      ...item,
      id: cleanStr(item.id || `KU-${idx + 1}`),
      branch,
      date: parseDateStandard(item.tanggal || item.date),
      type,
      category: cleanStr(item.category || item.kategori || item.jenisPengeluaran, 'Operasional'),
      description: desc,
      amount: amt,
      nominal: amt,
      notes: desc,
      catatan: desc,
      recipient: cleanStr(item.recipient || item.penerima || '-')
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
    penyaluranList: normalizePenyaluranList(rawSalur, rawPen, rawDO),
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
