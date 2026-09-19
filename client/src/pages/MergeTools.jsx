import { useState, useRef, useCallback } from 'react';
import { Icons } from '../utils/Icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const API_BASE = 'http://localhost:3001/api/process';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function MergeTools() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle');

  const fileInputRef = useRef(null);

  const resetAll = useCallback(() => {
    setFiles([]);
    setStatus('idle');
  }, []);

  const handleFiles = useCallback((selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    let totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const newFiles = Array.from(selectedFiles);
    
    const validFiles = [];
    for (const f of newFiles) {
      if (totalSize + f.size > 500 * 1024 * 1024) {
        toast.error('Total file size exceeds 500MB limit.');
        setStatus('idle');
        break;
      }
      if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
        toast.error('Only Images and PDFs are supported for merging.');
        setStatus('idle');
        break;
      }
      validFiles.push(f);
      totalSize += f.size;
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setStatus('idle');
    }
  }, [files]);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

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
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleProcess = async () => {
    if (files.length < 2) {
      toast.error('Please upload at least 2 files to merge.');
      setStatus('idle');
      return;
    }
    
    setStatus('processing');

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const response = await fetch(`${API_BASE}/merge`, {
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
      a.download = `merged_document.pdf`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setStatus('success');
      toast.success('Files merged successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
      setStatus('idle');
      toast.error(err.message || 'An error occurred during processing.');
    }
  };

  return (
    <motion.div 
      className="main-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Link to="/" className="btn-back">
        <Icons.ArrowLeft /> Back to Dashboard
      </Link>
      
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <div className="dropzone-icon" style={{margin: '0 auto 1rem', background: '#8b5cf6'}}><Icons.Layers /></div>
        <h2 style={{color: 'var(--blue-900)', fontSize: '1.5rem', fontWeight: 900}}>Merge Images & PDFs</h2>
        <p style={{color: 'var(--dark-muted)'}}>Combine multiple images or PDFs into a single PDF document.</p>
      </div>

      <div
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ padding: '2rem 1rem', marginBottom: '1.5rem' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
          accept="image/*,application/pdf"
          multiple
        />
        <div className="dropzone-icon" style={{background: '#8b5cf6', width: '48px', height: '48px'}}><Icons.Upload /></div>
        <h2 style={{fontSize: '1.1rem'}}>Add Files</h2>
        <div className="supported">
          <span className="badge">Max 500MB Total</span>
          <span className="badge" style={{background: '#8b5cf6'}}>Images & PDFs</span>
        </div>
      </div>

      {files.length > 0 && status !== 'success' && (
        <div className="file-config-section">
          <div className="section-label">Selected Files ({files.length})</div>
          <div className="files-list" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem'}}>
            {files.map((file, idx) => (
              <div key={idx} className="file-bar" style={{marginBottom: 0, padding: '0.5rem 1rem'}}>
                <div className={`file-bar-icon ${file.type.startsWith('image') ? 'image' : 'document'}`} style={{width: '32px', height: '32px'}}>
                  {file.type.startsWith('image') ? <Icons.Image /> : <Icons.Document />}
                </div>
                <div className="file-bar-info">
                  <div className="file-bar-name" style={{fontSize: '0.9rem'}}>{file.name}</div>
                  <div className="file-bar-meta">{formatSize(file.size)}</div>
                </div>
                <button className="file-bar-remove" onClick={() => removeFile(idx)} title="Remove file">
                  <Icons.Trash2 />
                </button>
              </div>
            ))}
          </div>

          {status === 'processing' ? (
            <div className="processing-state">
              <div className="spinner-ring" style={{borderTopColor: '#8b5cf6'}}></div>
              <div className="processing-label">Merging Files...</div>
              <p>Please wait while we combine your files.</p>
            </div>
          ) : (
            <button className="btn-process" onClick={handleProcess} style={{background: '#8b5cf6'}}>
              Merge into PDF
            </button>
          )}
        </div>
      )}

      {status === 'success' && (
        <div className="success-state">
          <div className="success-icon"><Icons.Check /></div>
          <h3>Merging Complete!</h3>
          <p>Your merged PDF has been downloaded automatically.</p>
          <button className="btn-new" onClick={resetAll} style={{borderColor: '#8b5cf6', color: '#8b5cf6'}}>Merge More Files</button>
        </div>
      )}
    </motion.div>
  );
}
