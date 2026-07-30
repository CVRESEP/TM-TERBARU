import React from 'react';

export default function ModalNotification({
  isOpen,
  type = 'alert', // 'alert' or 'confirm'
  variant = 'warning', // 'warning', 'danger', 'info', 'success'
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  onClose
}) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          headerBg: '#fef2f2',
          borderColor: '#fca5a5',
          titleColor: '#991b1b',
          btnBg: '#dc2626'
        };
      case 'warning':
        return {
          headerBg: '#fffbe8',
          borderColor: '#fde68a',
          titleColor: '#b45309',
          btnBg: '#d97706'
        };
      case 'success':
        return {
          headerBg: '#f0fdf4',
          borderColor: '#bbf7d0',
          titleColor: '#15803d',
          btnBg: '#15803d'
        };
      case 'info':
      default:
        return {
          headerBg: '#eff6ff',
          borderColor: '#bfdbfe',
          titleColor: '#1d4ed8',
          btnBg: '#2563eb'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '480px',
          width: '90%',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${styles.borderColor}`
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            backgroundColor: styles.headerBg,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: `1px solid ${styles.borderColor}`
          }}
        >
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: styles.titleColor }}>
              {title || (type === 'confirm' ? 'Konfirmasi Tindakan' : 'Pemberitahuan Sistem')}
            </h3>
          </div>
          <button
            onClick={onClose || onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#64748b',
              fontWeight: 700
            }}
          >
            Tutup
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
          {message}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: "1px solid #e2e8f0"
          }}
        >
          {type === 'confirm' ? (
            <>
              <button
                className="btn-secondary"
                onClick={onCancel}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
              >
                {cancelText}
              </button>
              <button
                className="btn-primary"
                onClick={onConfirm}
                style={{
                  backgroundColor: styles.btnBg,
                  borderColor: styles.btnBg,
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={onClose || onCancel}
              style={{
                backgroundColor: styles.btnBg,
                borderColor: styles.btnBg,
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              Mengerti & Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
