import { useState } from 'react';

export default function SearchHistory({
  items,
  onSelect,
  onDeleteSelected,
  deleting,
  loading,
  error,
  onRetry,
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    await onDeleteSelected(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="panel fade-in">
      <h2>Search History</h2>

      {loading ? (
        <p className="muted">Loading history...</p>
      ) : error ? (
        <div className="state-box state-error">
          <p>{error}</p>
          <button type="button" className="secondary-btn" onClick={onRetry}>
            Retry History
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="muted">No history yet.</p>
      ) : (
        <ul className="history-list">
          {items.map((item) => (
            <li key={item.id} className="history-item">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleId(item.id)}
                aria-label={`Select history item ${item.id}`}
              />
              <button
                type="button"
                className="history-link"
                onClick={() => onSelect(item.ip_address)}
              >
                <span>{item.ip_address}</span>
                <small>{new Date(item.searched_at).toLocaleString()}</small>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedIds.length > 0 ? (
        <button type="button" onClick={handleDelete} disabled={deleting} className="danger-btn">
          {deleting ? 'Deleting...' : 'Delete Selected'}
        </button>
      ) : null}
    </div>
  );
}
