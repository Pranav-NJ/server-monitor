import React, { useState, useCallback } from 'react';
import { getServers, getAlerts, getAlertSummary } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import ServerGrid from '../components/ServerGrid';
import MetricsCharts from '../components/MetricsCharts';
import MetricsHistoryChart from '../components/MetricsHistoryChart';
import AlertTable from '../components/AlertTable';
import AlertSummary from '../components/AlertSummary';
import AddServerModal from '../components/AddServerModal';
import LiveGauges from '../components/LiveGauges';
import UptimeChart from '../components/UptimeChart';
import LogViewer from '../components/LogViewer';

export default function DashboardPage({ onLogout }) {
  const [selectedServer, setSelectedServer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const fetchServers = useCallback(() => getServers(), []);
  const fetchAlerts = useCallback(() => getAlerts(100), []);
  const fetchSummary = useCallback(() => getAlertSummary(), []);

  const { data: servers, refetch: refetchServers } = usePolling(fetchServers, 15000);
  const { data: alerts, refetch: refetchAlerts } = usePolling(fetchAlerts, 10000);
  const { data: summary, refetch: refetchSummary } = usePolling(fetchSummary, 10000);

  const handleAlertResolved = () => {
    refetchAlerts();
    refetchSummary();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>⚡ Server Monitor</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : ''}`}
            style={activeTab !== 'dashboard' ? { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' } : {}}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'logs' ? 'btn-primary' : ''}`}
            style={activeTab !== 'logs' ? { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' } : {}}
            onClick={() => setActiveTab('logs')}
          >
            📋 Log Viewer
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Server
          </button>
          <button className="btn btn-danger btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {activeTab === 'logs' ? (
        /* ══════════════ LOG VIEWER TAB ══════════════ */
        <>
          <div className="section-header">
            <h2>📋 Log Viewer</h2>
          </div>
          <LogViewer />
        </>
      ) : (
        /* ══════════════ DASHBOARD TAB ══════════════ */
        <>
          {/* Alert Summary */}
          <AlertSummary data={summary} />

          {/* Server Cards */}
          <div className="section-header">
            <h2>Servers</h2>
          </div>
          <ServerGrid
            servers={servers || []}
            selectedId={selectedServer}
            onSelect={setSelectedServer}
          />

          {/* Live Gauges (WebSocket) */}
          {selectedServer && (
            <>
              <div className="section-header" style={{ marginTop: 24 }}>
                <h2>⚡ Real-Time Gauges – Server #{selectedServer}</h2>
              </div>
              <LiveGauges serverId={selectedServer} />
            </>
          )}

          {/* Metrics Charts */}
          {selectedServer && (
            <>
              <div className="section-header" style={{ marginTop: 24 }}>
                <h2>Metrics – Server #{selectedServer}</h2>
              </div>
              <MetricsCharts serverId={selectedServer} />

              {/* Metric History Charts */}
              <div className="section-header" style={{ marginTop: 24 }}>
                <h2>📈 Metric History – Server #{selectedServer}</h2>
              </div>
              <MetricsHistoryChart serverId={selectedServer} />

              {/* Uptime History Chart */}
              <div className="section-header" style={{ marginTop: 24 }}>
                <h2>📊 Uptime History</h2>
              </div>
              <UptimeChart serverId={selectedServer} />
            </>
          )}

          {/* Alerts Table */}
          <div className="section-header">
            <h2>Alert History</h2>
          </div>
          <div className="card">
            <AlertTable alerts={alerts || []} onResolved={handleAlertResolved} />
          </div>
        </>
      )}

      {/* Add Server Modal */}
      {showAddModal && (
        <AddServerModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { refetchServers(); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
