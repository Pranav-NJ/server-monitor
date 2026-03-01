import React, { useState } from 'react';
import { registerServer } from '../services/api';
import toast from 'react-hot-toast';

export default function AddServerModal({ onClose, onAdded }) {
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [osInfo, setOsInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerServer({ hostname, ip_address: ipAddress, os_info: osInfo || null });
      toast.success('Server registered');
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Register New Server</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Hostname *</label>
            <input value={hostname} onChange={(e) => setHostname(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>IP Address *</label>
            <input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>OS Info</label>
            <input value={osInfo} onChange={(e) => setOsInfo(e.target.value)} placeholder="e.g. Ubuntu 22.04" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
