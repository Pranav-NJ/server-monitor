import React, { useState } from 'react';
import { resolveAlert } from '../services/api';
import toast from 'react-hot-toast';

export default function AlertTable({ alerts, onResolved }) {
  const [resolving, setResolving] = useState(null);

  const handleResolve = async (alertId) => {
    setResolving(alertId);
    try {
      await resolveAlert(alertId);
      toast.success(`Alert #${alertId} resolved`);
      onResolved();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resolve alert');
    } finally {
      setResolving(null);
    }
  };

  if (!alerts.length) {
    return <p className="text-muted">No alerts recorded.</p>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Server</th>
            <th>Metric</th>
            <th>Value</th>
            <th>Threshold</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.alert_id}>
              <td>{a.alert_id}</td>
              <td>{a.hostname || `#${a.server_id}`}</td>
              <td>{a.metric_name}</td>
              <td>{a.metric_value}%</td>
              <td>{a.threshold}%</td>
              <td>
                <span className={`badge badge-${a.severity.toLowerCase()}`}>
                  {a.severity}
                </span>
              </td>
              <td>
                <span className={`badge badge-${a.status.toLowerCase()}`}>
                  {a.status}
                </span>
              </td>
              <td style={{ fontSize: '0.8rem' }}>
                {new Date(a.created_at).toLocaleString()}
              </td>
              <td>
                {['PENDING', 'SENT', 'ACKNOWLEDGED'].includes(a.status) && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleResolve(a.alert_id)}
                    disabled={resolving === a.alert_id}
                  >
                    {resolving === a.alert_id ? '…' : 'Resolve'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
