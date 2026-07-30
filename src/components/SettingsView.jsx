import React, { useState } from 'react';
import { DEFAULT_SETTINGS, DEFAULT_USERS } from '../data/initialData';
import ModalNotification from './ModalNotification';
import ModalUser from './ModalUser';
import { syncDataToTurso, fetchDataFromTurso } from '../services/tursoService';

const SECTIONS = ['profil', 'menu', 'header1', 'header2', 'header3', 'akun', 'backup', 'turso'];

const sectionLabels = {
  profil:  '1. Profil Usaha & Cabang',
  menu:    '2. Judul Menu Navigasi',
  header1: '3. Header Tabel: Penebusan',
  header2: '4. Header Tabel: Pengeluaran DO',
  header3: '5. Header Tabel: Penyaluran Kios',
  akun:    '6. Pengelolaan Akun Pengguna',
  backup:  '7. Backup & Mutasi Data',
  turso:   '8. Turso DB & Cloudflare Cloud',
};

// Reusable field row
function FieldRow({ label, settingKey, formData, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}:</label>
      <input
        type="text"
        className="form-input"
        value={formData[settingKey] || ''}
        onChange={(e) => onChange(settingKey, e.target.value)}
        required
      />
    </div>
  );
}

export default function SettingsView({ 
  settings, 
  onSaveSettings, 
  usersList = DEFAULT_USERS, 
  onSaveUsers, 
  currentUser,
  allAppData = {},
  onImportData,
}) {
  const [activeSection, setActiveSection] = useState('profil');
  const [formData, setFormData] = useState({ ...DEFAULT_SETTINGS, ...settings });
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const DEFAULT_TURSO_URL = 'libsql://tm-baru-cvresep.aws-ap-northeast-1.turso.io';
  const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU0MzY5NzcsImlkIjoiMDE5ZmI0NGYtN2QwMS03MzhiLTk4MWMtMmZkNjYwMjg4NTU4Iiwia2lkIjoiZ1BNTHB5ZDZHREZraVd2T2dhbTNWMC1ISTVjM21UbW15VUVxMkFqb2tZcyIsInJpZCI6Ijg5MjkyM2I1LWM5ODQtNGQxMi05MDBmLThhODUzZjY3MjlmZiJ9.PAr56n8intzw0UkAtsWX38G_iRkb_zRxQ3NtGnbBMjsIaK0xcLQJyVG9nw7nRyPcw5NapcTERjWbK_oTucJBCQ';

  // Turso Database states
  const [tursoDbUrl, setTursoDbUrl] = useState(() => localStorage.getItem('TURSO_DATABASE_URL') || DEFAULT_TURSO_URL);
  const [tursoDbToken, setTursoDbToken] = useState(() => localStorage.getItem('TURSO_AUTH_TOKEN') || DEFAULT_TURSO_TOKEN);
  const [tursoSyncStatus, setTursoSyncStatus] = useState('');

  // User management states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const handleChange = (key, value) => {
    setSaved(false);
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const executeReset = () => {
    setFormData(DEFAULT_SETTINGS);
    onSaveSettings(DEFAULT_SETTINGS);
    setShowResetConfirm(false);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (userData) => {
    let updated;
    const exists = usersList.some(u => u.id === userData.id);
    if (exists) {
      updated = usersList.map(u => u.id === userData.id ? userData : u);
    } else {
      updated = [...usersList, userData];
    }
    if (onSaveUsers) onSaveUsers(updated);
  };

  const handleDeleteUserConfirm = (user) => {
    setDeletingUser(user);
  };

  const executeDeleteUser = () => {
    if (!deletingUser) return;
    const updated = usersList.filter(u => u.id !== deletingUser.id);
    if (onSaveUsers) onSaveUsers(updated);
    setDeletingUser(null);
  };

  const ROLE_LABELS = {
    developer: { label: 'Developer', color: '#0369a1', bg: '#e0f2fe' },
    owner:   { label: 'Owner',   color: '#7c3aed', bg: '#ede9fe' },
    manajer: { label: 'Manajer', color: '#1d4ed8', bg: '#dbeafe' },
    admin:   { label: 'Admin',   color: '#15803d', bg: '#dcfce7' },
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-box">
        <div>
          <h2 className="page-title">Pengaturan Aplikasi</h2>
          <p className="page-desc">Kelola nama usaha, cabang, judul menu, header kolom tabel, dan informasi akun pengguna. Hanya dapat diakses oleh <strong>Owner</strong>.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {saved && (
            <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
              Tersimpan!
            </span>
          )}
          <button type="button" className="btn-secondary" onClick={handleReset}>Reset Default</button>
          <button type="button" className="btn-primary" onClick={handleSave}>Simpan Pengaturan</button>
        </div>
      </div>

      {/* Section Tab Nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {SECTIONS.map(sec => (
          <button
            key={sec}
            className={activeSection === sec ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveSection(sec)}
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            {sectionLabels[sec]}
          </button>
        ))}
      </div>

      {/* ─── SECTION 1: PROFIL USAHA ─── */}
      {activeSection === 'profil' && (
        <div className="card">
          <div className="card-title">Informasi Usaha & Nama Cabang</div>
          <div className="form-row">
            <FieldRow label="Nama Perusahaan / Usaha" settingKey="companyName" formData={formData} onChange={handleChange} />
            <FieldRow label="Subtitle / Deskripsi Header Atas" settingKey="appSubtitle" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Nama Cabang 1 (cth: Magetan)" settingKey="branch1Name" formData={formData} onChange={handleChange} />
            <FieldRow label="Nama Cabang 2 (cth: Sragen)" settingKey="branch2Name" formData={formData} onChange={handleChange} />
          </div>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '10px 14px', marginTop: '4px', fontSize: '12px' }}>
            <strong>Preview Header Aplikasi:</strong>
            <div style={{ marginTop: '6px', backgroundColor: '#0f3d21', color: '#fff', padding: '8px 12px', borderRadius: '3px' }}>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>{formData.companyName}</div>
              <div style={{ fontSize: '11px', color: '#bbf7d0' }}>{formData.appSubtitle}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 2: JUDUL MENU ─── */}
      {activeSection === 'menu' && (
        <div className="card">
          <div className="card-title">Judul Menu Navigasi 3 Tahap Alur</div>
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#92400e' }}>
            Perubahan nama menu akan langsung muncul di Navigasi Atas dan judul halaman.
          </div>
          <div className="form-row">
            <FieldRow label="Judul Menu Tahap 1 (Penebusan Supplier)" settingKey="stage1Name" formData={formData} onChange={handleChange} />
            <FieldRow label="Judul Menu Tahap 2 (Pengeluaran DO)" settingKey="stage2Name" formData={formData} onChange={handleChange} />
          </div>
          <FieldRow label="Judul Menu Tahap 3 (Penyaluran Kios)" settingKey="stage3Name" formData={formData} onChange={handleChange} />

          <div className="card-title" style={{ marginTop: '16px' }}>Preview Navigasi:</div>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#14532d', padding: '8px', borderRadius: '3px', overflowX: 'auto' }}>
            {['Dashboard', formData.stage1Name, formData.stage2Name, formData.stage3Name, 'Stok & Mutasi', 'Daftar Produk', 'Data Kios & Supplier', 'Laporan & Cetak', 'Pengaturan'].map(label => (
              <span key={label} style={{ color: '#dcfce7', fontSize: '12px', padding: '4px 10px', whiteSpace: 'nowrap', borderBottom: '2px solid transparent', fontWeight: 600 }}>{label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── SECTION 3: HEADER PENEBUSAN ─── */}
      {activeSection === 'header1' && (
        <div className="card">
          <div className="card-title">Header Kolom Tabel: {formData.stage1Name || 'Penebusan'}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
            Kolom <strong>Nomor DO</strong> adalah kolom tetap (tidak dapat diubah namanya) karena berfungsi sebagai kunci seluruh transaksi.
          </div>
          <div className="form-row">
            <FieldRow label="Header: Cabang" settingKey="thPenebusanBranch" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Tanggal" settingKey="thPenebusanDate" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Supplier" settingKey="thPenebusanSupplier" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Jenis Pupuk" settingKey="thPenebusanFertilizer" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Qty Penebusan (Ton)" settingKey="thPenebusanQty" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Sudah Di-DO (Ton)" settingKey="thPenebusanTaken" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Sisa Kuota (Ton)" settingKey="thPenebusanRemaining" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Total Biaya" settingKey="thPenebusanAmount" formData={formData} onChange={handleChange} />
          </div>
        </div>
      )}

      {/* ─── SECTION 4: HEADER DO ─── */}
      {activeSection === 'header2' && (
        <div className="card">
          <div className="card-title">Header Kolom Tabel: {formData.stage2Name || 'Pengeluaran DO'}</div>
          <div className="form-row">
            <FieldRow label="Header: Cabang" settingKey="thDoBranch" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Tanggal" settingKey="thDoDate" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Jenis Pupuk" settingKey="thDoFertilizer" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Qty Diambil (Ton)" settingKey="thDoQty" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Supir & Truk" settingKey="thDoDriver" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Gudang Tujuan" settingKey="thDoWarehouse" formData={formData} onChange={handleChange} />
          </div>
        </div>
      )}

      {/* ─── SECTION 5: HEADER PENYALURAN ─── */}
      {activeSection === 'header3' && (
        <div className="card">
          <div className="card-title">Header Kolom Tabel: {formData.stage3Name || 'Penyaluran Kios'}</div>
          <div className="form-row">
            <FieldRow label="Header: Cabang" settingKey="thSalurBranch" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Tanggal" settingKey="thSalurDate" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Kios Tujuan" settingKey="thSalurKios" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Jenis Pupuk" settingKey="thSalurFertilizer" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Qty Tersalur (Ton)" settingKey="thSalurQty" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Harga / Ton" settingKey="thSalurPrice" formData={formData} onChange={handleChange} />
          </div>
          <div className="form-row">
            <FieldRow label="Header: Total Tagihan" settingKey="thSalurAmount" formData={formData} onChange={handleChange} />
            <FieldRow label="Header: Status Pembayaran" settingKey="thSalurPayment" formData={formData} onChange={handleChange} />
          </div>
        </div>
      )}

      {/* ─── SECTION 6: PENGELOLAAN AKUN ─── */}
      {activeSection === 'akun' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div className="card-title" style={{ margin: 0 }}>Pengelolaan Akun Pengguna & Hak Akses</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                Tambah, ubah, atau hapus akun pengguna sistem aplikasi.
              </div>
            </div>
            <button className="btn-primary" onClick={handleOpenAddUser}>
              + Tambah Akun Pengguna Baru
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Pengguna</th>
                <th>Username</th>
                <th>Password</th>
                <th>Role</th>
                <th>Akses Cabang</th>
                <th>Hak Akses</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(user => {
                const r = ROLE_LABELS[user.role] || { label: user.role, color: '#374151', bg: '#f3f4f6' };
                const isSelf = currentUser && currentUser.username === user.username;
                return (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 700 }}>
                      {user.name} {isSelf && <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>(Anda)</span>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.username}</td>
                    <td style={{ fontFamily: 'monospace', color: '#6b7280' }}>{user.password}</td>
                    <td>
                      <span style={{ backgroundColor: r.bg, color: r.color, padding: '2px 8px', borderRadius: '3px', fontWeight: 700, fontSize: '12px' }}>
                        {r.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.branch === 'ALL' ? 'badge-info' : user.branch === 'Magetan' ? 'badge-branch-magetan' : 'badge-branch-sragen'}`}>
                        {user.branch === 'ALL' ? 'Semua Cabang' : user.branch}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#4b5563' }}>
                      {user.role === 'developer' && 'Akses penuh sistem pengembang + Pengaturan'}
                      {user.role === 'owner' && 'Akses penuh + Pengaturan'}
                      {user.role === 'manajer' && 'Akses semua, tanpa Pengaturan'}
                      {user.role === 'admin' && `Hanya data Cabang ${user.branch} (terkunci)`}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '2px 6px' }}
                          onClick={() => handleOpenEditUser(user)}
                        >
                          Edit
                        </button>
                        {!isSelf && (
                          <button
                            className="btn-danger"
                            style={{ fontSize: '11px', padding: '2px 6px' }}
                            onClick={() => handleDeleteUserConfirm(user)}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '16px' }}>
            <div className="card-title">Keterangan Role:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '8px' }}>
              {[
                { role: 'developer', desc: 'Hak akses tingkat pengembang sistem (Developer Mode), akses penuh ke seluruh cabang dan sistem.' },
                { role: 'owner', desc: 'Akses penuh ke semua cabang dan semua fitur termasuk halaman Pengaturan ini.' },
                { role: 'manajer', desc: 'Dapat melihat dan mengelola data semua cabang, namun tidak dapat mengubah Pengaturan aplikasi.' },
                { role: 'admin', desc: 'Branch switcher terkunci — hanya dapat mengakses dan menginput data sesuai cabang yang ditugaskan.' },
              ].map(({ role, desc }) => {
                const r = ROLE_LABELS[role];
                return (
                  <div key={role} style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '10px', backgroundColor: r.bg }}>
                    <div style={{ fontWeight: 700, color: r.color, marginBottom: '4px' }}>{r.label}</div>
                    <div style={{ fontSize: '12px', color: '#374151' }}>{desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 7: BACKUP & MUTASI DATA ─── */}
      {activeSection === 'backup' && (
        <div className="card">
          <div className="card-title">Backup, Restore & Mutasi Data Aplikasi</div>
          <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px' }}>
            Gunakan fitur ini untuk membuat salinan cadangan (backup) seluruh data sistem, atau melakukan <strong>Mutasi Data</strong> dari web lama/database sebelumnya ke aplikasi baru ini.
          </p>

          {importStatus && (
            <div style={{ padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, backgroundColor: importStatus.includes('berhasil') ? '#dcfce7' : '#fef2f2', color: importStatus.includes('berhasil') ? '#15803d' : '#991b1b', border: importStatus.includes('berhasil') ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
              {importStatus}
            </div>
          )}

          <div className="grid-2" style={{ gap: '16px' }}>
            {/* EXPORT DATA */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px', backgroundColor: '#f9fafb' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#111827' }}>1. Export Data Database (Backup)</h4>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 14px 0' }}>
                Unduh seluruh data master, transaksi Penebusan, Pengeluaran DO, Penyaluran Kios, Pembayaran, serta Pengaturan ke dalam file format JSON.
              </p>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => {
                  const fullBackup = {
                    settings,
                    usersList,
                    fertilizers: allAppData.fertilizers || [],
                    suppliers: allAppData.suppliers || [],
                    drivers: allAppData.drivers || [],
                    kiosks: allAppData.kiosks || [],
                    penebusanList: allAppData.penebusanList || [],
                    doList: allAppData.doList || [],
                    penyaluranList: allAppData.penyaluranList || [],
                    payments: allAppData.payments || [],
                    deposits: allAppData.deposits || [],
                    kasAngkutanList: allAppData.kasAngkutanList || [],
                    kasUmumList: allAppData.kasUmumList || [],
                    exportedAt: new Date().toISOString()
                  };
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `Backup_TaniMakmurBaru_${new Date().toISOString().slice(0, 10)}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
              >
                Unduh Backup Database (.JSON)
              </button>
            </div>

            {/* IMPORT / MUTASI DATA */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '16px', backgroundColor: '#f9fafb' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#111827' }}>2. Import / Mutasi Data (.JSON)</h4>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 14px 0' }}>
                Pilih file JSON hasil backup dari web/aplikasi sebelumnya untuk mengimpor seluruh data secara otomatis ke sistem baru.
              </p>
              <input 
                type="file" 
                accept=".json" 
                className="form-input" 
                style={{ marginBottom: '10px' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const parsed = JSON.parse(event.target.result);
                      if (onImportData) {
                        const success = onImportData(parsed);
                        if (success) {
                          setImportStatus('Mutasi & Impor data berhasil! Seluruh data transaksi telah diperbarui.');
                        } else {
                          setImportStatus('Gagal mengimpor data. Format file JSON tidak valid.');
                        }
                      }
                    } catch (err) {
                      setImportStatus('Gagal membaca file JSON. Pastikan format file benar.');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </div>
          </div>

          {/* TARIK DATA LANGSUNG DARI FIREBASE FIRESTORE */}
          <div style={{ border: '1px solid #bae6fd', borderRadius: '6px', padding: '16px', backgroundColor: '#f0f9ff', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#0369a1' }}>
              3. Tarik Data Langsung dari Firebase Firestore
            </h4>
            <p style={{ fontSize: '12px', color: '#0284c7', margin: '0 0 12px 0' }}>
              Jika database web lama Anda menggunakan Firebase Firestore, masukkan <strong>Firebase Project ID</strong> Anda di bawah ini untuk menarik data koleksi secara otomatis melalui REST API.
            </p>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                id="firestoreProjectIdInput"
                className="form-input"
                placeholder="Contoh: tani-makmur-baru-12345"
                style={{ maxWidth: '320px' }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  const input = document.getElementById('firestoreProjectIdInput');
                  const projId = input ? input.value.trim() : '';
                  if (!projId) {
                    alert('Mohon masukkan Firebase Project ID Anda terlebih dahulu.');
                    return;
                  }

                  setImportStatus(`Sedang memproses seluruh halaman data dari Firestore "${projId}"...`);

                  function parseFirestoreValue(val) {
                    if (!val) return null;
                    if (val.stringValue !== undefined) return val.stringValue;
                    if (val.integerValue !== undefined) return Number(val.integerValue);
                    if (val.doubleValue !== undefined) return Number(val.doubleValue);
                    if (val.booleanValue !== undefined) return val.booleanValue;
                    if (val.timestampValue !== undefined) return val.timestampValue;
                    if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(v => parseFirestoreValue(v));
                    if (val.mapValue !== undefined) {
                      const res = {};
                      for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
                        res[k] = parseFirestoreValue(v);
                      }
                      return res;
                    }
                    return null;
                  }

                  let quotaExceededError = false;
                  let authError = false;

                  async function fetchWithTimeout(url, timeoutMs = 6000) {
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), timeoutMs);
                    try {
                      const res = await fetch(url, { signal: controller.signal });
                      clearTimeout(timer);
                      if (res.status === 429) quotaExceededError = true;
                      if (res.status === 403 || res.status === 401) authError = true;
                      return res;
                    } catch {
                      clearTimeout(timer);
                      return null;
                    }
                  }

                  async function fetchSingleCollection(colName) {
                    let allDocs = [];
                    let pageToken = '';
                    let hasMore = true;
                    let attempts = 0;

                    while (hasMore && attempts < 15) {
                      attempts++;
                      let url = `https://firestore.googleapis.com/v1/projects/${projId}/databases/(default)/documents/${colName}?pageSize=300`;
                      if (pageToken) url += `&pageToken=${pageToken}`;
                      
                      const res = await fetchWithTimeout(url, 6000);
                      if (!res || !res.ok) break;
                      
                      try {
                        const json = await res.json();
                        if (json.documents && json.documents.length > 0) {
                          const pageItems = json.documents.map(doc => {
                            const item = { id: doc.name.split('/').pop() };
                            for (const [k, v] of Object.entries(doc.fields || {})) {
                              item[k] = parseFirestoreValue(v);
                            }
                            return item;
                          });
                          allDocs = [...allDocs, ...pageItems];
                        }

                        if (json.nextPageToken) {
                          pageToken = json.nextPageToken;
                        } else {
                          hasMore = false;
                        }
                      } catch {
                        break;
                      }
                    }
                    return allDocs;
                  }

                  async function fetchColWithCandidates(colCandidates) {
                    for (const colName of colCandidates) {
                      const docs = await fetchSingleCollection(colName);
                      if (docs && docs.length > 0) return docs;
                    }
                    return [];
                  }

                  setImportStatus(`Sedang menghubungi Firestore "${projId}" dan menarik 12 kelompok data secara paralel...`);

                  const [
                    penebusanList,
                    doList,
                    penyaluranList,
                    kiosks,
                    suppliers,
                    drivers,
                    fertilizers,
                    payments,
                    deposits,
                    kasAngkutanList,
                    kasUmumList,
                    usersList
                  ] = await Promise.all([
                    fetchColWithCandidates(['penebusan', 'penebusanList', 'penebusan_pupuk', 'penebusanData', 'tebus']),
                    fetchColWithCandidates(['pengeluaranDo', 'doList', 'do_expenses', 'pengeluaran_do', 'doExpenses', 'doData', 'do']),
                    fetchColWithCandidates(['penyaluranKios', 'penyaluranList', 'penyaluran_kios', 'penyaluran', 'sales', 'salur']),
                    fetchColWithCandidates(['kiosks', 'kios', 'daftar_kios', 'kiosList', 'master_kios']),
                    fetchColWithCandidates(['suppliers', 'supplier', 'distributor']),
                    fetchColWithCandidates(['drivers', 'driver', 'supir']),
                    fetchColWithCandidates(['products', 'fertilizers', 'pupuk', 'produk']),
                    fetchColWithCandidates(['pembayaran', 'payments', 'pembayaran_kios', 'pembayaranKios']),
                    fetchColWithCandidates(['deposits', 'deposit', 'tabungan']),
                    fetchColWithCandidates(['kas_angkutan', 'kasAngkutan', 'kasAngkutanList', 'beban_angkutan', 'kas_sopir', 'pengeluaran_angkutan']),
                    fetchColWithCandidates(['kas_umum', 'kasUmum', 'kasUmumList', 'kas_kantor', 'pengeluaran_kas', 'operasional', 'pengeluaran_umum']),
                    fetchColWithCandidates(['usersList', 'users', 'users_app', 'accounts'])
                  ]);

                  const fetchedData = {
                    penebusanList, doList, penyaluranList, kiosks, suppliers, drivers, fertilizers, payments, deposits, kasAngkutanList, kasUmumList
                  };

                  if (usersList && usersList.length > 0) {
                    fetchedData.usersList = usersList;
                  }

                  const totalItems = Object.values(fetchedData).reduce((a, b) => a + (Array.isArray(b) ? b.length : 0), 0);

                  if (totalItems > 0 && onImportData) {
                    onImportData(fetchedData);
                    setImportStatus(`Berhasil menarik TOTAL ${totalItems} data dari Firestore! (Penebusan: ${penebusanList.length}, DO: ${doList.length}, Penyaluran Kios: ${penyaluranList.length}, Kios: ${kiosks.length}, Pembayaran: ${payments.length}, Kas Angkutan: ${kasAngkutanList.length}, Kas Umum: ${kasUmumList.length}, Supplier: ${suppliers.length}, Driver: ${drivers.length}).`);
                  } else if (quotaExceededError) {
                    setImportStatus(`⚠️ Gagal Impor: Kuota gratis pembacaan Firebase Firestore untuk Project "${projId}" telah habis (Error 429: Quota Exceeded / Resource Exhausted). Silakan gunakan file Import Backup JSON atau tunggu reset kuota harian dari Firebase.`);
                  } else if (authError) {
                    setImportStatus(`⚠️ Gagal Impor: Firestore pada Project "${projId}" memerlukan otentikasi login / API Rules terkunci (Error 403 Forbidden). Silakan gunakan file Import Backup JSON.`);
                  } else {
                    setImportStatus(`Proses selesai. Tidak ada data yang ditemukan pada Project ID "${projId}".`);
                  }
                }}
              >
                Tarik & Impor Seluruh Data Firestore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 8: TURSO DATABASE & CLOUDFLARE ─── */}
      {activeSection === 'turso' && (
        <div className="card">
          <div className="card-title">Pengaturan Turso Database (SQLite Edge) & Cloudflare Pages</div>
          <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px' }}>
            Aplikasi ini mendukung penyimpanan database cloud modern menggunakan <strong>Turso Database</strong> (SQLite at the Edge) dan terintegrasi dengan <strong>Cloudflare Pages</strong> melalui GitHub repository.
          </p>

          <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              🔑 Konfigurasi Kredensial Turso Database
            </h4>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">TURSO DATABASE URL:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: libsql://db-name-org.turso.io"
                value={tursoDbUrl}
                onChange={(e) => {
                  setTursoDbUrl(e.target.value);
                  localStorage.setItem('TURSO_DATABASE_URL', e.target.value.trim());
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">TURSO AUTH TOKEN:</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan Auth Token Turso Anda"
                value={tursoDbToken}
                onChange={(e) => {
                  setTursoDbToken(e.target.value);
                  localStorage.setItem('TURSO_AUTH_TOKEN', e.target.value.trim());
                }}
              />
            </div>

            {tursoSyncStatus && (
              <div style={{ padding: '10px 14px', borderRadius: '4px', marginBottom: '14px', fontSize: '13px', fontWeight: 600, backgroundColor: tursoSyncStatus.includes('Gagal') || tursoSyncStatus.includes('❌') ? '#fef2f2' : '#dcfce7', color: tursoSyncStatus.includes('Gagal') || tursoSyncStatus.includes('❌') ? '#991b1b' : '#15803d', border: tursoSyncStatus.includes('Gagal') || tursoSyncStatus.includes('❌') ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                {tursoSyncStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  setTursoSyncStatus('Sedang mengunggah & menyinkronkan seluruh data ke Turso Database Cloud...');
                  try {
                    const fullData = {
                      settings: formData,
                      usersList,
                      fertilizers: allAppData.fertilizers || [],
                      suppliers: allAppData.suppliers || [],
                      drivers: allAppData.drivers || [],
                      kiosks: allAppData.kiosks || [],
                      penebusanList: allAppData.penebusanList || [],
                      doList: allAppData.doList || [],
                      penyaluranList: allAppData.penyaluranList || [],
                      payments: allAppData.payments || [],
                      deposits: allAppData.deposits || [],
                      kasAngkutanList: allAppData.kasAngkutanList || [],
                      kasUmumList: allAppData.kasUmumList || [],
                      activityLogs: allAppData.activityLogs || []
                    };
                    const res = await syncDataToTurso(fullData, { tursoUrl: tursoDbUrl, tursoToken: tursoDbToken });
                    setTursoSyncStatus(`✅ ${res.message || 'Sinkronisasi ke Turso Cloud Berhasil!'}`);
                  } catch (err) {
                    setTursoSyncStatus(`❌ Gagal Sync ke Turso: ${err.message}`);
                  }
                }}
              >
                🚀 Push / Upload Data Ke Turso Cloud
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  setTursoSyncStatus('Sedang menarik seluruh data dari Turso Database Cloud...');
                  try {
                    const res = await fetchDataFromTurso({ tursoUrl: tursoDbUrl, tursoToken: tursoDbToken });
                    if (res && res.data && onImportData) {
                      onImportData(res.data);
                      setTursoSyncStatus('✅ Berhasil menarik & memperbarui seluruh data dari Turso Cloud!');
                    }
                  } catch (err) {
                    setTursoSyncStatus(`❌ Gagal Tarik Data dari Turso: ${err.message}`);
                  }
                }}
              >
                📥 Pull / Tarik Data Dari Turso Cloud
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', backgroundColor: '#ffffff' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              ☁️ Panduan Hosting di Cloudflare Pages + GitHub:
            </h4>
            <ol style={{ fontSize: '13px', color: '#334155', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>Push Code ke GitHub:</strong> Upload repository project ini ke GitHub Anda.</li>
              <li><strong>Hubungkan Cloudflare Pages:</strong> Buka dashboard Cloudflare $\rightarrow$ Workers & Pages $\rightarrow$ Create Pages $\rightarrow$ Connect to GitHub.</li>
              <li><strong>Pengaturan Build Cloudflare:</strong>
                <ul>
                  <li>Build Command: <code>npm run build</code></li>
                  <li>Build Output Directory: <code>dist</code></li>
                </ul>
              </li>
              <li><strong>Environment Variables di Cloudflare:</strong> Masukkan variable berikut di Settings Cloudflare Pages:
                <ul>
                  <li><code>TURSO_DATABASE_URL</code> = URL Database Turso Anda</li>
                  <li><code>TURSO_AUTH_TOKEN</code> = Auth Token Turso Anda</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Bottom save bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', margin: '16px 0' }}>
        {saved && <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700, alignSelf: 'center' }}>Pengaturan berhasil disimpan!</span>}
        <button type="button" className="btn-secondary" onClick={handleReset}>Reset Default</button>
        <button type="button" className="btn-primary" onClick={handleSave}>Simpan Pengaturan</button>
      </div>

      <ModalUser
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        editUser={editingUser}
        existingUsers={usersList}
      />

      <ModalNotification
        isOpen={showResetConfirm}
        type="confirm"
        variant="warning"
        title="Reset Pengaturan"
        message="Apakah Anda yakin ingin mengembalikan seluruh pengaturan ke nilai default awal?"
        confirmText="Ya, Reset Default"
        cancelText="Batal"
        onConfirm={executeReset}
        onCancel={() => setShowResetConfirm(false)}
        onClose={() => setShowResetConfirm(false)}
      />

      <ModalNotification
        isOpen={Boolean(deletingUser)}
        type="confirm"
        variant="danger"
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${deletingUser?.name}" (@${deletingUser?.username})?`}
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        onConfirm={executeDeleteUser}
        onCancel={() => setDeletingUser(null)}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
