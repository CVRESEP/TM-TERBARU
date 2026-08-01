import { createClient } from '@libsql/client/web';

/**
 * Service untuk sinkronisasi data dengan Turso Edge Database
 */

const DEFAULT_TURSO_URL = 'libsql://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

export async function syncDataToTurso(fullData, config = {}) {

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

    // Sync settings key-values
    if (fullData.settings && typeof fullData.settings === 'object') {
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
      const activeIds = items
        .map(item => String(item.id || item.doNo || item.penyaluranNo || item.nomorPenyaluran || item.kiosId || item.code || item.username || ''))
        .filter(Boolean);

      if (activeIds.length > 0) {
        // Process deletion in chunks of 50 to prevent SQL length limits
        for (let k = 0; k < activeIds.length; k += 50) {
          const chunkIds = activeIds.slice(k, k + 50);
          const placeholders = chunkIds.map(() => '?').join(', ');
          // Only perform cleanup for tables where ID tracking applies
          if (['penebusan', 'do_expenses', 'penyaluran', 'payments', 'deposits', 'kas_angkutan', 'kas_umum'].includes(tableName)) {
            // Check if there are items outside activeIds to delete
            await client.execute({
              sql: `DELETE FROM ${tableName} WHERE id NOT IN (${placeholders})`,
              args: chunkIds
            }).catch(err => console.log(`Turso SQL cleanup in ${tableName}:`, err.message));
          }
        }
      } else if (['penebusan', 'do_expenses', 'penyaluran', 'payments', 'deposits', 'kas_angkutan', 'kas_umum'].includes(tableName)) {
        await client.execute(`DELETE FROM ${tableName}`).catch(err => console.log(`Turso table clear ${tableName}:`, err.message));
      }
    };

    await syncTableBatch('users', fullData.usersList, ['id', 'username', 'password', 'name', 'role', 'branch']);
    await syncTableBatch('fertilizers', fullData.fertilizers, ['id', 'name', 'priceBuy', 'priceSell', 'stock', 'supplier', 'branch']);
    await syncTableBatch('suppliers', fullData.suppliers, ['id', 'name', 'phone', 'address']);
    await syncTableBatch('drivers', fullData.drivers, ['id', 'name', 'phone', 'truckNumber', 'branch']);
    await syncTableBatch('kiosks', fullData.kiosks, ['id', 'code', 'name', 'owner', 'address', 'phone', 'branch']);
    await syncTableBatch('penebusan', fullData.penebusanList, ['id', 'doNo', 'spjbNo', 'date', 'supplierId', 'supplierName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'status', 'notes', 'branch']);
    await syncTableBatch('do_expenses', fullData.doList, ['id', 'doNo', 'penebusanId', 'date', 'fertilizerId', 'fertilizerName', 'qtyTon', 'driverName', 'vehiclePlate', 'targetWarehouse', 'status', 'notes', 'branch']);
    await syncTableBatch('penyaluran', fullData.penyaluranList, ['id', 'penyaluranNo', 'nomorPenyaluran', 'sjNo', 'doRefId', 'doNo', 'date', 'kiosId', 'kiosName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'dpAmount', 'paymentStatus', 'driverName', 'vehiclePlate', 'deliveryStatus', 'notes', 'branch']);
    await syncTableBatch('payments', fullData.payments, ['id', 'penyaluranId', 'doRefId', 'doNo', 'kiosName', 'date', 'amount', 'paymentMethod', 'notes', 'branch']);
    await syncTableBatch('deposits', fullData.deposits, ['id', 'kiosId', 'kiosName', 'date', 'amount', 'notes', 'branch']);
    await syncTableBatch('kas_angkutan', fullData.kasAngkutanList, ['id', 'branch', 'date', 'doNo', 'penyaluranNo', 'kiosName', 'driverName', 'transactionType', 'description', 'amount', 'adminFee', 'mealFee', 'palangFee', 'solarFee', 'driverWage', 'overtimeFee', 'helperFee', 'otherFee', 'notes']);
    await syncTableBatch('kas_umum', fullData.kasUmumList, ['id', 'branch', 'date', 'type', 'category', 'description', 'amount', 'notes']);
    await syncTableBatch('activity_logs', fullData.activityLogs, ['id', 'timestamp', 'user', 'role', 'action', 'details']);

    return { success: true, mode: 'direct', message: 'Data berhasil disinkronkan langsung ke Turso Cloud Database!' };
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
