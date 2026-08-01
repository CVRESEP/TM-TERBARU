/**
 * Re-sync Pembayaran Kios & Deposits dari Excel backup ke Turso
 * Jalankan: node scripts/resync_payments.mjs
 */
import { createClient } from '@libsql/client/web';
import xlsx from 'xlsx';
import { readFileSync } from 'fs';

const TURSO_URL   = 'https://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const wb = xlsx.readFile('Backup_Firestore_tani-makmur-zf400_2026-07-31.xlsx');
const rawPay = xlsx.utils.sheet_to_json(wb.Sheets['Pembayaran Kios']);

// ─── Build payments rows ──────────────────────────────────────────────────────
// Excel columns: id, totalBayar, tanggal, noDo, namaKios, kabupaten, nomorPenyaluran
const paymentRows = rawPay
  .filter(item => item.id)
  .map(item => {
    const id             = String(item.id);
    const penyaluranId   = String(item.nomorPenyaluran || '');  // → penyaluranId
    const doRefId        = String(item.noDo || '');
    const kiosName       = String(item.namaKios || '');
    const date           = String(item.tanggal || '');
    const amount         = Number(item.totalBayar || 0);
    const kabupaten      = String(item.kabupaten || 'MAGETAN').toUpperCase();
    const branch         = kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';

    return {
      id,
      penyaluranId,
      doRefId,
      doNo: doRefId,
      kiosName,
      date,
      amount,
      paymentMethod: 'Transfer Bank',
      notes: '',
      branch
    };
  });

// ─── Generic upsert ───────────────────────────────────────────────────────────
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
      for (const s of chunk) await client.execute(s).catch(e => console.log('  row err:', e.message));
    }
    done += chunk.length;
    process.stdout.write(`\r  [${tableName}] ${done}/${stmts.length} rows...`);
  }
  console.log(`\n  ✅ [${tableName}] ${done} rows upserted.`);
}

async function deleteOrphans(tableName, activeIds) {
  try {
    const res   = await client.execute(`SELECT id FROM ${tableName}`);
    const dbIds = res.rows.map(r => String(r.id || ''));
    const active = new Set(activeIds.map(String));
    const del   = dbIds.filter(id => id && !active.has(id));

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

async function main() {
  console.log('================================================');
  console.log('  Re-sync Pembayaran Kios → Turso');
  console.log('================================================\n');

  const sragenPay  = paymentRows.filter(r => r.branch === 'Sragen').length;
  const magetuPay  = paymentRows.filter(r => r.branch === 'Magetan').length;
  console.log(`  Pembayaran Total  : ${paymentRows.length} baris`);
  console.log(`  Sragen : ${sragenPay} | Magetan : ${magetuPay}\n`);

  console.log('⏳ Upserting payments...');
  await upsertBatch('payments', paymentRows,
    ['id', 'penyaluranId', 'doRefId', 'doNo', 'kiosName', 'date', 'amount', 'paymentMethod', 'notes', 'branch']);
  await deleteOrphans('payments', paymentRows.map(r => r.id));

  // Verify
  const check = await client.execute("SELECT branch, COUNT(*) as cnt FROM payments GROUP BY branch");
  console.log('\n📊 Turso setelah sync:');
  check.rows.forEach(r => console.log(`   ${r.branch}: ${r.cnt} baris`));

  const total = await client.execute("SELECT COUNT(*) as total FROM payments");
  console.log(`   TOTAL: ${total.rows[0].total} baris`);

  console.log('\n🎉 Selesai! Refresh browser.\n');
}

main().catch(e => { console.error('\n❌ Fatal error:', e.message); process.exit(1); });
