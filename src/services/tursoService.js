import { createClient } from '@libsql/client/web';

/**
 * Service untuk sinkronisasi data dengan Turso Edge Database
 */

const DEFAULT_TURSO_URL = 'libsql://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

export async function syncDataToTurso(fullData, config = {}, changedTables = null) {

  function formatTursoUrl(url) {
    if (!url) return '';
    let formatted = String(url).trim();
    if (formatted.startsWith('libsql://')) {
      formatted = formatted.replace('libsql://', 'https://');
    }
    return formatted;
  }

  const getLocal = (key) => (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
  const dbUrl = formatTursoUrl(config.tursoUrl || getLocal('TURSO_DATABASE_URL') || DEFAULT_TURSO_URL);
  const dbToken = config.tursoToken || getLocal('TURSO_AUTH_TOKEN') || DEFAULT_TURSO_TOKEN;

  if (!dbUrl) {
    throw new Error('TURSO_DATABASE_URL belum dikonfigurasi. Masukkan URL database Turso di menu Pengaturan.');
  }

  const client = createClient({
    url: dbUrl,
    authToken: dbToken || undefined
  });

  try {
    // Ensure table structure exists
    await client.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS fertilizers (id TEXT PRIMARY KEY, name TEXT, priceBuy REAL, priceSell REAL, stock REAL, supplier TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, truckNumber TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS kiosks (id TEXT PRIMARY KEY, code TEXT, name TEXT, owner TEXT, address TEXT, phone TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS penebusan (id TEXT PRIMARY KEY, doNo TEXT, spjbNo TEXT, date TEXT, supplierId TEXT, supplierName TEXT, fertilizerId TEXT, fertilizerName TEXT, qtyTon REAL, pricePerTon REAL, totalAmount REAL, status TEXT, notes TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS do_expenses (id TEXT PRIMARY KEY, doNo TEXT, penebusanId TEXT, date TEXT, fertilizerId TEXT, fertilizerName TEXT, qtyTon REAL, driverName TEXT, vehiclePlate TEXT, targetWarehouse TEXT, status TEXT, notes TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS penyaluran (id TEXT PRIMARY KEY, penyaluranNo TEXT, nomorPenyaluran TEXT, sjNo TEXT, doRefId TEXT, doNo TEXT, date TEXT, kiosId TEXT, kiosName TEXT, fertilizerId TEXT, fertilizerName TEXT, qtyTon REAL, pricePerTon REAL, totalAmount REAL, dpAmount REAL, paymentStatus TEXT, driverName TEXT, vehiclePlate TEXT, deliveryStatus TEXT, notes TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, penyaluranId TEXT, doRefId TEXT, doNo TEXT, kiosName TEXT, date TEXT, amount REAL, paymentMethod TEXT, notes TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS deposits (id TEXT PRIMARY KEY, kiosId TEXT, kiosName TEXT, date TEXT, amount REAL, notes TEXT, branch TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS kas_angkutan (id TEXT PRIMARY KEY, branch TEXT, date TEXT, doNo TEXT, penyaluranNo TEXT, kiosName TEXT, driverName TEXT, transactionType TEXT, description TEXT, amount REAL, adminFee REAL, mealFee REAL, palangFee REAL, solarFee REAL, driverWage REAL, overtimeFee REAL, helperFee REAL, otherFee REAL, notes TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS kas_umum (id TEXT PRIMARY KEY, branch TEXT, date TEXT, type TEXT, category TEXT, description TEXT, amount REAL, notes TEXT);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS activity_logs (id TEXT PRIMARY KEY, timestamp TEXT, user TEXT, role TEXT, action TEXT, details TEXT);`);

    const upsertBatch = async (tableName, items, columns) => {
      if (!Array.isArray(items) || items.length === 0) return;
      const placeholders = columns.map(() => '?').join(', ');
      const setClause = columns.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${setClause}`;

      const statements = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || typeof item !== 'object') continue;
        const itemId = String(item.id || item.doNo || item.penyaluranNo || item.nomorPenyaluran || item.kiosId || item.code || item.username || `${tableName.toUpperCase()}-${Date.now()}-${i}`);
        const normalizedItem = { ...item, id: itemId };
        const args = columns.map(col => {
          const val = normalizedItem[col];
          if (val === undefined || val === null) return (col === 'id' ? itemId : null);
          if (typeof val === 'object') return JSON.stringify(val);
          return val;
        });
        statements.push({ sql, args });
      }

      for (let j = 0; j < statements.length; j += 40) {
        const chunk = statements.slice(j, j + 40);
        try {
          if (client.batch) {
            await client.batch(chunk, 'write');
          } else {
            for (const stmt of chunk) {
              await client.execute(stmt);
            }
          }
        } catch {
          for (const stmt of chunk) {
            await client.execute(stmt).catch(() => {});
          }
        }
      }
    };

    const syncAll = !changedTables || changedTables.length === 0;

    // Sync settings key-values
    if ((syncAll || changedTables.includes('settings')) && fullData.settings && typeof fullData.settings === 'object') {
      const settingStatements = [];
      for (const [key, value] of Object.entries(fullData.settings)) {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        settingStatements.push({
          sql: `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
          args: [key, valStr]
        });
      }
      for (let j = 0; j < settingStatements.length; j += 40) {
        const chunk = settingStatements.slice(j, j + 40);
        try {
          if (client.batch) await client.batch(chunk, 'write');
          else for (const stmt of chunk) await client.execute(stmt);
        } catch {
          for (const stmt of chunk) await client.execute(stmt).catch(() => {});
        }
      }
    }

    const syncTableBatch = async (tableName, items, columns) => {
      if (!Array.isArray(items)) return;
      await upsertBatch(tableName, items, columns);

      // Clean up records in Turso DB that were deleted in the local app state
      if (['penebusan', 'do_expenses', 'penyaluran', 'payments', 'deposits', 'kas_angkutan', 'kas_umum'].includes(tableName)) {
        try {
          const res = await client.execute(`SELECT id FROM ${tableName}`);
          if (res && Array.isArray(res.rows)) {
            const dbIds = res.rows.map(r => String(r.id || ''));
            const activeSet = new Set(
              items
                .map(item => String(item.id || item.doNo || item.penyaluranNo || item.nomorPenyaluran || item.kiosId || item.code || item.username || ''))
                .filter(Boolean)
            );
            const idsToDelete = dbIds.filter(id => id && !activeSet.has(id));

            if (idsToDelete.length > 0) {
              for (let k = 0; k < idsToDelete.length; k += 50) {
                const chunk = idsToDelete.slice(k, k + 50);
                const placeholders = chunk.map(() => '?').join(', ');
                await client.execute({
                  sql: `DELETE FROM ${tableName} WHERE id IN (${placeholders})`,
                  args: chunk
                }).catch(err => console.log(`Delete cleanup error in ${tableName}:`, err.message));
              }
            }
          }
        } catch (err) {
          console.log(`Failed fetching DB IDs for ${tableName} cleanup:`, err.message);
        }
      }
    };

    if (syncAll || changedTables.includes('users')) await syncTableBatch('users', fullData.usersList, ['id', 'username', 'password', 'name', 'role', 'branch']);
    if (syncAll || changedTables.includes('fertilizers')) await syncTableBatch('fertilizers', fullData.fertilizers, ['id', 'name', 'priceBuy', 'priceSell', 'stock', 'supplier', 'branch']);
    if (syncAll || changedTables.includes('suppliers')) await syncTableBatch('suppliers', fullData.suppliers, ['id', 'name', 'phone', 'address']);
    if (syncAll || changedTables.includes('drivers')) await syncTableBatch('drivers', fullData.drivers, ['id', 'name', 'phone', 'truckNumber', 'branch']);
    if (syncAll || changedTables.includes('kiosks')) await syncTableBatch('kiosks', fullData.kiosks, ['id', 'code', 'name', 'owner', 'address', 'phone', 'branch']);
    if (syncAll || changedTables.includes('penebusan')) await syncTableBatch('penebusan', fullData.penebusanList, ['id', 'doNo', 'spjbNo', 'date', 'supplierId', 'supplierName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'status', 'notes', 'branch']);
    if (syncAll || changedTables.includes('do_expenses')) await syncTableBatch('do_expenses', fullData.doList, ['id', 'doNo', 'penebusanId', 'date', 'fertilizerId', 'fertilizerName', 'qtyTon', 'driverName', 'vehiclePlate', 'targetWarehouse', 'status', 'notes', 'branch']);
    if (syncAll || changedTables.includes('penyaluran')) await syncTableBatch('penyaluran', fullData.penyaluranList, ['id', 'penyaluranNo', 'nomorPenyaluran', 'sjNo', 'doRefId', 'doNo', 'date', 'kiosId', 'kiosName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'dpAmount', 'paymentStatus', 'driverName', 'vehiclePlate', 'deliveryStatus', 'notes', 'branch']);
    if (syncAll || changedTables.includes('payments')) await syncTableBatch('payments', fullData.payments, ['id', 'penyaluranId', 'doRefId', 'doNo', 'kiosName', 'date', 'amount', 'paymentMethod', 'notes', 'branch']);
    if (syncAll || changedTables.includes('deposits')) await syncTableBatch('deposits', fullData.deposits, ['id', 'kiosId', 'kiosName', 'date', 'amount', 'notes', 'branch']);
    if (syncAll || changedTables.includes('kas_angkutan')) await syncTableBatch('kas_angkutan', fullData.kasAngkutanList, ['id', 'branch', 'date', 'doNo', 'penyaluranNo', 'kiosName', 'driverName', 'transactionType', 'description', 'amount', 'adminFee', 'mealFee', 'palangFee', 'solarFee', 'driverWage', 'overtimeFee', 'helperFee', 'otherFee', 'notes']);
    if (syncAll || changedTables.includes('kas_umum')) await syncTableBatch('kas_umum', fullData.kasUmumList, ['id', 'branch', 'date', 'type', 'category', 'description', 'amount', 'notes']);
    if (syncAll || changedTables.includes('activity_logs')) await syncTableBatch('activity_logs', fullData.activityLogs, ['id', 'timestamp', 'user', 'role', 'action', 'details']);

    return { success: true, mode: 'direct', message: 'Data berhasil disinkronkan langsung ke Turso Cloud Database!' };
  } catch (err) {
    throw err;
  }
}

export async function syncPartialDataToTurso(tableName, items, mode = 'append', config = {}, onProgress = null) {
  function formatTursoUrl(url) {
    if (!url) return '';
    let formatted = String(url).trim();
    if (formatted.startsWith('libsql://')) {
      formatted = formatted.replace('libsql://', 'https://');
    }
    return formatted;
  }

  const getLocal = (key) => (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
  const dbUrl = formatTursoUrl(config.tursoUrl || getLocal('TURSO_DATABASE_URL') || DEFAULT_TURSO_URL);
  const dbToken = config.tursoToken || getLocal('TURSO_AUTH_TOKEN') || DEFAULT_TURSO_TOKEN;

  if (!dbUrl) throw new Error('TURSO_DATABASE_URL belum dikonfigurasi.');

  const client = createClient({
    url: dbUrl,
    authToken: dbToken || undefined
  });

  try {
    const tableColumnsMap = {
      'penebusan': ['id', 'doNo', 'spjbNo', 'date', 'supplierId', 'supplierName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'status', 'notes', 'branch'],
      'do_expenses': ['id', 'doNo', 'penebusanId', 'date', 'fertilizerId', 'fertilizerName', 'qtyTon', 'driverName', 'vehiclePlate', 'targetWarehouse', 'status', 'notes', 'branch'],
      'penyaluran': ['id', 'penyaluranNo', 'nomorPenyaluran', 'sjNo', 'doRefId', 'doNo', 'date', 'kiosId', 'kiosName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'dpAmount', 'paymentStatus', 'driverName', 'vehiclePlate', 'deliveryStatus', 'notes', 'branch'],
      'payments': ['id', 'penyaluranId', 'doRefId', 'doNo', 'kiosName', 'date', 'amount', 'paymentMethod', 'notes', 'branch'],
      'deposits': ['id', 'kiosId', 'kiosName', 'date', 'amount', 'notes', 'branch'],
      'kas_angkutan': ['id', 'branch', 'date', 'doNo', 'penyaluranNo', 'kiosName', 'driverName', 'transactionType', 'description', 'amount', 'adminFee', 'mealFee', 'palangFee', 'solarFee', 'driverWage', 'overtimeFee', 'helperFee', 'otherFee', 'notes'],
      'kas_umum': ['id', 'branch', 'date', 'type', 'category', 'description', 'amount', 'notes'],
      'kiosks': ['id', 'code', 'name', 'owner', 'address', 'phone', 'branch'],
      'fertilizers': ['id', 'name', 'priceBuy', 'priceSell', 'stock', 'supplier', 'branch'],
      'suppliers': ['id', 'name', 'phone', 'address'],
      'drivers': ['id', 'name', 'phone', 'truckNumber', 'branch']
    };

    const columns = tableColumnsMap[tableName];
    if (!columns) throw new Error(`Table ${tableName} tidak didukung untuk partial sync.`);

    if (onProgress) {
      onProgress({
        stage: 'prepare',
        percent: 15,
        message: `Mempersiapkan struktur data tabel ${tableName}...`,
        batchInfo: `0 / ${items.length} baris`
      });
    }

    // If replace mode, delete all existing data in that table first
    if (mode === 'replace') {
      if (onProgress) {
        onProgress({
          stage: 'clearing',
          percent: 25,
          message: `Mengosongkan data lama di tabel ${tableName} (Mode Replace)...`,
          batchInfo: `Membersihkan tabel...`
        });
      }
      await client.execute(`DELETE FROM ${tableName}`);
    }

    // Upsert batch
    if (!Array.isArray(items) || items.length === 0) return { success: true, message: 'Tidak ada data untuk diimport.' };
    
    const placeholders = columns.map(() => '?').join(', ');
    const setClause = columns.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${setClause}`;

    const statements = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || typeof item !== 'object') continue;
      const rawId = String(item.id || item.doNo || item.penyaluranNo || item.nomorPenyaluran || item.kiosId || item.code || item.username || `${tableName.toUpperCase()}-${Date.now()}-${i}`).trim();
      const itemId = rawId;
      const normalizedItem = { ...item, id: itemId };

      // Ensure key constraints
      if (!normalizedItem.doNo) normalizedItem.doNo = itemId;
      if (!normalizedItem.spjbNo) normalizedItem.spjbNo = normalizedItem.doNo || itemId;
      if (!normalizedItem.branch) normalizedItem.branch = 'Magetan';

      const args = columns.map(col => {
        const val = normalizedItem[col];
        if (val === undefined || val === null) return (col === 'id' ? itemId : null);
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      });
      statements.push({ sql, args });
    }

    const totalBatches = Math.ceil(statements.length / 40);

    for (let j = 0; j < statements.length; j += 40) {
      const chunk = statements.slice(j, j + 40);
      const batchNum = Math.floor(j / 40) + 1;
      const processedCount = Math.min(j + chunk.length, statements.length);
      const percentVal = Math.round(30 + (processedCount / statements.length) * 60);

      if (onProgress) {
        onProgress({
          stage: 'uploading',
          percent: percentVal,
          currentBatch: batchNum,
          totalBatches,
          processedItems: processedCount,
          totalItems: statements.length,
          message: `Mengunggah batch ${batchNum} dari ${totalBatches} (${processedCount}/${statements.length} baris)...`,
          batchInfo: `Batch ${batchNum}/${totalBatches} • ${processedCount} / ${statements.length} baris terkirim`
        });
      }

      try {
        if (client.batch) {
          await client.batch(chunk, 'write');
        } else {
          for (const stmt of chunk) {
            await client.execute(stmt);
          }
        }
      } catch (err) {
        console.warn('Batch chunk failed, trying sequentially:', err.message);
        let firstErr = null;
        let failCount = 0;
        for (const stmt of chunk) {
          try {
            await client.execute(stmt);
          } catch (e) {
            console.error('Sequential execution failed on SQL:', stmt.sql, 'error:', e.message);
            if (!firstErr) firstErr = e;
            failCount++;
          }
        }
        if (failCount === chunk.length && firstErr) {
          throw new Error(`Gagal import ke tabel ${tableName}: ${firstErr.message}`);
        }
      }
    }

    if (onProgress) {
      onProgress({
        stage: 'syncing',
        percent: 95,
        message: 'Menyinkronkan data ke tampilan realtime aplikasi...',
        batchInfo: `Menyelesaikan ${statements.length} baris`
      });
    }

    return { success: true, message: `Berhasil import ${items.length} baris data ke tabel ${tableName} Turso.` };
  } catch (err) {
    throw err;
  }
}


export async function fetchDataFromTurso(config = {}) {

  function formatTursoUrl(url) {
    if (!url) return '';
    let formatted = String(url).trim();
    if (formatted.startsWith('libsql://')) {
      formatted = formatted.replace('libsql://', 'https://');
    }
    return formatted;
  }

  const getLocal = (key) => (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
  const dbUrl = formatTursoUrl(config.tursoUrl || getLocal('TURSO_DATABASE_URL') || DEFAULT_TURSO_URL);
  const dbToken = config.tursoToken || getLocal('TURSO_AUTH_TOKEN') || DEFAULT_TURSO_TOKEN;

  if (!dbUrl) {
    throw new Error('TURSO_DATABASE_URL belum dikonfigurasi. Masukkan URL database Turso di menu Pengaturan.');
  }

  const client = createClient({
    url: dbUrl,
    authToken: dbToken || undefined
  });

  const [
    setRes, usrRes, fertRes, supRes, drvRes, kiosRes, penRes, doRes, salRes, payRes, depRes, kaRes, kuRes, logRes
  ] = await Promise.all([
    client.execute('SELECT * FROM settings').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM users').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM fertilizers').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM suppliers').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM drivers').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM kiosks').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM penebusan').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM do_expenses').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM penyaluran').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM payments').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM deposits').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM kas_angkutan').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM kas_umum').catch(() => ({ rows: [] })),
    client.execute('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500').catch(() => ({ rows: [] }))
  ]);

  const settings = {};
  for (const row of setRes.rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }

  return {
    success: true,
    mode: 'direct',
    data: {
      settings,
      usersList: usrRes.rows,
      fertilizers: fertRes.rows,
      suppliers: supRes.rows,
      drivers: drvRes.rows,
      kiosks: kiosRes.rows,
      penebusanList: penRes.rows,
      doList: doRes.rows,
      penyaluranList: salRes.rows,
      payments: payRes.rows,
      deposits: depRes.rows,
      kasAngkutanList: kaRes.rows,
      kasUmumList: kuRes.rows,
      activityLogs: logRes.rows
    }
  };
}
