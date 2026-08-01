/**
 * Script untuk re-sync data Penyaluran Kios & Penebusan dari Excel backup ke Turso
 * Jalankan: node scripts/resync_penyaluran.mjs
 */
import { createClient } from '@libsql/client/web';
import xlsx from 'xlsx';

const TURSO_URL   = 'https://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const wb        = xlsx.readFile('Backup_Firestore_tani-makmur-zf400_2026-07-31.xlsx');
const rawPen    = xlsx.utils.sheet_to_json(wb.Sheets['Penebusan']);
const rawSalur  = xlsx.utils.sheet_to_json(wb.Sheets['Penyaluran Kios']);

// ─── Build penebusan records ──────────────────────────────────────────────────
const penebusanRows = rawPen
  .filter(item => item.id)
  .map(item => {
    const id        = String(item.id);
    const noDo      = String(item.noDo || item.id);
    const qty       = Number(item.qty || 0);
    const total     = Number(item.totalPenebusan || 0);
    const harga     = qty > 0 ? Math.round(total / qty) : 0;
    const kabupaten = String(item.kabupaten || 'MAGETAN');
    const branch    = kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';
    const supplier  = String(item.supplier || 'PT PETROKIMIA GRESIK');
    const fertName  = String(item.namaProduk || '');
    const tanggal   = String(item.tanggal || '');

    return {
      id, doNo: noDo, spjbNo: noDo, date: tanggal,
      supplierId: supplier, supplierName: supplier,
      fertilizerId: fertName, fertilizerName: fertName,
      qtyTon: qty, pricePerTon: harga, totalAmount: total,
      status: 'active', notes: '', branch
    };
  });

// ─── Build penyaluran records exactly as in Excel ────────────────────────────
const penyaluranRows = rawSalur
  .filter(item => item.id)
  .map(item => {
    const id           = String(item.id);
    const doRefId      = String(item.noDo || '');
    const penyaluranNo = String(item.nomorPenyaluran || '');
    const kiosName     = String(item.namaKios || '');
    const fertName     = String(item.namaProduk || '');
    const qty          = Number(item.qty || 0);
    const total        = Number(item.total || 0);
    const harga        = qty > 0 ? Math.round(total / qty) : 0;
    const kurangBayar  = Number(item.kurangBayar !== undefined ? item.kurangBayar : (item.totalPembayaranTempo || 0));
    const diBayar      = Number(item.diBayar || 0);
    const keterangan   = String(item.keterangan || '');
    const lunas        = keterangan.toUpperCase().includes('LUNAS') && !keterangan.toUpperCase().includes('BELUM');
    const payStatus    = lunas ? 'Lunas' : 'Tempo';
    const tanggal      = String(item.tanggal || '');
    const kabupaten    = String(item.kabupaten || 'MAGETAN');
    const branch       = kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';
    const driverName   = String(item.namaSopir || '');

    return {
      id,
      penyaluranNo,           // → col penyaluranNo
      nomorPenyaluran: penyaluranNo, // → col nomorPenyaluran
      sjNo: penyaluranNo,     // → col sjNo
      doRefId,                // → col doRefId
      doNo: doRefId,          // → col doNo
      date: tanggal,          // → col date
      kiosId: kiosName,       // → col kiosId
      kiosName,               // → col kiosName
      fertilizerId: fertName, // → col fertilizerId
      fertilizerName: fertName, // → col fertilizerName
      qtyTon: qty,            // → col qtyTon
      pricePerTon: harga,     // → col pricePerTon
      totalAmount: total,     // → col totalAmount
      dpAmount: diBayar,      // → col dpAmount
      paymentStatus: payStatus, // → col paymentStatus
      driverName,             // → col driverName
      vehiclePlate: '',       // → col vehiclePlate
      deliveryStatus: 'delivered', // → col deliveryStatus
      notes: keterangan,      // → col notes
      branch                  // → col branch
    };
  });

// ─── Generic upsert ──────────────────────────────────────────────────────────
async function upsertBatch(tableName, rows, cols) {
  if (!rows || rows.length === 0) return;
  const ph  = cols.map(() => '?').join(', ');
  const upd = cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
  const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${ph}) ON CONFLICT(id) DO UPDATE SET ${upd}`;

  const stmts = rows.map(r => ({
    sql,
    args: cols.map(c => {
      const v = r[c];
      return (v === undefined || v === null) ? null : v;
    })
  }));

  let done = 0;
  for (let i = 0; i < stmts.length; i += 40) {
    const chunk = stmts.slice(i, i + 40);
    try {
      await client.batch(chunk, 'write');
    } catch {
      for (const s of chunk) await client.execute(s).catch(() => {});
    }
    done += chunk.length;
    process.stdout.write(`\r  [${tableName}] ${done}/${stmts.length} rows...`);
  }
  console.log(`\n  ✅ [${tableName}] ${done} rows upserted.`);
}

// ─── Delete orphans ───────────────────────────────────────────────────────────
async function deleteOrphans(tableName, activeIds) {
  try {
    const res    = await client.execute(`SELECT id FROM ${tableName}`);
    const dbIds  = res.rows.map(r => String(r.id || ''));
    const active = new Set(activeIds.map(String));
    const del    = dbIds.filter(id => id && !active.has(id));

    if (del.length === 0) { console.log(`  🟢 [${tableName}] no orphans.`); return; }
    for (let i = 0; i < del.length; i += 50) {
      const chunk = del.slice(i, i + 50);
      await client.execute({ sql: `DELETE FROM ${tableName} WHERE id IN (${chunk.map(() => '?').join(',')})`, args: chunk });
    }
    console.log(`  🗑️  [${tableName}] deleted ${del.length} orphan rows.`);
  } catch (e) {
    console.log(`  ⚠️  deleteOrphans(${tableName}): ${e.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('================================================');
  console.log('  Re-sync dari Excel Backup → Turso');
  console.log('================================================\n');
  console.log(`  Penebusan   : ${penebusanRows.length} baris`);
  console.log(`  Penyaluran  : ${penyaluranRows.length} baris\n`);

  console.log('⏳ Syncing penebusan...');
  await upsertBatch('penebusan', penebusanRows,
    ['id','doNo','spjbNo','date','supplierId','supplierName','fertilizerId','fertilizerName',
     'qtyTon','pricePerTon','totalAmount','status','notes','branch']);
  await deleteOrphans('penebusan', penebusanRows.map(r => r.id));

  console.log('\n⏳ Syncing penyaluran...');
  await upsertBatch('penyaluran', penyaluranRows,
    ['id','penyaluranNo','nomorPenyaluran','sjNo','doRefId','doNo','date','kiosId','kiosName',
     'fertilizerId','fertilizerName','qtyTon','pricePerTon','totalAmount','dpAmount',
     'paymentStatus','driverName','vehiclePlate','deliveryStatus','notes','branch']);
  await deleteOrphans('penyaluran', penyaluranRows.map(r => r.id));

  console.log('\n🎉 Selesai! Refresh browser untuk melihat data yang sudah diperbaiki.\n');
}

main().catch(e => { console.error('\n❌ Fatal error:', e.message); process.exit(1); });
