import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { getMetricHistory } from '../services/api';

const RANGES = [
  { key: '1h', label: '1 Hour' },
  { key: '6h', label: '6 Hours' },
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
];

const METRICS = [
  { key: 'CPU', color: '#3b82f6', gradient: 'colorCPU' },
  { key: 'RAM', color: '#a855f7', gradient: 'colorRAM' },
  { key: 'Disk', color: '#f59e0b', gradient: 'colorDisk' },
];

function formatTime(dateStr, range) {
  const d = new Date(dateStr);
  if (range === '7d') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (range === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #475569',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: '0.85rem',
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
          {p.dataKey}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
}

export default function MetricsHistoryChart({ serverId }) {
  const [range, setRange] = useState('1h');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState({ CPU: true, RAM: true, Disk: true });

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMetricHistory(serverId, range);
      const rows = res.data || res;
      const chartData = (Array.isArray(rows) ? rows : []).map((m) => ({
        time: formatTime(m.recorded_at, range),
        CPU: parseFloat(m.cpu_percent),
        RAM: parseFloat(m.ram_percent),
        Disk: parseFloat(m.disk_percent),
      }));
      setData(chartData);
    } catch (err) {
      console.error('Failed to fetch metric history:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [serverId, range]);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const toggleMetric = (key) => {
    setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute stats
  const stats = METRICS.map(({ key }) => {
    const values = data.map((d) => d[key]).filter((v) => !isNaN(v));
    if (!values.length) return { key, avg: '-', min: '-', max: '-', current: '-' };
    return {
      key,
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1),
      min: Math.min(...values).toFixed(1),
      max: Math.max(...values).toFixed(1),
      current: values[values.length - 1]?.toFixed(1) || '-',
    };
  });

  return (
    <div className="card" style={{ padding: 20 }}>
      {/* Header with range tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="card-title" style={{ margin: 0 }}>
          📈 Metric History
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: range === r.key ? '1px solid #3b82f6' : '1px solid #475569',
                background: range === r.key ? '#3b82f6' : 'transparent',
                color: range === r.key ? '#fff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: range === r.key ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric toggle pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {METRICS.map(({ key, color }) => (
          <button
            key={key}
            onClick={() => toggleMetric(key)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: `2px solid ${color}`,
              background: activeMetrics[key] ? color + '22' : 'transparent',
              color: activeMetrics[key] ? color : '#64748b',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              opacity: activeMetrics[key] ? 1 : 0.5,
              transition: 'all 0.2s',
            }}
          >
            {activeMetrics[key] ? '●' : '○'} {key}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Loading chart data…
        </div>
      ) : data.length === 0 ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          No data available for this time range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {METRICS.map(({ gradient, color }) => (
                <linearGradient key={gradient} id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              interval="preserveStartEnd"
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {METRICS.map(({ key, color, gradient }) =>
              activeMetrics[key] ? (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradient})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              ) : null
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Stats row */}
      {data.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginTop: 16,
        }}>
          {stats.map(({ key, avg, min, max, current }) => {
            const color = METRICS.find((m) => m.key === key)?.color || '#94a3b8';
            return (
              <div
                key={key}
                style={{
                  background: '#0f172a',
                  borderRadius: 8,
                  padding: '12px 16px',
                  border: `1px solid ${color}33`,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>
                  {key}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>
                  {current}%
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                  Avg {avg}% · Min {min}% · Max {max}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data points info */}
      <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#64748b', marginTop: 8 }}>
        {data.length} data points · Auto-refreshes every 30s
      </div>
    </div>
  );
}
