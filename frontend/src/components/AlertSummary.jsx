import React from 'react';

export default function AlertSummary({ data }) {
  if (!data || !data.length) return null;

  // Aggregate into readable cards
  const totals = { CRITICAL: 0, WARNING: 0, INFO: 0, PENDING: 0, RESOLVED: 0 };
  data.forEach((row) => {
    if (totals[row.severity] !== undefined) totals[row.severity] += row.alert_count;
    if (totals[row.status] !== undefined) totals[row.status] += row.alert_count;
  });

  const cards = [
    { label: 'Critical', count: totals.CRITICAL, cls: 'text-danger' },
    { label: 'Warning', count: totals.WARNING, cls: 'text-warning' },
    { label: 'Info', count: totals.INFO, cls: 'text-muted' },
    { label: 'Pending', count: totals.PENDING, cls: 'text-warning' },
    { label: 'Resolved', count: totals.RESOLVED, cls: 'text-success' },
  ];

  return (
    <div className="summary-grid">
      {cards.map((c) => (
        <div className="summary-card" key={c.label}>
          <div className={`count ${c.cls}`}>{c.count}</div>
          <div className="label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
