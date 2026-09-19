import { useState, useRef, useCallback } from 'react';
import { Icons } from '../utils/Icons';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api/process';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function PdfTools() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // PDF specific states
  const [pagesToDelete, setPagesToDelete] = useState('');

  const fileInputRef = useRef(null);

  const resetAll = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
    setPagesToDelete('');
  }, []);

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > 500 * 1024 * 1024) {
        setErrorMsg('File exceeds 500MB limit.');
        setStatus('error');
        return;
    }
    if (selectedFile.type !== 'application/pdf') {
        setErrorMsg('Please upload a PDF file.');
        setStatus('error');
        return;
    }
    setFile(selectedFile);
    setStatus('idle');
    setErrorMsg('');
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleProcess = async () => {
    if (!file) return;
    setStatus('processing');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);
    if (pagesToDelete) formData.append('pagesToDelete', pagesToDelete);

    try {
      const response = await fetch(`${API_BASE}/document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      a.download = `${baseName}_optimized.pdf`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred during processing.');
    }
  };

  return (
    <div className="main-card">
      <Link to="/" className="back-link">
        <Icons.ArrowLeft /> Back to Tools
      </Link>
      
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <div className="dropzone-icon" style={{margin: '0 auto 1rem', background: '#059669'}}><Icons.Document /></div>
        <h2 style={{color: 'var(--blue-900)', fontSize: '1.5rem', fontWeight: 900}}>PDF Compressor & Editor</h2>
        <p style={{color: 'var(--dark-muted)'}}>Compress PDFs and delete specific pages.</p>
      </div>

      {!file && (
        <div
          className={`dropzone ${isDragging ? 'active' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files[0])}
            style={{ display: 'none' }}
            accept="application/pdf"
          />
          <div className="dropzone-icon" style={{background: '#059669'}}><Icons.Upload /></div>
          <h2>Upload PDF</h2>
          <p>Drag and drop your PDF file here, or click to browse</p>
          <div className="supported">
            <span className="badge">Max 500MB</span>
            <span className="badge green">PDF</span>
          </div>
        </div>
      )}

      {file && status !== 'success' && (
        <div className="file-config-section">
          <div className="file-bar">
            <div className="file-bar-icon document"><Icons.Document /></div>
            <div className="file-bar-info">
              <div className="file-bar-name">{file.name}</div>
              <div className="file-bar-meta">{formatSize(file.size)}</div>
            </div>
            <button className="file-bar-remove" onClick={resetAll} title="Remove file">
              <Icons.Trash2 />
            </button>
          </div>

          {status === 'error' && (
            <div className="error-banner">
              <Icons.AlertCircle />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === 'processing' ? (
            <div className="processing-state">
              <div className="spinner-ring" style={{borderTopColor: '#059669'}}></div>
              <div className="processing-label">Processing PDF...</div>
              <p>Please wait while we optimize your document.</p>
            </div>
          ) : (
            <div className="options-panel">
              
              <div className="section-label">Page Management</div>
              <div className="options-grid">
                <div className="option-group full-width">
                  <label>Delete Pages (Comma separated, 1-indexed)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 1, 3, 5-7"
                    value={pagesToDelete}
                    onChange={(e) => setPagesToDelete(e.target.value)}
                  />
                  <small style={{color: 'var(--dark-muted)', marginTop: '0.25rem'}}>Leave empty to keep all pages. (Ranges like 5-7 are supported backend, but for now just use commas e.g. 1,3,5)</small>
                </div>
              </div>

              <div className="section-label">Optimization</div>
              <div className="options-grid">
                <div className="option-group full-width">
                  <p style={{ color: 'var(--dark-muted)', fontSize: '0.9rem', lineHeight: '1.6', fontWeight: '500' }}>
                    We'll automatically strip metadata (author, title, keywords) and optimize the PDF structure to reduce file size.
                  </p>
                </div>
              </div>

              <button className="btn-process" onClick={handleProcess} style={{background: '#059669'}}>
                Process PDF
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'success' && (
        <div className="success-state">
          <div className="success-icon"><Icons.Check /></div>
          <h3>Processing Complete!</h3>
          <p>Your PDF has been processed and downloaded automatically.</p>
          <button className="btn-new" onClick={resetAll}>Process Another PDF</button>
        </div>
      )}
    </div>
  );
}
