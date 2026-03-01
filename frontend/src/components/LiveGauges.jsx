import React, { useState, useEffect, useRef } from 'react';

/**
 * Animated SVG gauge — ring arc that fills based on percentage.
 */
function GaugeRing({ value, label, color, size = 140 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  // Color thresholds
  const arcColor =
    progress >= 90 ? '#ef4444' : progress >= 75 ? '#f59e0b' : color;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-light)"
          strokeWidth="10"
        />
        {/* Value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
        />
      </svg>
      {/* Center text overlay */}
      <div
        style={{
          marginTop: -(size / 2 + 18),
          position: 'relative',
          top: 0,
        }}
      >
        <div
          style={{
            fontSize: size > 120 ? '1.6rem' : '1.2rem',
            fontWeight: 700,
            color: arcColor,
            lineHeight: 1,
          }}
        >
          {progress.toFixed(1)}%
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginTop: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </div>
      </div>
      {/* Spacer so next content doesn't overlap */}
      <div style={{ height: size / 2 - 10 }} />
    </div>
  );
}

/**
 * LiveGauges — connects to WebSocket and renders real-time CPU/RAM/Disk gauges.
 */
export default function LiveGauges({ serverId }) {
  const [metrics, setMetrics] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.hostname;
      const wsUrl = `${protocol}://${host}:8000/ws/metrics`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cancelled) setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'metrics' && msg.servers) {
            const srv = msg.servers.find((s) => s.server_id === serverId);
            if (srv && !cancelled) {
              setMetrics(srv);
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!cancelled) {
          setConnected(false);
          // Auto-reconnect after 3 seconds
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [serverId]);

  if (!metrics) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 30 }}>
        <span style={{ color: 'var(--text-muted)' }}>
          {connected ? 'Waiting for data…' : '🔄 Connecting to live feed…'}
        </span>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="card-title" style={{ margin: 0 }}>
          ⚡ Live Gauges — {metrics.hostname}
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            padding: '2px 8px',
            borderRadius: 12,
            background: connected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: connected ? 'var(--success)' : 'var(--danger)',
            fontWeight: 600,
          }}
        >
          {connected ? '● LIVE' : '● DISCONNECTED'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
        <GaugeRing value={metrics.cpu} label="CPU" color="#3b82f6" />
        <GaugeRing value={metrics.ram} label="RAM" color="#a855f7" />
        <GaugeRing value={metrics.disk} label="Disk" color="#f59e0b" />
      </div>

      <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Last update: {metrics.recorded_at ? new Date(metrics.recorded_at).toLocaleTimeString() : '—'}
      </div>
    </div>
  );
}
