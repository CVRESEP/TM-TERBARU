/**
 * Script untuk re-sync Kas Angkutan dari Excel backup ke Turso
 * Jalankan: node scripts/resync_kas_angkutan.mjs
 */
import { createClient } from '@libsql/client/web';
import xlsx from 'xlsx';

const TURSO_URL   = 'https://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const wb  = xlsx.readFile('Backup_Firestore_tani-makmur-zf400_2026-07-31.xlsx');
const raw = xlsx.utils.sheet_to_json(wb.Sheets['Kas Angkutan']);

function parseDateStr(val) {
  if (!val) return '';
  const s = String(val).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return s;
}

// Build kas_angkutan rows from Excel
const kasAngkutanRows = raw
  .filter(item => item.id)
  .map(item => {
    const id           = String(item.id);
    const kabupaten    = String(item.kabupaten || 'MAGETAN').toUpperCase();
    const branch       = kabupaten === 'SRAGEN' ? 'Sragen' : 'Magetan';
    const date         = parseDateStr(item.tanggal);
    const doNo         = String(item.noDo || '');
    const penyaluranNo = String(item.nomorPenyaluran || '');
    const kiosName     = String(item.namaKios || '');
    const driverName   = String(item.namaSopir || '');
    const tipe         = String(item.tipePengeluaran || 'PENGELUARAN');
    const description  = String(item.uraian || '');
    const nominal      = Number(item.nominal || 0);

    // Fee breakdown
    const adminFee    = Number(item.admin || 0);
    const mealFee     = Number(item.uangMakan || 0);
    const palangFee   = Number(item.palang || 0);
    const solarFee    = Number(item.solar || 0);
    const driverWage  = Number(item.upahSopir || 0);
    const overtimeFee = Number(item.lembur || 0);
    const helperFee   = Number(item.helper || 0);
    const otherFee    = Number(item.lainLain || 0);

    // amount = nominal if set, else sum of fee breakdown
    const calcTotal = adminFee + mealFee + palangFee + solarFee + driverWage + overtimeFee + helperFee + otherFee;
    const amount = nominal > 0 ? nominal : (calcTotal > 0 ? calcTotal : 0);

    return {
      id, branch, date, doNo, penyaluranNo, kiosName, driverName,
      transactionType: tipe,
      description,
      amount,
      adminFee, mealFee, palangFee, solarFee,
      driverWage, overtimeFee, helperFee, otherFee,
      notes: description
    };
  });

const COLS = [
  'id', 'branch', 'date', 'doNo', 'penyaluranNo', 'kiosName', 'driverName',
  'transactionType', 'description', 'amount',
  'adminFee', 'mealFee', 'palangFee', 'solarFee',
  'driverWage', 'overtimeFee', 'helperFee', 'otherFee', 'notes'
];

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
  console.log('  Re-sync Kas Angkutan → Turso');
  console.log('================================================\n');

  const sragenCount  = kasAngkutanRows.filter(r => r.branch === 'Sragen').length;
  const mageCount    = kasAngkutanRows.filter(r => r.branch === 'Magetan').length;
  console.log(`  Total  : ${kasAngkutanRows.length} baris`);
  console.log(`  Sragen : ${sragenCount} baris`);
  console.log(`  Magetan: ${mageCount} baris\n`);

  console.log('⏳ Upserting kas_angkutan...');
  await upsertBatch('kas_angkutan', kasAngkutanRows, COLS);
  await deleteOrphans('kas_angkutan', kasAngkutanRows.map(r => r.id));

  // Verify
  const check = await client.execute("SELECT branch, COUNT(*) as cnt FROM kas_angkutan GROUP BY branch");
  console.log('\n📊 Turso setelah sync:');
  check.rows.forEach(r => console.log(`   ${r.branch}: ${r.cnt} baris`));

  console.log('\n🎉 Selesai! Refresh browser.\n');
}

main().catch(e => { console.error('\n❌ Fatal error:', e.message); process.exit(1); });
