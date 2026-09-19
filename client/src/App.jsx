import { useState, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api/process';

const ASPECT_RATIOS = [
  { label: 'Original', value: null },
  { label: '1:1', w: 1, h: 1 },
  { label: '4:3', w: 4, h: 3 },
  { label: '16:9', w: 16, h: 9 },
  { label: '9:16', w: 9, h: 16 },
  { label: '3:2', w: 3, h: 2 },
  { label: '21:9', w: 21, h: 9 },
];

const IMAGE_FORMATS = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
];

const VIDEO_FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
  { value: 'avi', label: 'AVI' },
  { value: 'mkv', label: 'MKV' },
];

const VIDEO_BITRATES = [
  { value: '300k', label: 'Very Low — 300 kbps' },
  { value: '500k', label: 'Low — 500 kbps' },
  { value: '1000k', label: 'Medium — 1 Mbps' },
  { value: '2500k', label: 'High — 2.5 Mbps' },
  { value: '5000k', label: 'Very High — 5 Mbps' },
];

// SVG Icons as components
const Icons = {
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Image: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  ),
  Video: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect width="14" height="12" x="2" y="6" rx="2"/>
    </svg>
  ),
  Document: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
    </svg>
  ),
  LinkedIn: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  Instagram: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  ),
  GitHub: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  ),
  Bug: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
    </svg>
  ),
};

