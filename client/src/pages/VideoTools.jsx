import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Icons } from '../utils/Icons';
import { Link } from 'react-router-dom';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const API_BASE = 'http://localhost:3001/api/process';

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
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
  const [previewUrl, setPreviewUrl] = useState(null);
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

  // Crop & Video state
  const videoRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const fileInputRef = useRef(null);

  const resetAll = useCallback(() => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setErrorMsg('');
    setWidth('');
    setHeight('');
    setFormat('');
    setVideoBitrate('1000k');
    setAspectRatio(null);
    setStartTime('');
    setDuration('');
    setCrop(undefined);
    setCompletedCrop(null);
    setVideoDuration(0);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    setPreviewUrl(window.URL.createObjectURL(selectedFile));
    setStatus('idle');
    setErrorMsg('');
    setCrop(undefined);
    setCompletedCrop(null);
    setVideoDuration(0);
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

  const onVideoLoadedMetadata = (e) => {
    setVideoDuration(e.currentTarget.duration);
  };

  // Estimate file size based on bitrate and duration
  const estimatedSize = useMemo(() => {
    if (!file) return 0;
    
    // Duration in seconds
    let finalDuration = videoDuration;
    if (duration && !isNaN(parseInt(duration))) {
      finalDuration = parseInt(duration);
    } else if (startTime && !isNaN(parseInt(startTime))) {
      finalDuration = Math.max(0, videoDuration - parseInt(startTime));
    }

    if (finalDuration <= 0) finalDuration = 1;

    // Bitrate calculation
    const kbps = parseInt(videoBitrate.replace('k', ''));
    const bitsPerSec = kbps * 1000;
    const bytesPerSec = bitsPerSec / 8;
    
    // Total video bytes + 10% overhead for audio/container
    const estimatedBytes = (finalDuration * bytesPerSec) * 1.10;
    
    return Math.max(1024, estimatedBytes); // Minimum 1KB
  }, [file, videoDuration, duration, startTime, videoBitrate]);

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

    // Add actual video crop coordinates
    if (completedCrop && videoRef.current && completedCrop.width > 0 && completedCrop.height > 0) {
      const scaleX = videoRef.current.videoWidth / videoRef.current.clientWidth;
      const scaleY = videoRef.current.videoHeight / videoRef.current.clientHeight;
      
      formData.append('cropX', Math.round(completedCrop.x * scaleX));
      formData.append('cropY', Math.round(completedCrop.y * scaleY));
      formData.append('cropWidth', Math.round(completedCrop.width * scaleX));
      formData.append('cropHeight', Math.round(completedCrop.height * scaleY));
    }

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
        <p style={{color: 'var(--dark-muted)'}}>Upload a video to visually crop, trim duration, and compress.</p>
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
              <div className="file-bar-meta">Original: {formatSize(file.size)}</div>
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
              
              <div className="section-label"><Icons.Video /> Visual Review & Cropping</div>
              <div className="visual-editor-container" style={{background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden'}}>
                {previewUrl && (
                  <>
                    <ReactCrop 
                      crop={crop} 
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspectRatio ? (ASPECT_RATIOS.find(r => r.label === aspectRatio)?.w / ASPECT_RATIOS.find(r => r.label === aspectRatio)?.h) : undefined}
                      style={{ marginBottom: '1rem' }}
                    >
                      <video 
                        ref={videoRef}
                        src={previewUrl} 
                        onLoadedMetadata={onVideoLoadedMetadata}
                        controls
                        style={{ maxHeight: '400px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </ReactCrop>
                    <p style={{color: 'var(--dark-muted)', fontSize: '0.85rem', textAlign: 'center'}}>
                      Drag the edges to crop the video frame. Use the video controls to review content and find trim times.
                    </p>
                  </>
                )}
              </div>

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
                    placeholder="Leave empty to keep rest"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="section-label">Dimensions & Resizing</div>
              <div className="options-grid">
                <div className="option-group">
                  <label>Final Width (px)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Auto"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
                <div className="option-group">
                  <label>Final Height (px)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Auto"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>

                <div className="option-group full-width">
                  <label style={{ marginBottom: '0.5rem', display: 'block' }}>Crop Aspect Ratio</label>
                  <div className="aspect-chips">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.label}
                        className={`chip ${aspectRatio === ratio.label ? 'active' : ''}`}
                        onClick={() => setAspectRatio(ratio.label)}
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

              <div className="estimation-badge" style={{textAlign: 'center', marginBottom: '1rem', background: 'var(--blue-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--blue-900)', fontWeight: 700}}>
                Estimated Output Size: ~{formatSize(estimatedSize)}
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
