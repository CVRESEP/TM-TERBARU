/**
 * Script Pengambil Seluruh Halaman Data Firestore (Paginated Exporter ES Module)
 * 
 * Cara Penggunaan:
 * node scripts/export-firestore.js ID_PROJECT_FIREBASE
 */

import fs from 'fs';
import https from 'https';

const projectId = process.argv[2];

if (!projectId) {
  console.error('\n❌ ERROR: Silakan masukkan Project ID Firebase Anda!');
  console.log('Contoh: node scripts/export-firestore.js ID_PROJECT_FIREBASE\n');
  process.exit(1);
}

function parseFirestoreValue(val) {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return Number(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue !== undefined) {
    return (val.arrayValue.values || []).map(v => parseFirestoreValue(v));
  }
  if (val.mapValue !== undefined) {
    const res = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = parseFirestoreValue(v);
    }
    return res;
  }
  return null;
}

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function fetchCollectionWithCandidates(colCandidates) {
  for (const colName of colCandidates) {
    let allDocs = [];
    let pageToken = '';
    let hasMore = true;
    let attempts = 0;

    while (hasMore && attempts < 50) {
      attempts++;
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}?pageSize=300`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const json = await fetchUrl(url);
      if (json && json.documents && json.documents.length > 0) {
        const pageItems = json.documents.map(doc => {
          const item = { id: doc.name.split('/').pop() };
          for (const [k, v] of Object.entries(doc.fields || {})) {
            item[k] = parseFirestoreValue(v);
          }
          return item;
        });
        allDocs = [...allDocs, ...pageItems];
      }

      if (json && json.nextPageToken) {
        pageToken = json.nextPageToken;
      } else {
        hasMore = false;
      }
    }

    if (allDocs.length > 0) {
      return { colName, docs: allDocs };
    }
  }

  return { colName: colCandidates[0], docs: [] };
}

async function main() {
  console.log(`\n⏳ Mengambil seluruh halaman data dari Firebase Firestore Project: "${projectId}"...`);

  const targets = [
    { key: 'penebusanList', candidates: ['penebusanList', 'penebusan', 'penebusan_pupuk', 'penebusanData', 'tebus'] },
    { key: 'doList', candidates: ['doList', 'do_expenses', 'pengeluaran_do', 'doExpenses', 'doData', 'do', 'pengeluaranDo'] },
    { key: 'penyaluranList', candidates: ['penyaluranList', 'penyaluran_kios', 'penyaluran', 'penyaluranKios', 'sales', 'salur'] },
    { key: 'kiosks', candidates: ['kiosks', 'kios', 'daftar_kios', 'kiosList', 'master_kios'] },
    { key: 'suppliers', candidates: ['suppliers', 'supplier', 'distributor', 'master_supplier'] },
    { key: 'drivers', candidates: ['drivers', 'driver', 'supir', 'master_driver'] },
    { key: 'fertilizers', candidates: ['fertilizers', 'pupuk', 'produk', 'products', 'master_pupuk'] },
    { key: 'payments', candidates: ['payments', 'pembayaran', 'pembayaran_kios', 'pembayaranKios', 'bayar'] },
    { key: 'deposits', candidates: ['deposits', 'deposit', 'tabungan'] },
    { key: 'kasAngkutanList', candidates: ['kas_angkutan', 'kasAngkutan', 'kasAngkutanList', 'beban_angkutan', 'kas_sopir', 'pengeluaran_angkutan'] },
    { key: 'kasUmumList', candidates: ['kas_umum', 'kasUmum', 'kasUmumList', 'kas_kantor', 'pengeluaran_kas', 'operasional', 'pengeluaran_umum'] },
    { key: 'usersList', candidates: ['usersList', 'users', 'users_app', 'accounts', 'pengguna'] }
  ];

  const resultData = {};
  let grandTotal = 0;

  for (const t of targets) {
    process.stdout.write(`Fetching collection target "${t.key}"... `);
    const { colName, docs } = await fetchCollectionWithCandidates(t.candidates);
    resultData[t.key] = docs;
    grandTotal += docs.length;
    console.log(`✅ (${docs.length} item dari collection '${colName}')`);
  }

  const fileName = `Backup_Firestore_${projectId}_${new Date().toISOString().slice(0,10)}.json`;
  fs.writeFileSync(fileName, JSON.stringify(resultData, null, 2));

  console.log(`\n🎉 BERHASIL! Ditemukan Total ${grandTotal} Data.`);
  console.log(`📁 File backup berhasil disimpan sebagai: ${fileName}`);
  console.log(`👉 File "${fileName}" siap diimpor ke sistem baru.\n`);
}

main();
