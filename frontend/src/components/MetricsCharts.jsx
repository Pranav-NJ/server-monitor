import React, { useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { getLatestMetrics } from '../services/api';
import { usePolling } from '../hooks/usePolling';

export default function MetricsCharts({ serverId }) {
  const fetchMetrics = useCallback(() => getLatestMetrics(serverId), [serverId]);
  const { data: rawMetrics, loading } = usePolling(fetchMetrics, 10000);

  if (loading || !rawMetrics) return <p className="text-muted">Loading metrics…</p>;
  if (!rawMetrics.length) return <p className="text-muted">No metrics available yet.</p>;

  // Reverse so oldest is on left
  const chartData = [...rawMetrics].reverse().map((m) => ({
    time: new Date(m.recorded_at).toLocaleTimeString(),
    CPU: m.cpu_percent,
    RAM: m.ram_percent,
    Disk: m.disk_percent,
  }));

  return (
    <div className="charts-grid">
      {/* Combined Chart */}
      <div className="card">
        <div className="card-title">CPU / RAM / Disk Over Time</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            />
            <Legend />
            <Line type="monotone" dataKey="CPU" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="RAM" stroke="#a855f7" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Disk" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Individual Gauge-style cards */}
      <div className="card">
        <div className="card-title">Latest Snapshot</div>
        <table>
          <thead>
            <tr><th>Metric</th><th>Value</th></tr>
          </thead>
          <tbody>
            {rawMetrics.slice(0, 5).map((m, i) => (
              <tr key={i}>
                <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {new Date(m.recorded_at).toLocaleTimeString()}
                </td>
                <td>
                  CPU {m.cpu_percent}% &nbsp;|&nbsp;
                  RAM {m.ram_percent}% &nbsp;|&nbsp;
                  Disk {m.disk_percent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
