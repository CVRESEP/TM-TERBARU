import React, { useState, useEffect } from 'react';

export default function ModalUser({ isOpen, onClose, onSave, editUser = null, existingUsers = [] }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [branch, setBranch] = useState('Magetan');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editUser) {
      setName(editUser.name || '');
      setUsername(editUser.username || '');
      setPassword(editUser.password || '');
      setRole(editUser.role || 'admin');
      setBranch(editUser.branch || 'Magetan');
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setRole('admin');
      setBranch('Magetan');
    }
    setError('');
  }, [editUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanUsername || !password) {
      setError('Mohon lengkapi seluruh kolom isian pengguna.');
      return;
    }

    // Check duplicate username (except when editing the same user)
    const duplicate = existingUsers.find(u => u.username.toLowerCase() === cleanUsername && u.id !== editUser?.id);
    if (duplicate) {
      setError(`Username "${cleanUsername}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    const userData = {
      id: editUser ? editUser.id : `USR-${Date.now()}`,
      name: cleanName,
      username: cleanUsername,
      password: password,
      role: role,
      branch: (role === 'developer' || role === 'owner' || role === 'manajer') ? 'ALL' : branch
    };

    onSave(userData);
    onClose();
  };

  return (
    <div className="modal-overlay btn-print-hide">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <div>{editUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}</div>
          <button className="btn-secondary" style={{ padding: '2px 8px' }} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nama Lengkap / Pengguna *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Admin Cabang Magetan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Username Login *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: admin_magetan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: pass123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role Akses *</label>
                <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="admin">Admin Cabang (Terkunci)</option>
                  <option value="manajer">Manajer (Semua Cabang)</option>
                  <option value="owner">Owner (Full Access)</option>
                  <option value="developer">Developer (System Dev)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Akses Cabang *</label>
                {role === 'admin' ? (
                  <select className="form-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="Magetan">Magetan</option>
                    <option value="Sragen">Sragen</option>
                  </select>
                ) : (
                  <input type="text" className="form-input" value="Semua Cabang (ALL)" disabled style={{ backgroundColor: '#f3f4f6' }} />
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary">
              {editUser ? 'Simpan Perubahan' : 'Tambah Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
