import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

async function convertBackupToExcel() {
  const jsonFile = 'Backup_Firestore_tani-makmur-zf400_2026-07-31.json';
  const outputFile = 'Backup_Firestore_tani-makmur-zf400_2026-07-31.xlsx';

  console.log('📖 Membaca data JSON:', jsonFile);
  const rawData = JSON.parse(fs.readFileSync(path.resolve(jsonFile), 'utf8'));

  const workbook = XLSX.utils.book_new();

  // Helper function to add worksheet
  const addSheet = (sheetName, data) => {
    let rows = [];
    if (Array.isArray(data)) {
      rows = data.map(item => {
        const row = { ...item };
        for (const k in row) {
          if (typeof row[k] === 'object' && row[k] !== null) {
            row[k] = JSON.stringify(row[k]);
          }
        }
        return row;
      });
    } else if (data && typeof data === 'object') {
      rows = Object.keys(data).map(k => ({
        key: k,
        value: typeof data[k] === 'object' ? JSON.stringify(data[k]) : String(data[k])
      }));
    }

    if (rows.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      console.log(`✅ Sheet '${sheetName}' ditambahkan (${rows.length} baris)`);
    } else {
      console.log(`ℹ️ Sheet '${sheetName}' kosong.`);
    }
  };

  addSheet('Settings', rawData.settings);
  addSheet('Users', rawData.usersList);
  addSheet('Pupuk (Fertilizers)', rawData.fertilizers);
  addSheet('Suppliers', rawData.suppliers);
  addSheet('Drivers', rawData.drivers);
  addSheet('Kios', rawData.kiosks);
  addSheet('Penebusan', rawData.penebusanList);
  addSheet('Pengeluaran DO', rawData.doList);
  addSheet('Penyaluran Kios', rawData.penyaluranList);
  addSheet('Pembayaran Kios', rawData.payments);
  addSheet('Deposit Kios', rawData.deposits);
  addSheet('Kas Angkutan', rawData.kasAngkutanList);
  addSheet('Kas Umum', rawData.kasUmumList);

  console.log('💾 Menyimpan ke file Excel:', outputFile);
  XLSX.writeFile(workbook, outputFile);
  console.log('🎉 Berhasil mengonversi backup ke Excel!');
}

convertBackupToExcel().catch(err => {
  console.error('❌ Error saat konversi ke Excel:', err);
});
