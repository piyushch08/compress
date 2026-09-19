import { useState, useRef, useCallback } from 'react';
import { Icons } from '../utils/Icons';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:3001/api/process';

const ASPECT_RATIOS = [
  { label: 'Original', value: null },
  { label: '16:9', w: 16, h: 9 },
  { label: '9:16', w: 9, h: 16 },
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
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

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function VideoTools() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [format, setFormat] = useState('');
  const [videoBitrate, setVideoBitrate] = useState('1000k');
  const [aspectRatio, setAspectRatio] = useState(null);
  
  // Trimming states
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');

  const fileInputRef = useRef(null);

  const resetAll = useCallback(() => {
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
    setWidth('');
    setHeight('');
    setFormat('');
    setVideoBitrate('1000k');
    setAspectRatio(null);
    setStartTime('');
    setDuration('');
  }, []);

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > 500 * 1024 * 1024) {
        setErrorMsg('File exceeds 500MB limit.');
        setStatus('error');
        return;
    }
    if (!selectedFile.type.startsWith('video/')) {
        setErrorMsg('Please upload a video file.');
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
    if (width) formData.append('width', width);
    if (height) formData.append('height', height);
    if (format) formData.append('format', format);
    formData.append('videoBitrate', videoBitrate);
    
    if (startTime) formData.append('startTime', startTime);
    if (duration) formData.append('duration', duration);

    try {
      const response = await fetch(`${API_BASE}/video`, {
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
      
      const outExt = format || file.name.split('.').pop();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      a.download = `${baseName}_compressed.${outExt}`;
      
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
        <div className="dropzone-icon" style={{margin: '0 auto 1rem'}}><Icons.Video /></div>
        <h2 style={{color: 'var(--blue-900)', fontSize: '1.5rem', fontWeight: 900}}>Video Compressor & Trimmer</h2>
        <p style={{color: 'var(--dark-muted)'}}>Compress, trim duration, and change aspect ratio of videos.</p>
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
            accept="video/*"
          />
          <div className="dropzone-icon"><Icons.Upload /></div>
          <h2>Upload Video</h2>
          <p>Drag and drop your video file here, or click to browse</p>
          <div className="supported">
            <span className="badge">Max 500MB</span>
            <span className="badge accent">MP4, WebM, AVI, MKV</span>
          </div>
        </div>
      )}

      {file && status !== 'success' && (
        <div className="file-config-section">
          <div className="file-bar">
            <div className="file-bar-icon video"><Icons.Video /></div>
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
              <div className="spinner-ring"></div>
              <div className="processing-label">Processing Video...</div>
              <p>This may take a while depending on the video size.</p>
            </div>
          ) : (
            <div className="options-panel">
              
              <div className="section-label"><Icons.Scissors /> Trim Video</div>
              <div className="options-grid">
                <div className="option-group">
                  <label>Start Time (e.g. 00:00:10 or 10)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Leave empty to keep start"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="option-group">
                  <label>Duration (in seconds)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Leave empty to keep rest of video"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="section-label">Dimensions & Resizing</div>
              <div className="options-grid">
                <div className="option-group">
                  <label>Width (px)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Auto"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
                <div className="option-group">
                  <label>Height (px)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Auto"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>

                <div className="option-group full-width">
                  <label style={{ marginBottom: '0.5rem', display: 'block' }}>Aspect Ratio</label>
                  <div className="aspect-chips">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.label}
                        className={`chip ${aspectRatio === ratio.label ? 'active' : ''}`}
                        onClick={() => {
                          setAspectRatio(ratio.label);
                          if (ratio.w && ratio.h && width) {
                            setHeight(Math.round((width / ratio.w) * ratio.h).toString());
                          }
                        }}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section-label">Compression & Format</div>
              <div className="options-grid">
                <div className="option-group">
                  <label>Convert To</label>
                  <select className="select" value={format} onChange={(e) => setFormat(e.target.value)}>
                    <option value="">Keep Original</option>
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

              <button className="btn-process" onClick={handleProcess}>
                Process Video
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'success' && (
        <div className="success-state">
          <div className="success-icon"><Icons.Check /></div>
          <h3>Processing Complete!</h3>
          <p>Your video has been processed and downloaded automatically.</p>
          <button className="btn-new" onClick={resetAll}>Process Another Video</button>
        </div>
      )}
    </div>
  );
}
