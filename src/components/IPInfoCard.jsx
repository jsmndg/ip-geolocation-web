export default function IPInfoCard({ data, loading }) {
  if (loading) {
    return (
      <div className="panel skeleton fade-in">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel fade-in">
        <p className="muted">No IP data available yet.</p>
      </div>
    );
  }

  const fields = [
    ['IP', data.ip],
    ['Hostname', data.hostname],
    ['City', data.city],
    ['Region', data.region],
    ['Country', data.country],
    ['Location', data.loc],
    ['Organization', data.org],
    ['Timezone', data.timezone],
    ['Postal', data.postal],
  ];

  return (
    <div className="panel glow-on-hover fade-in">
      <h2>IP Information</h2>
      <div className="info-grid">
        {fields.map(([label, value]) => (
          <div key={label} className="info-card">
            <p className="info-label">{label}</p>
            <p className="info-value">{value || 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
