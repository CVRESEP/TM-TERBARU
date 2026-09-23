import React from 'react';

export default function SyncProgressModal({
  isOpen,
  onClose,
  title = 'Sinkronisasi Data ke Turso',
  stage = 'syncing', // 'syncing' | 'completed' | 'error'
  message = 'Sedang memperbarui status transaksi dan menyinkronkan ke Cloud Database...',
  details = null,
  autoCloseDelay = 1800
}) {
  React.useEffect(() => {
    if (isOpen && stage === 'completed' && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, stage, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
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
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        animation: 'popInModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'center'
      }}>
        {/* Header Bar */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔄</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>
              {title}
            </span>
          </div>
          {stage !== 'syncing' && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '6px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {stage === 'syncing' && (
            <div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                marginBottom: '16px',
                border: '2px solid #bfdbfe',
                animation: 'spinPulse 1.5s infinite linear'
              }}>
                ☁️
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Menyinkronkan ke Database Cloud
              </h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                {message}
              </p>
              
              {/* Progress Line */}
              <div style={{
                height: '6px',
                backgroundColor: '#e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  animation: 'syncIndeterminate 1.2s infinite ease-in-out'
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                {details?.subtext || 'Memastikan seluruh data transaksi tersinkron 100% ke Turso Cloud'}
              </div>
            </div>
          )}

          {stage === 'completed' && (
            <div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '16px',
                border: '2px solid #86efac'
              }}>
                ✓
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#15803d' }}>
                Sinkronisasi Berhasil!
              </h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#475569' }}>
                {message || 'Data pembayaran dan status penyaluran telah diperbarui di Turso Cloud.'}
              </p>

              {details && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#334155',
                  textAlign: 'left',
                  marginBottom: '16px'
                }}>
                  {typeof details === 'string' ? details : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {details.lunas !== undefined && <div>• Transaksi Lunas: <strong>{details.lunas}</strong></div>}
                      {details.tempo !== undefined && <div>• Transaksi Tempo: <strong>{details.tempo}</strong></div>}
                      {details.info && <div>• {details.info}</div>}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#15803d',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                Selesai & Tutup
              </button>
            </div>
          )}

          {stage === 'error' && (
            <div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px',
                border: '2px solid #fca5a5'
              }}>
                ✕
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#991b1b' }}>
                Sinkronisasi Terkendala
              </h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                {message || 'Gagal menyinkronkan data ke Turso Cloud, namun data lokal tetap tersimpan.'}
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                style={{ width: '100%', padding: '9px', fontWeight: 700 }}
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popInModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spinPulse {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes syncIndeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
