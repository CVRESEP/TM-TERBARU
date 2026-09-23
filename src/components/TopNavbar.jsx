import React, { useState, useRef, useEffect } from 'react';

const ROLE_LABELS = {
  developer: { label: 'Developer', color: '#0369a1', bg: '#e0f2fe' },
  owner:   { label: 'Owner',   color: '#7c3aed', bg: '#ede9fe' },
  manajer: { label: 'Manajer', color: '#1d4ed8', bg: '#dbeafe' },
  admin:   { label: 'Admin',   color: '#15803d', bg: '#dcfce7' },
};

export default function TopNavbar({ 
  activeTab, 
  setActiveTab, 
  selectedBranch, 
  setSelectedBranch, 
  onOpenNewTransaction,
  counts,
  settings,
  currentUser,
  onLogout,
  tursoSyncState,
  onManualSync,
}) {

  const branch1 = settings.branch1Name || 'Magetan';
  const branch2 = settings.branch2Name || 'Sragen';

  // Admin terkunci pada cabangnya sendiri — branch switcher dinonaktifkan
  const isAdminLocked = currentUser?.role === 'admin';
  const canSeeSettings = currentUser?.role === 'owner' || currentUser?.role === 'developer';

  const handleBranchChange = (branch) => {
    if (!isAdminLocked) setSelectedBranch(branch);
  };

  const roleInfo = currentUser ? ROLE_LABELS[currentUser.role] : null;

  return (
    <header className="app-header">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="brand-area">
          <h1>{settings.companyName || 'UD TANI MAKMUR BARU'}</h1>
          <p>{settings.appSubtitle || 'Sistem Informasi Distribusi Pupuk Bersubsidi'}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Realtime Turso Cloud Indicator */}
          {tursoSyncState && (
            <button
              type="button"
              onClick={onManualSync}
              title={
                tursoSyncState?.status === 'syncing'
                  ? 'Sedang sinkronisasi data dengan Turso Cloud...'
                  : tursoSyncState?.status === 'error'
                  ? `Koneksi Turso bermasalah: ${tursoSyncState.errorMessage || 'Klik untuk coba lagi'}`
                  : `Terhubung realtime ke Turso Cloud. Terakhir sinkron: ${tursoSyncState?.lastSyncedAt ? new Date(tursoSyncState.lastSyncedAt).toLocaleTimeString('id-ID') : 'Baru saja'}. Klik untuk sinkron manual.`
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: tursoSyncState?.status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${tursoSyncState?.status === 'error' ? '#ef4444' : tursoSyncState?.status === 'syncing' ? '#eab308' : '#22c55e'}`,
                borderRadius: '20px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#ffffff',
                fontWeight: 600,
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: tursoSyncState?.status === 'error' ? '#ef4444' : tursoSyncState?.status === 'syncing' ? '#eab308' : '#22c55e',
                display: 'inline-block',
                boxShadow: tursoSyncState?.status === 'connected' ? '0 0 6px #22c55e' : 'none'
              }} />
              <span>
                {tursoSyncState?.status === 'syncing' ? 'Sinkron...' : tursoSyncState?.status === 'error' ? 'Turso Offline' : 'Turso Realtime'}
              </span>
              <span style={{ opacity: 0.8, fontSize: '11px' }}>⟳</span>
            </button>
          )}
          {/* Branch Switcher — disabled for admin */}
          <div className="branch-selector" style={{ opacity: isAdminLocked ? 0.6 : 1 }}>
            <span className="branch-label">Cabang:</span>
            <button 
              className={`branch-btn ${selectedBranch === 'ALL' ? 'active' : ''}`}
              onClick={() => handleBranchChange('ALL')}
              disabled={isAdminLocked}
              title={isAdminLocked ? 'Admin hanya bisa akses cabang sendiri' : ''}
            >
              Semua
            </button>
            <button 
              className={`branch-btn ${selectedBranch === branch1 ? 'active' : ''}`}
              onClick={() => handleBranchChange(branch1)}
              disabled={isAdminLocked && currentUser?.branch !== branch1}
            >
              {branch1}
            </button>
            <button 
              className={`branch-btn ${selectedBranch === branch2 ? 'active' : ''}`}
              onClick={() => handleBranchChange(branch2)}
              disabled={isAdminLocked && currentUser?.branch !== branch2}
            >
              {branch2}
            </button>
          </div>

          {/* New Transaction Button */}
          <button className="btn-new-trx" onClick={onOpenNewTransaction}>
            + Transaksi Baru
          </button>

          {/* User Badge & Logout */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                backgroundColor: '#1a4d2e',
                border: '1px solid #22c55e',
                borderRadius: '4px',
                padding: '4px 10px',
                textAlign: 'right',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{currentUser.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  <span style={{
                    backgroundColor: roleInfo?.bg, color: roleInfo?.color,
                    padding: '1px 5px', borderRadius: '2px',
                    fontWeight: 700, fontSize: '10px',
                  }}>
                    {roleInfo?.label}
                  </span>
                  {isAdminLocked && (
                    <span style={{ fontSize: '10px', color: '#86efac' }}>
                      ({currentUser.branch})
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOP MENU BAR */}
      <nav className="top-menu-bar">
        <button 
          className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>

        {/* ALUR DISTRIBUSI */}
        <button 
          className={`menu-item ${activeTab === 'penebusan' ? 'active' : ''}`}
          onClick={() => setActiveTab('penebusan')}
        >
          {settings.stage1Name || '1. Penebusan'} ({counts.penebusan})
        </button>

        <button 
          className={`menu-item ${activeTab === 'pengeluaran_do' ? 'active' : ''}`}
          onClick={() => setActiveTab('pengeluaran_do')}
        >
          {settings.stage2Name || '2. Pengeluaran DO'} ({counts.do})
        </button>

        <button 
          className={`menu-item ${activeTab === 'penyaluran_kios' ? 'active' : ''}`}
          onClick={() => setActiveTab('penyaluran_kios')}
        >
          {settings.stage3Name || '3. Penyaluran Kios'} ({counts.penyaluran})
        </button>

        {/* TAB MANDIRI PEMBAYARAN KIOS */}
        <button 
          className={`menu-item ${activeTab === 'pembayaran_kios' ? 'active' : ''}`}
          onClick={() => setActiveTab('pembayaran_kios')}
        >
          Pembayaran Kios
        </button>

        <button 
          className={`menu-item ${activeTab === 'kas_angkutan' ? 'active' : ''}`}
          onClick={() => setActiveTab('kas_angkutan')}
        >
          Kas Angkutan
        </button>

        <button 
          className={`menu-item ${activeTab === 'kas_umum' ? 'active' : ''}`}
          onClick={() => setActiveTab('kas_umum')}
        >
          Kas Umum
        </button>

        <button 
          className={`menu-item ${activeTab === 'stok_mutasi' ? 'active' : ''}`}
          onClick={() => setActiveTab('stok_mutasi')}
        >
          Stok & Mutasi
        </button>

        <button 
          className={`menu-item ${activeTab === 'produk' ? 'active' : ''}`}
          onClick={() => setActiveTab('produk')}
        >
          Daftar Produk ({counts.fertilizers})
        </button>

        <button 
          className={`menu-item ${activeTab === 'master_data' ? 'active' : ''}`}
          onClick={() => setActiveTab('master_data')}
        >
          Data Kios & Supplier ({counts.kios})
        </button>

        <button 
          className={`menu-item ${activeTab === 'laporan' ? 'active' : ''}`}
          onClick={() => setActiveTab('laporan')}
        >
          Laporan & Cetak
        </button>

        {/* Pengaturan — hanya owner yang bisa melihat */}
        {canSeeSettings && (
          <button 
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Pengaturan
          </button>
        )}
      </nav>
    </header>
  );
}

