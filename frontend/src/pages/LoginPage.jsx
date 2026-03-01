import React, { useState } from 'react';
import { login, signup } from '../services/api';
import toast from 'react-hot-toast';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const switchMode = (m) => {
    setMode(m);
    setUsername(''); setEmail(''); setPhone('');
    setPassword(''); setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(username, password);
        onLogin(res.data.access_token);
        toast.success('Logged in');
      } else {
        const res = await signup(username, email, password, phone || null);
        onLogin(res.data.access_token);
        toast.success('Account created! Welcome, ' + username);
      }
    } catch (err) {
      const msg = err?.response?.data?.detail;
      toast.error(msg || (mode === 'login' ? 'Invalid credentials' : 'Signup failed'));
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
    tabs: {
      display: 'flex',
      background: 'rgba(15,23,42,0.5)',
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
      gap: 4,
    },
    tab: (active) => ({
      flex: 1,
      padding: '9px 0',
      background: active ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
      border: 'none',
      borderRadius: 9,
      color: active ? '#fff' : '#94a3b8',
      fontSize: '0.875rem',
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      boxShadow: active ? '0 2px 12px rgba(59,130,246,0.3)' : 'none',
    }),
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
        input::placeholder { color: #475569; }
      `}</style>

      <div style={styles.wrapper}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />

        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoBox}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-13.5 0a3 3 0 0 1-3-3m3 3h13.5m-13.5-3a3 3 0 0 1 0-6h13.5a3 3 0 0 1 0 6m-13.5 0h13.5m0 0a3 3 0 0 1 3 3m-3-3h-13.5m13.5 0a3 3 0 0 1 3-3" />
            </svg>
          </div>
          <h1 style={styles.title}>Server Monitor</h1>
          <p style={styles.subtitle}>
            {mode === 'login' ? 'Sign in to your dashboard' : 'Create a viewer account'}
          </p>

          {/* Mode tabs */}
          <div style={styles.tabs}>
            <button type="button" style={styles.tab(mode === 'login')} onClick={() => switchMode('login')}>Sign In</button>
            <button type="button" style={styles.tab(mode === 'signup')} onClick={() => switchMode('signup')}>Sign Up</button>
          </div>

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

            {/* Email — signup only */}
            {mode === 'signup' && (
              <>
                <label style={styles.label}>EMAIL</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.iconBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-9.75 6.75L2.25 6.75" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="you@example.com"
                    style={styles.input(focusedField === 'email')}
                  />
                </div>

                <label style={styles.label}>PHONE (optional)</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.iconBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="+1 555 000 0000"
                    style={styles.input(focusedField === 'phone')}
                  />
                </div>
              </>
            )}

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
                placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                style={styles.input(focusedField === 'pass')}
              />
            </div>

            {/* Confirm password — signup only */}
            {mode === 'signup' && (
              <>
                <label style={styles.label}>CONFIRM PASSWORD</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.iconBox}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    required
                    placeholder="Re-enter password"
                    style={{
                      ...styles.input(focusedField === 'confirm'),
                      borderColor: confirmPassword && password !== confirmPassword
                        ? 'rgba(239,68,68,0.7)'
                        : focusedField === 'confirm'
                        ? 'rgba(59,130,246,0.6)'
                        : 'rgba(71,85,105,0.5)',
                    }}
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
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
