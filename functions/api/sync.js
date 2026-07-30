import { createClient } from '@libsql/client/web';

function getTursoClient(env) {
  const url = env.TURSO_DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not set in environment variables');
  }

  return createClient({ url, authToken });
}

// Ensure database tables exist
async function initTables(client) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`,
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS fertilizers (id TEXT PRIMARY KEY, name TEXT, priceBuy REAL, priceSell REAL, stock REAL, supplier TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, address TEXT);`,
    `CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY, name TEXT, phone TEXT, truckNumber TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS kiosks (id TEXT PRIMARY KEY, code TEXT, name TEXT, owner TEXT, address TEXT, phone TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS penebusan (id TEXT PRIMARY KEY, doNo TEXT, spjbNo TEXT, date TEXT, supplierId TEXT, supplierName TEXT, fertilizerId TEXT, fertilizerName TEXT, qtyTon REAL, pricePerTon REAL, totalAmount REAL, status TEXT, notes TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS do_expenses (id TEXT PRIMARY KEY, doNo TEXT, penebusanId TEXT, date TEXT, fertilizerId TEXT, fertilizerName TEXT, qtyTon REAL, driverName TEXT, vehiclePlate TEXT, targetWarehouse TEXT, status TEXT, notes TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS penyaluran (id TEXT PRIMARY KEY, penyaluranNo TEXT, nomorPenyaluran TEXT, sjNo TEXT, doRefId TEXT, doNo TEXT, date TEXT, kiosId TEXT, kiosName TEXT, fertilizerId TEXT, fertilizerName TEXT, qtyTon REAL, pricePerTon REAL, totalAmount REAL, dpAmount REAL, paymentStatus TEXT, driverName TEXT, vehiclePlate TEXT, deliveryStatus TEXT, notes TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, penyaluranId TEXT, doRefId TEXT, doNo TEXT, kiosName TEXT, date TEXT, amount REAL, paymentMethod TEXT, notes TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS deposits (id TEXT PRIMARY KEY, kiosId TEXT, kiosName TEXT, date TEXT, amount REAL, notes TEXT, branch TEXT);`,
    `CREATE TABLE IF NOT EXISTS kas_angkutan (id TEXT PRIMARY KEY, branch TEXT, date TEXT, doNo TEXT, penyaluranNo TEXT, kiosName TEXT, driverName TEXT, transactionType TEXT, description TEXT, amount REAL, adminFee REAL, mealFee REAL, palangFee REAL, solarFee REAL, driverWage REAL, overtimeFee REAL, helperFee REAL, otherFee REAL, notes TEXT);`,
    `CREATE TABLE IF NOT EXISTS kas_umum (id TEXT PRIMARY KEY, branch TEXT, date TEXT, type TEXT, category TEXT, description TEXT, amount REAL, notes TEXT);`,
    `CREATE TABLE IF NOT EXISTS activity_logs (id TEXT PRIMARY KEY, timestamp TEXT, user TEXT, role TEXT, action TEXT, details TEXT);`
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      console.error('Table init warning:', e.message);
    }
  }
}

