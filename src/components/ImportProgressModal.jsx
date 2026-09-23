import React, { useState, useEffect } from 'react';

const MODULE_TITLES = {
  penebusan: { name: 'Penebusan Pupuk', icon: '🛒', table: 'penebusan' },
  pengeluaran_do: { name: 'Pengeluaran DO', icon: '📦', table: 'do_expenses' },
  penyaluran_kios: { name: 'Penyaluran Kios', icon: '🏪', table: 'penyaluran' },
  payments: { name: 'Pembayaran Kios', icon: '💵', table: 'payments' },
  deposits: { name: 'Deposit Kios', icon: '💰', table: 'deposits' },
  kas_angkutan: { name: 'Kas Angkutan', icon: '🚛', table: 'kas_angkutan' },
  kas_umum: { name: 'Kas Umum Kantor', icon: '🏦', table: 'kas_umum' },
  fertilizers: { name: 'Daftar Produk & Harga', icon: '🌱', table: 'fertilizers' },
  kiosks: { name: 'Data Master Kios', icon: '🏬', table: 'kiosks' },
  suppliers: { name: 'Data Supplier', icon: '🏭', table: 'suppliers' },
  drivers: { name: 'Data Supir & Armada', icon: '🚚', table: 'drivers' }
};

export default function ImportProgressModal({
  isOpen,
  onClose,
  moduleName,
  fileName,
  totalRows = 0,
  stage = 'preview', // 'preview' | 'uploading' | 'completed' | 'error'
  percent = 0,
  message = '',
  batchInfo = '',
  error = null,
  summary = null,
  onConfirmUpload
}) {
  const [selectedMode, setSelectedMode] = useState('append'); // 'append' | 'replace'
  const [logEntries, setLogEntries] = useState([]);

  useEffect(() => {
    if (message && stage === 'uploading') {
      setLogEntries(prev => {
        const time = new Date().toLocaleTimeString('id-ID');
        const next = [...prev, `[${time}] ${message}`];
        return next.slice(-20); // Simpan 20 log terakhir
      });
    }
    if (stage === 'preview') {
      setLogEntries([]);
      setSelectedMode('append');
    }
  }, [message, stage]);

  if (!isOpen) return null;

  const modInfo = MODULE_TITLES[moduleName] || { name: moduleName, icon: '📥', table: moduleName };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        animation: 'slideUpModal 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Modal Header */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{modInfo.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f8fafc' }}>
                Import Data ke Database Turso
              </h3>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Modul: <strong style={{ color: '#38bdf8' }}>{modInfo.name}</strong> • Tabel: <code style={{ color: '#fde047' }}>{modInfo.table}</code>
              </div>
            </div>
          </div>
          {stage !== 'uploading' && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
              title="Tutup"
            >
              ✕
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          
          {/* ========================================================================= */}
          {/* SLIDE 1: PREVIEW & PILIHAN MODE                                          */}
          {/* ========================================================================= */}
          {stage === 'preview' && (
            <div>
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Nama File:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                    {fileName || 'data.csv'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Jumlah Data Terbaca:</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#15803d' }}>
                    {totalRows} Baris Data
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Status Validasi:</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                    ✓ Siap Diproses & Upload
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Pilih Metode Import:
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Option Append */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedMode === 'append' ? '#16a34a' : '#e2e8f0'}`,
                    backgroundColor: selectedMode === 'append' ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={selectedMode === 'append'}
                      onChange={() => setSelectedMode('append')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#166534' }}>
                        Tambahkan Data (Append) — Direkomendasikan
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                        Menambahkan {totalRows} data baru ke database Turso. Data yang sudah ada tidak akan hilang atau dihapus.
                      </div>
                    </div>
                  </label>

                  {/* Option Replace */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedMode === 'replace' ? '#dc2626' : '#e2e8f0'}`,
                    backgroundColor: selectedMode === 'replace' ? '#fef2f2' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={selectedMode === 'replace'}
                      onChange={() => setSelectedMode('replace')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#991b1b' }}>
                        Timpa & Ganti Seluruh Data (Replace)
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                        Mengosongkan isi tabel <code>{modInfo.table}</code> di Turso lalu mengisinya dengan {totalRows} baris dari file ini.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  style={{ padding: '9px 18px' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onConfirmUpload(selectedMode)}
                  style={{
                    padding: '9px 22px',
                    backgroundColor: selectedMode === 'replace' ? '#dc2626' : '#16a34a',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Mulai Upload ke Turso</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 2: PROSES UPLOAD BERLANGSUNG                                       */}
          {/* ========================================================================= */}
          {stage === 'uploading' && (
            <div>
              {/* Stepper Slide Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>✓</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>File Valid</span>
                </div>

                <div style={{ flex: 1, height: '3px', backgroundColor: percent > 20 ? '#16a34a' : '#e2e8f0', margin: '0 8px', marginBottom: '16px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: percent >= 20 ? '#16a34a' : '#3b82f6',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    {percent >= 25 ? '✓' : '⚙️'}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: percent >= 20 ? '#16a34a' : '#2563eb' }}>Normalisasi</span>
                </div>

                <div style={{ flex: 1, height: '3px', backgroundColor: percent > 40 ? '#16a34a' : '#e2e8f0', margin: '0 8px', marginBottom: '16px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: percent >= 95 ? '#16a34a' : '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    boxShadow: '0 0 12px rgba(37, 99, 235, 0.5)'
                  }}>
                    {percent >= 95 ? '✓' : '☁️'}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb' }}>Upload Turso</span>
                </div>

                <div style={{ flex: 1, height: '3px', backgroundColor: percent >= 95 ? '#16a34a' : '#e2e8f0', margin: '0 8px', marginBottom: '16px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: percent === 100 ? '#16a34a' : '#94a3b8',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px'
                  }}>
                    🔄
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Realtime</span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {message || 'Sedang memproses upload data...'}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a' }}>
                    {percent}%
                  </span>
                </div>
                
                {/* Bar Track */}
                <div style={{
                  height: '14px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percent}%`,
                    background: 'linear-gradient(90deg, #10b981 0%, #22c55e 50%, #38bdf8 100%)',
                    borderRadius: '10px',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)',
                      backgroundSize: '24px 24px',
                      animation: 'progressStripes 1s linear infinite'
                    }} />
                  </div>
                </div>

                {batchInfo && (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>
                    {batchInfo}
                  </div>
                )}
              </div>

              {/* Realtime Terminal Log */}
              <div style={{
                backgroundColor: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#38bdf8',
                maxHeight: '120px',
                overflowY: 'auto',
                lineHeight: '1.6'
              }}>
                <div style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '6px' }}>
                  $ turso-db sync --table {modInfo.table} --batch 40
                </div>
                {logEntries.map((log, idx) => (
                  <div key={idx} style={{ color: log.includes('Sukses') ? '#4ade80' : log.includes('batch') ? '#e0f2fe' : '#93c5fd' }}>
                    {log}
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
                Mohon jangan menutup halaman ini sampai proses sinkronisasi selesai...
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 3: SELESAI / SUKSES                                                 */}
          {/* ========================================================================= */}
          {stage === 'completed' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                marginBottom: '16px',
                border: '3px solid #86efac',
                animation: 'bounceSuccess 0.5s ease'
              }}>
                ✓
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Import ke Turso Berhasil!
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 20px 0' }}>
                Data telah tersimpan di cloud database Turso dan seluruh tampilan web telah ter-update otomatis.
              </p>

              {/* Summary Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Modul:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{modInfo.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Tabel Turso:</span>
                  <code style={{ fontWeight: 700, color: '#2563eb' }}>{modInfo.table}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Total Baris Terupload:</span>
                  <span style={{ fontWeight: 800, color: '#16a34a' }}>
                    {summary?.totalItems || totalRows} Baris
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Metode:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {summary?.mode === 'replace' ? 'Timpa Seluruh Data (Replace)' : 'Tambahkan Data (Append)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '11px',
                  backgroundColor: '#16a34a',
                  fontWeight: 800,
                  fontSize: '14px'
                }}
              >
                Lihat Hasil Data
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 4: ERROR / GAGAL                                                    */}
          {/* ========================================================================= */}
          {stage === 'error' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '16px',
                border: '3px solid #fca5a5'
              }}>
                ✕
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#991b1b', margin: '0 0 6px 0' }}>
                Gagal Mengunggah ke Turso
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                Terjadi kesalahan saat memproses data atau menyambungkan ke Turso Database.
              </p>

              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#b91c1c',
                fontFamily: 'monospace',
                marginBottom: '20px',
                wordBreak: 'break-word'
              }}>
                {error || 'Unknown error occurred.'}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  style={{ padding: '9px 20px' }}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes slideUpModal {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes progressStripes {
          from { background-position: 0 0; }
          to { background-position: 48px 0; }
        }
        @keyframes bounceSuccess {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
