import { createClient } from '@libsql/client/web';

/**
 * Service untuk sinkronisasi data dengan Turso Edge Database
 */

export async function syncDataToTurso(fullData, config = {}) {
  // Option 1: Synchronize via Cloudflare Pages Function endpoint /api/sync
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: fullData })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return { success: true, mode: 'api', message: json.message };
    }
  } catch {
    // API endpoint not available locally or directly
  }

  // Option 2: Direct connection to Turso using client URL & token if provided
  const dbUrl = config.tursoUrl || localStorage.getItem('TURSO_DATABASE_URL');
  const dbToken = config.tursoToken || localStorage.getItem('TURSO_AUTH_TOKEN');

  if (!dbUrl) {
    throw new Error('TURSO_DATABASE_URL belum dikonfigurasi. Masukkan URL database Turso di menu Pengaturan.');
  }

  const client = createClient({
    url: dbUrl,
    authToken: dbToken || undefined
  });

  const tx = await client.transaction('write');
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

      for (const item of items) {
        if (!item.id) continue;
        const args = columns.map(col => item[col] !== undefined ? item[col] : null);
        await tx.execute({ sql, args });
      }
    };

    await upsertBatch('users', fullData.usersList, ['id', 'username', 'password', 'name', 'role', 'branch']);
    await upsertBatch('fertilizers', fullData.fertilizers, ['id', 'name', 'priceBuy', 'priceSell', 'stock', 'supplier', 'branch']);
    await upsertBatch('suppliers', fullData.suppliers, ['id', 'name', 'phone', 'address']);
    await upsertBatch('drivers', fullData.drivers, ['id', 'name', 'phone', 'truckNumber', 'branch']);
    await upsertBatch('kiosks', fullData.kiosks, ['id', 'code', 'name', 'owner', 'address', 'phone', 'branch']);
    await upsertBatch('penebusan', fullData.penebusanList, ['id', 'doNo', 'spjbNo', 'date', 'supplierId', 'supplierName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'status', 'notes', 'branch']);
    await upsertBatch('do_expenses', fullData.doList, ['id', 'doNo', 'penebusanId', 'date', 'fertilizerId', 'fertilizerName', 'qtyTon', 'driverName', 'vehiclePlate', 'targetWarehouse', 'status', 'notes', 'branch']);
    await upsertBatch('penyaluran', fullData.penyaluranList, ['id', 'penyaluranNo', 'nomorPenyaluran', 'sjNo', 'doRefId', 'doNo', 'date', 'kiosId', 'kiosName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'dpAmount', 'paymentStatus', 'driverName', 'vehiclePlate', 'deliveryStatus', 'notes', 'branch']);
    await upsertBatch('payments', fullData.payments, ['id', 'penyaluranId', 'doRefId', 'doNo', 'kiosName', 'date', 'amount', 'paymentMethod', 'notes', 'branch']);
    await upsertBatch('deposits', fullData.deposits, ['id', 'kiosId', 'kiosName', 'date', 'amount', 'notes', 'branch']);
    await upsertBatch('kas_angkutan', fullData.kasAngkutanList, ['id', 'branch', 'date', 'doNo', 'penyaluranNo', 'kiosName', 'driverName', 'transactionType', 'description', 'amount', 'adminFee', 'mealFee', 'palangFee', 'solarFee', 'driverWage', 'overtimeFee', 'helperFee', 'otherFee', 'notes']);
    await upsertBatch('kas_umum', fullData.kasUmumList, ['id', 'branch', 'date', 'type', 'category', 'description', 'amount', 'notes']);
    await upsertBatch('activity_logs', fullData.activityLogs, ['id', 'timestamp', 'user', 'role', 'action', 'details']);

    await tx.commit();
    return { success: true, mode: 'direct', message: 'Data berhasil disinkronkan langsung ke Turso Cloud Database!' };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

export async function fetchDataFromTurso(config = {}) {
  // Option 1: Fetch via Cloudflare Pages Function API
  try {
    const res = await fetch('/api/sync');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return { success: true, mode: 'api', data: json.data };
    }
  } catch {
    // API endpoint not available locally or directly
  }

  // Option 2: Direct query using Turso client
  const dbUrl = config.tursoUrl || localStorage.getItem('TURSO_DATABASE_URL');
  const dbToken = config.tursoToken || localStorage.getItem('TURSO_AUTH_TOKEN');

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