// GET: Pull all data from Turso
export async function onRequestGet({ env }) {
  try {
    const client = getTursoClient(env);
    await initTables(client);

    const [
      setRes, usrRes, fertRes, supRes, drvRes, kiosRes, penRes, doRes, salRes, payRes, depRes, kaRes, kuRes, logRes
    ] = await Promise.all([
      client.execute('SELECT * FROM settings'),
      client.execute('SELECT * FROM users'),
      client.execute('SELECT * FROM fertilizers'),
      client.execute('SELECT * FROM suppliers'),
      client.execute('SELECT * FROM drivers'),
      client.execute('SELECT * FROM kiosks'),
      client.execute('SELECT * FROM penebusan'),
      client.execute('SELECT * FROM do_expenses'),
      client.execute('SELECT * FROM penyaluran'),
      client.execute('SELECT * FROM payments'),
      client.execute('SELECT * FROM deposits'),
      client.execute('SELECT * FROM kas_angkutan'),
      client.execute('SELECT * FROM kas_umum'),
      client.execute('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500')
    ]);

    const settings = {};
    for (const row of setRes.rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    const payload = {
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
      activityLogs: logRes.rows,
      pulledAt: new Date().toISOString()
    };

    return new Response(JSON.stringify({ success: true, data: payload }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// POST: Push and sync all data to Turso
export async function onRequestPost({ request, env }) {
  try {
    const client = getTursoClient(env);
    await initTables(client);

    const body = await request.json();
    const data = body.data || body;

    const tx = await client.transaction('write');

    try {
      // Upsert Settings
      if (data.settings && typeof data.settings === 'object') {
        for (const [key, val] of Object.entries(data.settings)) {
          await tx.execute({
            sql: `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
            args: [key, JSON.stringify(val)]
          });
        }
      }

      // Helper for bulk upsert
      const upsertBatch = async (tableName, items, columns) => {
        if (!Array.isArray(items) || items.length === 0) return;
        const placeholders = columns.map(() => '?').join(', ');
        const setClause = columns.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${setClause}`;

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
          try {
            await tx.execute({ sql, args });
          } catch (itemErr) {
            console.warn(`Upsert item error in ${tableName}:`, itemErr.message);
          }
        }
      };

      await upsertBatch('users', data.usersList, ['id', 'username', 'password', 'name', 'role', 'branch']);
      await upsertBatch('fertilizers', data.fertilizers, ['id', 'name', 'priceBuy', 'priceSell', 'stock', 'supplier', 'branch']);
      await upsertBatch('suppliers', data.suppliers, ['id', 'name', 'phone', 'address']);
      await upsertBatch('drivers', data.drivers, ['id', 'name', 'phone', 'truckNumber', 'branch']);
      await upsertBatch('kiosks', data.kiosks, ['id', 'code', 'name', 'owner', 'address', 'phone', 'branch']);
      await upsertBatch('penebusan', data.penebusanList, ['id', 'doNo', 'spjbNo', 'date', 'supplierId', 'supplierName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'status', 'notes', 'branch']);
      await upsertBatch('do_expenses', data.doList, ['id', 'doNo', 'penebusanId', 'date', 'fertilizerId', 'fertilizerName', 'qtyTon', 'driverName', 'vehiclePlate', 'targetWarehouse', 'status', 'notes', 'branch']);
      await upsertBatch('penyaluran', data.penyaluranList, ['id', 'penyaluranNo', 'nomorPenyaluran', 'sjNo', 'doRefId', 'doNo', 'date', 'kiosId', 'kiosName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'dpAmount', 'paymentStatus', 'driverName', 'vehiclePlate', 'deliveryStatus', 'notes', 'branch']);
      await upsertBatch('payments', data.payments, ['id', 'penyaluranId', 'doRefId', 'doNo', 'kiosName', 'date', 'amount', 'paymentMethod', 'notes', 'branch']);
      await upsertBatch('deposits', data.deposits, ['id', 'kiosId', 'kiosName', 'date', 'amount', 'notes', 'branch']);
      await upsertBatch('kas_angkutan', data.kasAngkutanList, ['id', 'branch', 'date', 'doNo', 'penyaluranNo', 'kiosName', 'driverName', 'transactionType', 'description', 'amount', 'adminFee', 'mealFee', 'palangFee', 'solarFee', 'driverWage', 'overtimeFee', 'helperFee', 'otherFee', 'notes']);
      await upsertBatch('kas_umum', data.kasUmumList, ['id', 'branch', 'date', 'type', 'category', 'description', 'amount', 'notes']);
      await upsertBatch('activity_logs', data.activityLogs, ['id', 'timestamp', 'user', 'role', 'action', 'details']);

      await tx.commit();
    } catch (txError) {
      await tx.rollback();
      throw txError;
    }

    return new Response(JSON.stringify({ success: true, message: 'Data synced successfully to Turso Database' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
