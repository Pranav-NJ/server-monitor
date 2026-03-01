import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import api from '../services/api';

const RANGE_OPTIONS = [
  { key: 24, label: '24h' },
  { key: 48, label: '48h' },
  { key: 168, label: '7d' },
  { key: 720, label: '30d' },
];

export default function UptimeChart({ serverId }) {
  const [hours, setHours] = useState(48);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUptime = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/logs/uptime/${serverId}`, { params: { hours } });
      const chartData = (res.data || []).map((row) => ({
        hour: new Date(row.hour_bucket).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        metrics: row.metric_count,
        cpu: row.avg_cpu,
        ram: row.avg_ram,
        disk: row.avg_disk,
        status: row.status,
      }));
      setData(chartData);
    } catch (err) {
      console.error('Failed to fetch uptime:', err);
    }
    setLoading(false);
  }, [serverId, hours]);

  useEffect(() => {
    fetchUptime();
  }, [fetchUptime]);

  const uptimePercent = data.length > 0
    ? ((data.filter((d) => d.status === 'UP').length / data.length) * 100).toFixed(1)
    : '—';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="card-title" style={{ margin: 0 }}>
          📊 Uptime History — Server #{serverId}
          <span
            style={{
              marginLeft: 12,
              fontSize: '0.85rem',
              padding: '2px 10px',
              borderRadius: 12,
              background: uptimePercent >= 99 ? 'rgba(34,197,94,0.15)' :
                uptimePercent >= 95 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
              color: uptimePercent >= 99 ? 'var(--success)' :
                uptimePercent >= 95 ? 'var(--warning)' : 'var(--danger)',
              fontWeight: 600,
            }}
          >
            {uptimePercent}% uptime
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              className={`btn btn-sm ${hours === r.key ? 'btn-primary' : ''}`}
              style={
                hours !== r.key
                  ? { background: 'var(--surface-light)', color: 'var(--text)', border: 'none' }
                  : {}
              }
              onClick={() => setHours(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</p>
      ) : data.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No uptime data available yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval={Math.max(0, Math.floor(data.length / 12))}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              label={{ value: 'Metrics/hr', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11 } }}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: 8,
                fontSize: '0.85rem',
              }}
              formatter={(value, name) => {
                if (name === 'metrics') return [value, 'Data points'];
                return [value + '%', name.toUpperCase()];
              }}
            />
            <Legend />
            <Bar dataKey="metrics" name="Data Points" radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.status === 'UP' ? '#22c55e' : '#ef4444'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Uptime strip visualization */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          Status Timeline
        </div>
        <div style={{ display: 'flex', gap: 1, height: 16, borderRadius: 4, overflow: 'hidden' }}>
          {data.map((d, i) => (
            <div
              key={i}
              title={`${d.hour}: ${d.status} (${d.metrics} metrics)`}
              style={{
                flex: 1,
                background: d.status === 'UP' ? '#22c55e' : '#ef4444',
                opacity: 0.8,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = 1)}
              onMouseLeave={(e) => (e.target.style.opacity = 0.8)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          <span>{data.length > 0 ? data[0].hour : ''}</span>
          <span>{data.length > 0 ? data[data.length - 1].hour : ''}</span>
        </div>
      </div>
    </div>
  );
}