function detectFileType(file) {
  if (!file) return '';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'document';
  // Fallback on extension
  const ext = file.name.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','webp','avif','gif','bmp','tiff','svg'].includes(ext)) return 'image';
  if (['mp4','webm','avi','mkv','mov','flv','wmv'].includes(ext)) return 'video';
  if (['pdf'].includes(ext)) return 'document';
  return '';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function App() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [format, setFormat] = useState('');
  const [quality, setQuality] = useState(80);
  const [videoBitrate, setVideoBitrate] = useState('1000k');
  const [aspectRatio, setAspectRatio] = useState(null);

  // Bug report state
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugName, setBugName] = useState('');
  const [bugEmail, setBugEmail] = useState('');
  const [bugMessage, setBugMessage] = useState('');
  const [bugStatus, setBugStatus] = useState('idle'); // idle | sending | sent | error

  const fileInputRef = useRef(null);

  const resetAll = useCallback(() => {
    setFile(null);
    setFileType('');
    setStatus('idle');
    setErrorMsg('');
    setWidth('');
    setHeight('');
    setFormat('');
    setQuality(80);
    setVideoBitrate('1000k');
    setAspectRatio(null);
  }, []);

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    const type = detectFileType(selectedFile);
    if (!type) {
      setErrorMsg('Unsupported file type. Please upload an image, video, or PDF.');
      setStatus('error');
      return;
    }
    setFile(selectedFile);
    setFileType(type);
    setStatus('idle');
    setErrorMsg('');

    if (type === 'image') setFormat('jpeg');
    else if (type === 'video') setFormat('mp4');
    else setFormat('pdf');
  }, []);

  const handleAspectRatio = useCallback((ratio) => {
    setAspectRatio(ratio);
    if (ratio && ratio.w && width) {
      const newHeight = Math.round((parseInt(width) / ratio.w) * ratio.h);
      setHeight(String(newHeight));
    }
  }, [width]);

  const handleWidthChange = useCallback((val) => {
    setWidth(val);
    if (aspectRatio && aspectRatio.w && val) {
      const newHeight = Math.round((parseInt(val) / aspectRatio.w) * aspectRatio.h);
      setHeight(String(newHeight));
    }
  }, [aspectRatio]);

  const handleProcess = async () => {
    if (!file) return;
    setStatus('processing');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    if (fileType === 'image') {
      if (width) formData.append('width', width);
      if (height) formData.append('height', height);
      formData.append('format', format);
      formData.append('quality', String(quality));
      formData.append('maintainAspectRatio', aspectRatio ? 'false' : 'true');
    } else if (fileType === 'video') {
      if (width) formData.append('width', width);
      if (height) formData.append('height', height);
      formData.append('format', format);
      formData.append('videoBitrate', videoBitrate);
    }

    try {
      const response = await fetch(`${API_BASE}/${fileType}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Processing failed on server.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      a.download = `${baseName}_processed.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'An error occurred during processing.');
      setStatus('error');
    }
  };

  const FileIcon = fileType === 'image' ? Icons.Image : fileType === 'video' ? Icons.Video : Icons.Document;

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <Icons.Zap />
        </div>
        <h1 className="app-title">Compress & Convert</h1>
        <p className="app-subtitle">Optimize your videos, photos, and documents in seconds</p>
      </header>

      {/* Main Card */}
      <div className="main-card">

        {/* Error Banner */}
        {status === 'error' && errorMsg && (
          <div className="error-banner">
            <Icons.AlertCircle />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* === UPLOAD STATE === */}
        {!file && status !== 'success' && (
          <div
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon"><Icons.Upload /></div>
            <h2>Drop your file here</h2>
            <p>or click to browse from your computer</p>
            <div className="supported">
              <span className="badge">Images</span>
              <span className="badge accent">Videos</span>
              <span className="badge green">PDF</span>
            </div>
            <input
              type="file"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ''; }}
              accept="image/*,video/*,application/pdf"
            />
          </div>
        )}

        {/* === FILE SELECTED — OPTIONS === */}
        {file && status !== 'success' && (
          <>
            {/* File Info Bar */}
            <div className="file-bar">
              <div className={`file-bar-icon ${fileType}`}><FileIcon /></div>
              <div className="file-bar-info">
                <div className="file-bar-name">{file.name}</div>
                <div className="file-bar-meta">{formatSize(file.size)} · {fileType.charAt(0).toUpperCase() + fileType.slice(1)}</div>
              </div>
              <button className="file-bar-remove" onClick={resetAll} title="Remove file"><Icons.X /></button>
            </div>

            {status !== 'processing' && (
              <>
                {/* Resize Options (Image & Video) */}
                {(fileType === 'image' || fileType === 'video') && (
                  <>
                    <div className="section-label">Resize</div>
                    <div className="options-grid">
                      <div className="option-group">
                        <label>Width (px)</label>
                        <input
                          className="input"
                          type="number"
                          placeholder="Auto"
                          min="1"
                          value={width}
                          onChange={(e) => handleWidthChange(e.target.value)}
                        />
                      </div>
                      <div className="option-group">
                        <label>Height (px)</label>
                        <input
                          className="input"
                          type="number"
                          placeholder="Auto"
                          min="1"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                        />
                      </div>
                      <div className="option-group full-width">
                        <label>Aspect Ratio</label>
                        <div className="aspect-chips">
                          {ASPECT_RATIOS.map((ar) => (
                            <button
                              key={ar.label}
                              className={`chip ${aspectRatio?.label === ar.label ? 'active' : ''}`}
                              onClick={() => handleAspectRatio(ar.value === null ? { label: 'Original' } : ar)}
                            >
                              {ar.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Format & Quality (Image) */}
                {fileType === 'image' && (
                  <>
                    <div className="section-label">Format & Quality</div>
                    <div className="options-grid">
                      <div className="option-group">
                        <label>Output Format</label>
                        <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                          {IMAGE_FORMATS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="option-group" />
                      <div className="range-group">
                        <div className="range-header">
                          <label>Compression Quality</label>
                          <span className="range-value">{quality}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Format & Bitrate (Video) */}
                {fileType === 'video' && (
                  <>
                    <div className="section-label">Format & Compression</div>
                    <div className="options-grid">
                      <div className="option-group">
                        <label>Output Format</label>
                        <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                          {VIDEO_FORMATS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="option-group">
                        <label>Video Bitrate</label>
                        <select className="select" value={videoBitrate} onChange={(e) => setVideoBitrate(e.target.value)}>
                          {VIDEO_BITRATES.map((b) => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Document Info */}
                {fileType === 'document' && (
                  <>
                    <div className="section-label">Optimization</div>
                    <div className="options-grid">
                      <div className="option-group full-width">
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                          We'll strip metadata (author, title, keywords) and optimize the PDF structure to reduce file size.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Process Button */}
                <button className="btn-process" onClick={handleProcess}>
                  Compress & Convert
                </button>
              </>
            )}

            {/* Processing Spinner */}
            {status === 'processing' && (
              <div className="processing-state">
                <div className="spinner-ring" />
                <p className="processing-label">Processing your {fileType}...</p>
                <p>This might take a moment{fileType === 'video' ? ', especially for large videos' : ''}.</p>
              </div>
            )}
          </>
        )}

        {/* === SUCCESS STATE === */}
        {status === 'success' && (
          <div className="success-state">
            <div className="success-icon"><Icons.Check /></div>
            <h3>Done!</h3>
            <p>Your file has been processed and downloaded.</p>
            <button className="btn-new" onClick={resetAll}>Process Another File</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-socials">
          <a href="https://www.linkedin.com/in/piyush-chauhan-353822385/" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
            <Icons.LinkedIn />
          </a>
          <a href="https://www.instagram.com/piyu5h.08?igsh=MXJvcnlnb2hwZHliMQ%3D%3D" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
            <Icons.Instagram />
          </a>
          <a href="https://github.com/piyushch08" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
            <Icons.GitHub />
          </a>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} <a href="https://github.com/piyushch08" target="_blank" rel="noopener noreferrer">Piyush Chauhan</a>. All rights reserved.
        </div>
        <div className="footer-divider" />
        <button className="btn-report-bug" onClick={() => { setShowBugModal(true); setBugStatus('idle'); }}>
          <Icons.Bug /> Report a Bug
        </button>
      </footer>

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowBugModal(false); }}>
          <div className="modal-panel">
            <div className="modal-header">
              <h2><Icons.Bug /> Report a Bug</h2>
              <button className="modal-close" onClick={() => setShowBugModal(false)}><Icons.X /></button>
            </div>

            {bugStatus === 'sent' ? (
              <div className="bug-success-msg">
                <div className="success-icon"><Icons.Check /></div>
                <h3>Thanks for your report!</h3>
                <p>We'll look into it and get back to you if needed.</p>
                <button className="btn-new" onClick={() => { setShowBugModal(false); setBugName(''); setBugEmail(''); setBugMessage(''); setBugStatus('idle'); }}>
                  Close
                </button>
              </div>
            ) : (
              <form
                className="modal-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBugStatus('sending');
                  try {
                    const res = await fetch('https://formsubmit.co/ajax/piyush.ch407@gmail.com', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                      body: JSON.stringify({
                        name: bugName,
                        email: bugEmail,
                        message: bugMessage,
                        _subject: 'Bug Report — Compress & Convert',
                      }),
                    });
                    if (res.ok) {
                      setBugStatus('sent');
                    } else {
                      throw new Error('Failed');
                    }
                  } catch {
                    setBugStatus('error');
                  }
                }}
              >
                <div className="option-group">
                  <label>Your Name</label>
                  <input className="input" type="text" placeholder="John Doe" value={bugName} onChange={(e) => setBugName(e.target.value)} required />
                </div>
                <div className="option-group">
                  <label>Your Email</label>
                  <input className="input" type="email" placeholder="you@example.com" value={bugEmail} onChange={(e) => setBugEmail(e.target.value)} required />
                </div>
                <div className="option-group">
                  <label>Describe the Bug</label>
                  <textarea className="textarea" placeholder="What happened? What did you expect to happen?" value={bugMessage} onChange={(e) => setBugMessage(e.target.value)} required />
                </div>
                {bugStatus === 'error' && (
                  <div className="error-banner">
                    <Icons.AlertCircle />
                    <span>Failed to send. Please try again.</span>
                  </div>
                )}
                <button className="btn-submit-bug" type="submit" disabled={bugStatus === 'sending'}>
                  {bugStatus === 'sending' ? 'Sending...' : 'Submit Bug Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
