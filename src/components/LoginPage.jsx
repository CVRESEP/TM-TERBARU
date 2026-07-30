import React, { useState } from 'react';
import { DEFAULT_USERS } from '../data/initialData';

const ROLE_LABELS = {
  developer: { label: 'Developer', color: '#0369a1', bg: '#e0f2fe' },
  owner:   { label: 'Owner',   color: '#7c3aed', bg: '#ede9fe' },
  manajer: { label: 'Manajer', color: '#1d4ed8', bg: '#dbeafe' },
  admin:   { label: 'Admin',   color: '#15803d', bg: '#dcfce7' },
};

export default function LoginPage({ onLogin, usersList = DEFAULT_USERS }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = usersList.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );

    if (user) {
      onLogin(user);
    } else {
      setError('Username atau password salah. Silakan coba lagi.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0f3d21',
          padding: '24px 28px',
          textAlign: 'center',
        }}>
          <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 800, margin: 0 }}>
            UD TANI MAKMUR BARU
          </h1>
          <p style={{ color: '#bbf7d0', fontSize: '12px', margin: '4px 0 0 0' }}>
            Sistem Informasi Distribusi Pupuk Bersubsidi
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: '#111827' }}>
            Masuk ke Akun Anda
          </h2>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '70px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#6b7280',
                    fontWeight: 600,
                  }}
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '9px', fontSize: '14px', marginTop: '8px' }}
            >
              Masuk
            </button>
          </form>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #e5e7eb', margin: '22px 0 16px 0' }} />

          {/* Akun tersedia */}
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '10px' }}>
            Akun yang tersedia (Role & Akses):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {usersList.map((u) => {
              const r = ROLE_LABELS[u.role] || { label: u.role, color: '#374151', bg: '#f3f4f6' };
              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    backgroundColor: '#fafafa',
                  }}
                  onClick={() => { setUsername(u.username); setPassword(u.password); }}
                  title="Klik untuk mengisi form login otomatis"
                >
                  <div>
                    <span style={{ fontWeight: 700 }}>{u.name}</span>
                    <span style={{ color: '#9ca3af', marginLeft: '6px' }}>(@{u.username})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      backgroundColor: r.bg, color: r.color,
                      padding: '1px 6px', borderRadius: '3px',
                      fontWeight: 700, fontSize: '11px',
                    }}>
                      {r.label}
                    </span>
                    {u.branch !== 'ALL' && (
                      <span style={{
                        backgroundColor: '#f3f4f6', color: '#374151',
                        padding: '1px 6px', borderRadius: '3px',
                        fontWeight: 600, fontSize: '11px',
                      }}>
                        {u.branch}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
            * Klik salah satu akun di atas untuk mengisi form login secara otomatis.
          </p>
        </div>
      </div>
    </div>
  );
}
