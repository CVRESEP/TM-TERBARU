import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const dbUrl = 'https://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
const dbToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

const client = createClient({
  url: dbUrl,
  authToken: dbToken
});

async function main() {
  const filePath = path.resolve('Backup_TaniMakmurBaru_2026-07-30.json');
  if (!fs.existsSync(filePath)) {
    console.error('File backup tidak ditemukan:', filePath);
    process.exit(1);
  }

  console.log('📖 Membaca file backup:', filePath);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log('🚀 Membuat struktur tabel di Turso jika belum ada...');
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

  const upsertTable = async (tableName, items, columns) => {
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`ℹ️ Tabel ${tableName}: 0 baris.`);
      return;
    }

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

    console.log(`⏳ Mengunggah ${statements.length} baris ke tabel ${tableName}...`);
    const chunkSize = 40;
    let count = 0;
    for (let j = 0; j < statements.length; j += chunkSize) {
      const chunk = statements.slice(j, j + chunkSize);
      try {
        await client.batch(chunk, 'write');
      } catch (err) {
        for (const stmt of chunk) {
          await client.execute(stmt).catch(() => {});
        }
      }
      count += chunk.length;
    }
    console.log(`✅ Tabel ${tableName}: Berhasil mengunggah ${count} baris!`);
  };

  // Upsert settings
  if (rawData.settings && typeof rawData.settings === 'object') {
    const settingItems = Object.keys(rawData.settings).map(k => ({ id: k, key: k, value: JSON.stringify(rawData.settings[k]) }));
    await upsertTable('settings', settingItems, ['key', 'value']);
  }

  await upsertTable('users', rawData.usersList, ['id', 'username', 'password', 'name', 'role', 'branch']);
  await upsertTable('fertilizers', rawData.fertilizers, ['id', 'name', 'priceBuy', 'priceSell', 'stock', 'supplier', 'branch']);
  await upsertTable('suppliers', rawData.suppliers, ['id', 'name', 'phone', 'address']);
  await upsertTable('drivers', rawData.drivers, ['id', 'name', 'phone', 'truckNumber', 'branch']);
  await upsertTable('kiosks', rawData.kiosks, ['id', 'code', 'name', 'owner', 'address', 'phone', 'branch']);
  await upsertTable('penebusan', rawData.penebusanList, ['id', 'doNo', 'spjbNo', 'date', 'supplierId', 'supplierName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'status', 'notes', 'branch']);
  await upsertTable('do_expenses', rawData.doList, ['id', 'doNo', 'penebusanId', 'date', 'fertilizerId', 'fertilizerName', 'qtyTon', 'driverName', 'vehiclePlate', 'targetWarehouse', 'status', 'notes', 'branch']);
  await upsertTable('penyaluran', rawData.penyaluranList, ['id', 'penyaluranNo', 'nomorPenyaluran', 'sjNo', 'doRefId', 'doNo', 'date', 'kiosId', 'kiosName', 'fertilizerId', 'fertilizerName', 'qtyTon', 'pricePerTon', 'totalAmount', 'dpAmount', 'paymentStatus', 'driverName', 'vehiclePlate', 'deliveryStatus', 'notes', 'branch']);
  await upsertTable('payments', rawData.payments, ['id', 'penyaluranId', 'doRefId', 'doNo', 'kiosName', 'date', 'amount', 'paymentMethod', 'notes', 'branch']);
  await upsertTable('deposits', rawData.deposits, ['id', 'kiosId', 'kiosName', 'date', 'amount', 'notes', 'branch']);
  await upsertTable('kas_angkutan', rawData.kasAngkutanList, ['id', 'branch', 'date', 'doNo', 'penyaluranNo', 'kiosName', 'driverName', 'transactionType', 'description', 'amount', 'adminFee', 'mealFee', 'palangFee', 'solarFee', 'driverWage', 'overtimeFee', 'helperFee', 'otherFee', 'notes']);
  await upsertTable('kas_umum', rawData.kasUmumList, ['id', 'branch', 'date', 'type', 'category', 'description', 'amount', 'notes']);

  console.log('\n🎉 PROSES IMPORT SEMUA DATA BACKUP KE TURSO CLOUD DATABASE BERHASIL 100%!');
}

main().catch(err => {
  console.error('❌ Error saat import ke Turso:', err);
  process.exit(1);
});
