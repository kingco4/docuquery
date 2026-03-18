import { useState, useRef } from "react";
import "./UploadZone.css";

export default function UploadZone({ onUpload, isUploading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <div className="upload-icon">{isUploading ? "⟳" : "↑"}</div>
      <div className="upload-label">
        {isUploading ? "Indexing document..." : "Drop PDF here"}
      </div>
      <div className="upload-sub">
        {isUploading ? "Building vector index" : "or click to browse"}
      </div>
    </div>
  );
}
