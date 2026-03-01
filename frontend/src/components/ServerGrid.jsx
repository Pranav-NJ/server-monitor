import React, { useCallback } from 'react';
import { getServerHealth } from '../services/api';
import { usePolling } from '../hooks/usePolling';

function ServerCard({ server, isSelected, onClick }) {
  const fetchHealth = useCallback(() => getServerHealth(server.server_id), [server.server_id]);
  const { data: health } = usePolling(fetchHealth, 12000);

  const statusClass = (server.status || 'ONLINE').toLowerCase();

  return (
    <div
      className={`server-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(server.server_id)}
    >
      <div className="flex-between">
        <div className="hostname">{server.hostname}</div>
        <span className={`badge badge-${statusClass}`}>{server.status}</span>
      </div>
      <div className="ip">{server.ip_address}</div>

      {health && (
        <>
          <div className="metric-row">
            <span className="metric-label">CPU</span>
            <span className="metric-value">{health.latest_cpu ?? '–'}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">RAM</span>
            <span className="metric-value">{health.latest_ram ?? '–'}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Disk</span>
            <span className="metric-value">{health.latest_disk ?? '–'}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Active Alerts</span>
            <span className={`metric-value ${health.active_alerts > 0 ? 'text-danger' : 'text-success'}`}>
              {health.active_alerts}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function ServerGrid({ servers, selectedId, onSelect }) {
  if (!servers.length) {
    return <p className="text-muted mb-4">No servers registered yet.</p>;
  }

  return (
    <div className="server-grid">
      {servers.map((s) => (
        <ServerCard
          key={s.server_id}
          server={s}
          isSelected={selectedId === s.server_id}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}
