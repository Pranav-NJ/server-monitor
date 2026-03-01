import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const LOG_TYPES = [
  { key: 'alerts', label: 'Alerts', icon: '🔔' },
  { key: 'sms', label: 'SMS Logs', icon: '📱' },
  { key: 'email', label: 'Email Logs', icon: '📧' },
  { key: 'audit', label: 'Audit Trail', icon: '📋' },
];

const SEVERITIES = ['ALL', 'CRITICAL', 'WARNING', 'INFO'];
const PAGE_SIZE = 15;

// Column definitions per log type
const COLUMNS = {
  alerts: [
    { key: 'id', label: '#' },
    { key: 'hostname', label: 'Server' },
    { key: 'metric_name', label: 'Metric' },
    { key: 'metric_value', label: 'Value' },
    { key: 'threshold', label: 'Threshold' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Time' },
  ],
  sms: [
    { key: 'id', label: '#' },
    { key: 'phone_number', label: 'Recipient' },
    { key: 'message', label: 'Message' },
    { key: 'twilio_sid', label: 'Twilio SID' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Sent At' },
  ],
  email: [
    { key: 'id', label: '#' },
    { key: 'recipient', label: 'Recipient' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Sent At' },
  ],
  audit: [
    { key: 'id', label: '#' },
    { key: 'table_name', label: 'Table' },
    { key: 'action', label: 'Action' },
    { key: 'old_value', label: 'Old Value' },
    { key: 'new_value', label: 'New Value' },
    { key: 'changed_by', label: 'By' },
    { key: 'created_at', label: 'Time' },
  ],
};

export default function LogViewer() {
  const [logType, setLogType] = useState('alerts');
  const [severity, setSeverity] = useState('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ total_rows: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({});

  // Fetch log counts for badges
  useEffect(() => {
    api.get('/logs/counts').then((res) => setCounts(res.data)).catch(() => {});
  }, [data]);

  // Fetch paginated logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs/', {
        params: { log_type: logType, severity, page, page_size: PAGE_SIZE },
      });
      setData(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
    setLoading(false);
  }, [logType, severity, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when switching type or filter
  useEffect(() => {
    setPage(1);
  }, [logType, severity]);

  const columns = COLUMNS[logType] || [];

  const formatCell = (row, col) => {
    const val = row[col.key];
    if (val == null) return '—';

    if (col.key === 'created_at' || col.key === 'resolved_at') {
      return new Date(val).toLocaleString();
    }
    if (col.key === 'severity') {
      return <span className={`badge badge-${val.toLowerCase()}`}>{val}</span>;
    }
    if (col.key === 'status') {
      return <span className={`badge badge-${val.toLowerCase()}`}>{val}</span>;
    }
    if (col.key === 'metric_value' || col.key === 'threshold') {
      return `${val}%`;
    }
    if (col.key === 'message' && typeof val === 'string' && val.length > 60) {
      return val.substring(0, 60) + '…';
    }
    return String(val);
  };

  const countKey = { alerts: 'alert_count', sms: 'sms_count', email: 'email_count', audit: 'audit_count' };

  return (
    <div style={{ marginTop: 24 }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {LOG_TYPES.map((lt) => (
          <button
            key={lt.key}
            onClick={() => setLogType(lt.key)}
            className={logType === lt.key ? 'btn btn-primary' : 'btn'}
            style={{
              background: logType === lt.key ? undefined : 'var(--surface)',
              color: logType === lt.key ? 'white' : 'var(--text)',
              border: logType === lt.key ? 'none' : '1px solid var(--border)',
              position: 'relative',
            }}
          >
            {lt.icon} {lt.label}
            {counts[countKey[lt.key]] > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {counts[countKey[lt.key]]}
              </span>
            )}
          </button>
        ))}

        {/* Severity filter (only for alerts tab) */}
        {logType === 'alerts' && (
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? '🔍 All Severities' : s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40 }}>
                    Loading…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={row.id || i}>
                    {columns.map((col) => (
                      <td key={col.key}>{formatCell(row, col)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            padding: '8px 0',
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {data.length} of {pagination.total_rows || 0} records
            &nbsp;•&nbsp; Page {page} of {pagination.total_pages || 1}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              disabled={page <= 1}
              onClick={() => setPage(1)}
            >
              ⟨⟨
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, pagination.total_pages || 1) }, (_, i) => {
              const totalPages = pagination.total_pages || 1;
              let startPage = Math.max(1, page - 2);
              if (startPage + 4 > totalPages) startPage = Math.max(1, totalPages - 4);
              const pageNum = startPage + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  className={`btn btn-sm ${pageNum === page ? 'btn-primary' : ''}`}
                  style={
                    pageNum !== page
                      ? { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
                      : {}
                  }
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="btn btn-sm"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              disabled={page >= (pagination.total_pages || 1)}
              onClick={() => setPage((p) => Math.min(pagination.total_pages || 1, p + 1))}
            >
              Next →
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              disabled={page >= (pagination.total_pages || 1)}
              onClick={() => setPage(pagination.total_pages || 1)}
            >
              ⟩⟩
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
