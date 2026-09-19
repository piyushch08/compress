import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Icons } from './utils/Icons';

import Home from './pages/Home';
import ImageTools from './pages/ImageTools';
import VideoTools from './pages/VideoTools';
import PdfTools from './pages/PdfTools';
import MergeTools from './pages/MergeTools';

function App() {
  // Bug report state
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugName, setBugName] = useState('');
  const [bugEmail, setBugEmail] = useState('');
  const [bugMessage, setBugMessage] = useState('');
  const [bugStatus, setBugStatus] = useState('idle'); // idle | sending | sent | error

  return (
    <>
      <header className="app-header">
        <div className="app-logo" style={{ color: '#eab308', background: '#fef08a' }}>
          <Icons.Sunflower style={{ width: '28px', height: '28px' }} />
        </div>
        <h1 className="app-title">SHIZEN - Compress & Convert</h1>
        <p className="app-subtitle">Premium file compression, conversion, and editing</p>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/image" element={<ImageTools />} />
        <Route path="/video" element={<VideoTools />} />
        <Route path="/pdf" element={<PdfTools />} />
        <Route path="/merge" element={<MergeTools />} />
      </Routes>

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
                        _subject: 'Bug Report — Forma Tools',
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
