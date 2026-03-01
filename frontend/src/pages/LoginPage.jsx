import React, { useState } from 'react';
import { login } from '../services/api';
import toast from 'react-hot-toast';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(username, password);
      onLogin(res.data.access_token);
      toast.success('Logged in');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    blob1: {
      position: 'absolute',
      top: '-20%',
      left: '-10%',
      width: 500,
      height: 500,
      background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 4s ease-in-out infinite',
    },
    blob2: {
      position: 'absolute',
      bottom: '-20%',
      right: '-10%',
      width: 500,
      height: 500,
      background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 4s ease-in-out infinite 1s',
    },
    blob3: {
      position: 'absolute',
      top: '30%',
      right: '25%',
      width: 300,
      height: 300,
      background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 4s ease-in-out infinite 2s',
    },
    card: {
      position: 'relative',
      zIndex: 10,
      width: '100%',
      maxWidth: 420,
      margin: '0 16px',
      background: 'rgba(30, 41, 59, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(71, 85, 105, 0.4)',
      borderRadius: 20,
      boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 100px rgba(59,130,246,0.05)',
      padding: '40px 36px',
    },
    logoBox: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 64,
      height: 64,
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      borderRadius: 16,
      margin: '0 auto 16px',
      boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
    },
    title: {
      textAlign: 'center',
      fontSize: '1.6rem',
      fontWeight: 700,
      color: '#f1f5f9',
      margin: '0 0 4px',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#94a3b8',
      margin: '0 0 32px',
    },
    label: {
      display: 'block',
      fontSize: '0.8rem',
      fontWeight: 500,
      color: '#cbd5e1',
      marginBottom: 6,
      letterSpacing: '0.02em',
    },
    inputWrapper: {
      position: 'relative',
      marginBottom: 20,
    },
    iconBox: {
      position: 'absolute',
      top: '50%',
      left: 14,
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      display: 'flex',
    },
    input: (focused) => ({
      width: '100%',
      padding: '13px 16px 13px 44px',
      background: 'rgba(15, 23, 42, 0.6)',
      border: `1.5px solid ${focused ? 'rgba(59,130,246,0.6)' : 'rgba(71, 85, 105, 0.5)'}`,
      borderRadius: 12,
      color: '#f1f5f9',
      fontSize: '0.95rem',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
      fontFamily: 'inherit',
    }),
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      border: 'none',
      borderRadius: 12,
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
    },
    divider: {
      borderTop: '1px solid rgba(71, 85, 105, 0.4)',
      marginTop: 28,
      paddingTop: 20,
      textAlign: 'center',
    },
    footerText: {
      fontSize: '0.75rem',
      color: '#64748b',
      margin: 0,
    },
    statusRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 10,
    },
    statusDot: {
      width: 6,
      height: 6,
      background: '#22c55e',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'pulse 2s ease-in-out infinite',
      boxShadow: '0 0 8px rgba(34,197,94,0.4)',
    },
    statusText: {
      fontSize: '0.75rem',
      color: '#4ade80',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
    },
    version: {
      fontSize: '0.7rem',
      color: '#475569',
    },
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={styles.wrapper}>
        {/* Background blobs */}
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />

        {/* Card */}
        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoBox}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-13.5 0a3 3 0 0 1-3-3m3 3h13.5m-13.5-3a3 3 0 0 1 0-6h13.5a3 3 0 0 1 0 6m-13.5 0h13.5m0 0a3 3 0 0 1 3 3m-3-3h-13.5m13.5 0a3 3 0 0 1 3-3" />
            </svg>
          </div>
          <h1 style={styles.title}>Server Monitor</h1>
          <p style={styles.subtitle}>Sign in to your dashboard</p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <label style={styles.label}>USERNAME</label>
            <div style={styles.inputWrapper}>
              <div style={styles.iconBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('user')}
                onBlur={() => setFocusedField(null)}
                required
                autoFocus
                placeholder="Enter username"
                style={styles.input(focusedField === 'user')}
              />
            </div>

            {/* Password */}
            <label style={styles.label}>PASSWORD</label>
            <div style={styles.inputWrapper}>
              <div style={styles.iconBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Enter password"
                style={styles.input(focusedField === 'pass')}
              />
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={styles.divider}>
            <p style={styles.footerText}>Real-time server monitoring with alerts</p>
            <div style={styles.statusRow}>
              <span style={styles.statusText}>
                <span style={styles.statusDot} />
                System Online
              </span>
              <span style={styles.version}>v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
