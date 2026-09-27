import React, { useState, useEffect } from 'react';
import { MESSAGE_TYPES, PROFILE_KEYS, PROFILE_LABELS } from '../shared/constants';

// Profiles that work without the backend (pure CSS/JS injection)
const CLIENT_ONLY_PROFILES = [
  'bionic_reading', 'focus_mode', 'high_contrast', 'dyslexia_friendly',
  'large_text', 'reduced_motion', 'skip_navigation', 'focus_indicators'
];

// Profiles that require the backend AI server
const AI_PROFILES = ['caption_images', 'simplify_text'];

// Icons for each profile
const PROFILE_ICONS = {
  bionic_reading: '📖',
  focus_mode: '🎯',
  high_contrast: '🌗',
  dyslexia_friendly: '🔤',
  large_text: '🔍',
  reduced_motion: '⏸️',
  skip_navigation: '⌨️',
  focus_indicators: '🔲'
};

function App() {
  const [status, setStatus] = useState('checking');
  const [profiles, setProfiles] = useState({});
  const [tabInfo, setTabInfo] = useState({ title: '', url: '' });
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // Check backend status
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS }, (response) => {
      setStatus(response?.status || 'offline');
    });

    // Get current profiles
    chrome.storage.sync.get(['profiles'], (result) => {
      setProfiles(result.profiles || {});
    });

    // Get active tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setTabInfo({ title: tabs[0].title, url: tabs[0].url });
      }
    });
  }, []);

  const toggleProfile = (key) => {
    const newValue = !profiles[key];
    setProfiles(prev => ({ ...prev, [key]: newValue }));
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TOGGLE_PROFILE,
      payload: { profile: key, enabled: newValue }
    });
  };

  const handleScan = () => {
    setScanning(true);
    setScanResult(null);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: MESSAGE_TYPES.SCAN_PAGE }, (response) => {
          setScanning(false);
          setScanResult(response?.status === 'scanned' ? 'Done! Page scanned.' : 'Could not scan this page.');
          setTimeout(() => setScanResult(null), 3000);
        });
      }
    });
  };

  const openDashboard = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId });
      }
    });
  };

  const retryConnection = () => {
    setStatus('checking');
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS }, (response) => {
      setStatus(response?.status || 'offline');
    });
  };

  return (
    <div className="popup-container">
      <header className="header">
        <div className="header-left">
          <h1>🧠 SenseWeb AI</h1>
          <span className="version">v1.0.0</span>
        </div>
        <div className={`status-badge ${status}`} onClick={status === 'offline' ? retryConnection : undefined}>
          <span className="status-dot"></span>
          <span className="status-text">
            {status === 'checking' ? 'Checking...' : status === 'connected' ? 'AI Online' : 'AI Offline'}
          </span>
        </div>
      </header>

      {/* Backend offline banner */}
      {status === 'offline' && (
        <div className="offline-banner">
          <div className="offline-icon">⚡</div>
          <div className="offline-content">
            <p className="offline-title">AI Backend Offline</p>
            <p className="offline-desc">CSS profiles work without the backend. For AI captioning & text simplification, start the server:</p>
            <code className="offline-cmd">cd backend → python run.py</code>
          </div>
          <button className="retry-btn" onClick={retryConnection}>↻ Retry</button>
        </div>
      )}

      {/* Current page */}
      <div className="page-info">
        <span className="page-icon">🌐</span>
        <p className="truncate">{tabInfo.title || 'Unknown Page'}</p>
      </div>

      {/* Actions */}
      <div className="actions">
        <button className="primary-btn" onClick={handleScan} disabled={scanning}>
          {scanning ? '⏳ Scanning...' : '🔍 Scan Page'}
        </button>
        <button className="secondary-btn" onClick={openDashboard}>
          📊 Dashboard
        </button>
      </div>

      {/* Scan result toast */}
      {scanResult && (
        <div className="toast">{scanResult}</div>
      )}

      {/* Profile toggles */}
      <div className="profiles-list">
        <h3>Accessibility Profiles</h3>
        <p className="profiles-hint">These work instantly — no backend needed</p>
        {PROFILE_KEYS.map(key => (
          <label key={key} className="toggle-row">
            <div className="toggle-label">
              <span className="profile-icon">{PROFILE_ICONS[key] || '⚙️'}</span>
              <span className="label-text">{PROFILE_LABELS[key]}</span>
            </div>
            <div className="switch">
              <input
                type="checkbox"
                checked={!!profiles[key]}
                onChange={() => toggleProfile(key)}
              />
              <span className="slider"></span>
            </div>
          </label>
        ))}
      </div>

      {/* AI features section */}
      <div className="ai-section">
        <h3>AI Features</h3>
        {status === 'connected' ? (
          <p className="ai-hint success">✅ Backend connected — AI features active</p>
        ) : (
          <p className="ai-hint warning">⚠️ Start backend for these features</p>
        )}
        <div className="ai-feature-list">
          <div className={`ai-feature ${status === 'connected' ? 'active' : 'inactive'}`}>
            <span>🖼️ Auto Image Captioning</span>
            <span className="feature-status">{status === 'connected' ? 'Active' : 'Offline'}</span>
          </div>
          <div className={`ai-feature ${status === 'connected' ? 'active' : 'inactive'}`}>
            <span>📝 Text Simplification</span>
            <span className="feature-status">{status === 'connected' ? 'Active' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
