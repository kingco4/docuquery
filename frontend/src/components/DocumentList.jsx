import "./DocumentList.css";

export default function DocumentList({ documents, activeDoc, onSelect, onDelete }) {
  const entries = Object.entries(documents);

  if (entries.length === 0) {
    return (
      <div className="doc-list-empty">
        <span>No documents yet</span>
      </div>
    );
  }

  return (
    <div className="doc-list">
      <div className="doc-list-header">Documents</div>
      {entries.map(([id, doc]) => (
        <div
          key={id}
          className={`doc-item ${activeDoc === id ? "active" : ""}`}
          onClick={() => onSelect(id)}
        >
          <div className="doc-item-icon">PDF</div>
          <div className="doc-item-info">
            <div className="doc-item-name">{doc.filename}</div>
            <div className="doc-item-meta">{doc.chunk_count} chunks</div>
          </div>
          <button
            className="doc-item-delete"
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            title="Remove"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
