import React, { useState, useEffect } from 'react';
import { MESSAGE_TYPES, PROFILE_KEYS, PROFILE_LABELS } from '../shared/constants';

const PROFILE_ICONS = {
  bionic_reading: '📖', focus_mode: '🎯', high_contrast: '🌗',
  dyslexia_friendly: '🔤', large_text: '🔍', reduced_motion: '⏸️',
  skip_navigation: '⌨️', focus_indicators: '🔲'
};

const PROFILE_DESCRIPTIONS = {
  bionic_reading: 'Highlights initial letters of words to guide the eye for faster reading.',
  focus_mode: 'Dims surrounding paragraphs so you can focus on one section at a time.',
  high_contrast: 'Applies a dark, high-contrast theme with white text on black background.',
  dyslexia_friendly: 'Switches to OpenDyslexic font with wider letter and word spacing.',
  large_text: 'Increases all text size by 150% without breaking page layouts.',
  reduced_motion: 'Disables CSS animations, transitions, and smooth scrolling.',
  skip_navigation: 'Adds a hidden "Skip to Main Content" link for keyboard navigation.',
  focus_indicators: 'Enhances the visible focus ring around buttons, links, and inputs.'
};

function SidePanel() {
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles, setProfiles] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [status, setStatus] = useState('checking');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [cacheCount, setCacheCount] = useState(0);

  useEffect(() => {
    // Load profiles
    chrome.storage.sync.get(['profiles'], (result) => {
      setProfiles(result.profiles || {});
    });

    // Check backend
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS }, (response) => {
      setStatus(response?.status || 'offline');
    });

    // Load activity log
    chrome.storage.local.get(['activity_log'], (result) => {
      setActivityLog(result.activity_log || []);
    });

    // Count cache entries
    chrome.storage.local.get(null, (items) => {
      const count = Object.keys(items).filter(k => k.startsWith('senseweb_cache_')).length;
      setCacheCount(count);
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

  const enableAll = () => {
    const all = {};
    PROFILE_KEYS.forEach(k => all[k] = true);
    setProfiles(all);
    PROFILE_KEYS.forEach(key => {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.TOGGLE_PROFILE,
        payload: { profile: key, enabled: true }
      });
    });
  };

  const disableAll = () => {
    const all = {};
    PROFILE_KEYS.forEach(k => all[k] = false);
    setProfiles(all);
    PROFILE_KEYS.forEach(key => {
      chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.TOGGLE_PROFILE,
        payload: { profile: key, enabled: false }
      });
    });
  };

  const clearCache = () => {
    chrome.storage.local.get(null, (items) => {
      const cacheKeys = Object.keys(items).filter(k => k.startsWith('senseweb_cache_'));
      if (cacheKeys.length > 0) {
        chrome.storage.local.remove(cacheKeys, () => {
          setCacheCount(0);
        });
      }
    });
  };

  const retryConnection = () => {
    setStatus('checking');
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS }, (response) => {
      setStatus(response?.status || 'offline');
    });
  };

  const activeCount = PROFILE_KEYS.filter(k => profiles[k]).length;

  return (
    <div className="sidepanel-container">
      {/* Header */}
      <header className="sp-header">
        <div className="sp-header-top">
          <h1>🧠 SenseWeb AI</h1>
          <div className={`status-pill ${status}`} onClick={status === 'offline' ? retryConnection : undefined}>
            <span className="pill-dot"></span>
            {status === 'checking' ? 'Checking...' : status === 'connected' ? 'AI Online' : 'AI Offline'}
          </div>
        </div>
        {status === 'offline' && (
          <div className="sp-offline-hint">
            <span>⚡ CSS profiles work offline. Start <code>python run.py</code> for AI features.</span>
            <button className="sp-retry" onClick={retryConnection}>Retry</button>
          </div>
        )}
        <div className="sp-stats">
          <span className="stat">{activeCount} / {PROFILE_KEYS.length} profiles active</span>
          <span className="stat">{cacheCount} cached results</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        {['profiles', 'activity', 'settings'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'profiles' && '⚙️ '}
            {tab === 'activity' && '📋 '}
            {tab === 'settings' && '🔧 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="tab-content">

        {/* ─── Profiles Tab ─── */}
        {activeTab === 'profiles' && (
          <div className="profiles-tab">
            <div className="bulk-actions">
              <button className="bulk-btn" onClick={enableAll}>Enable All</button>
              <button className="bulk-btn" onClick={disableAll}>Disable All</button>
            </div>

            {PROFILE_KEYS.map(key => (
              <div key={key} className={`profile-card ${profiles[key] ? 'enabled' : ''}`}>
                <div className="profile-header">
                  <div className="profile-title">
                    <span className="profile-icon">{PROFILE_ICONS[key]}</span>
                    <h3>{PROFILE_LABELS[key]}</h3>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={!!profiles[key]}
                      onChange={() => toggleProfile(key)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="profile-desc">{PROFILE_DESCRIPTIONS[key]}</p>
              </div>
            ))}
          </div>
        )}

        {/* ─── Activity Tab ─── */}
        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h3>Recent AI Actions</h3>
            {activityLog.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No activity yet</p>
                <p className="empty-hint">AI captioning and simplification results will appear here.</p>
              </div>
            ) : (
              <ul className="activity-list">
                {activityLog.map((log, i) => (
                  <li key={i} className="activity-item">
                    <div className="activity-icon">
                      {log.type === 'caption' ? '🖼️' : '📝'}
                    </div>
                    <div className="activity-details">
                      <p className="activity-text">{log.text}</p>
                      <span className="activity-time">
                        {new Date(log.time).toLocaleTimeString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            {/* Connection Status */}
            <div className="setting-card">
              <h3>🔌 Backend Connection</h3>
              <div className={`connection-status ${status}`}>
                <span className="conn-dot"></span>
                <span>{status === 'connected' ? 'Connected to ' + backendUrl : 'Not connected'}</span>
              </div>
              {status === 'offline' && (
                <div className="setup-guide">
                  <p>Start the AI backend:</p>
                  <div className="code-block">
                    <code>cd backend</code>
                    <code>.venv\Scripts\activate</code>
                    <code>python run.py</code>
                  </div>
                  <button className="action-btn primary" onClick={retryConnection}>
                    ↻ Check Connection
                  </button>
                </div>
              )}
            </div>

            {/* Cache Management */}
            <div className="setting-card">
              <h3>💾 Cache Management</h3>
              <p className="setting-desc">
                {cacheCount} cached AI results stored locally. Clearing cache will re-process images and text on next visit.
              </p>
              <button className="action-btn danger" onClick={clearCache}>
                🗑️ Clear Cache ({cacheCount} items)
              </button>
            </div>

            {/* About */}
            <div className="setting-card">
              <h3>ℹ️ About</h3>
              <div className="about-grid">
                <span className="about-label">Version</span><span>1.0.0</span>
                <span className="about-label">Team</span><span>P S (Pawan & Sachin)</span>
                <span className="about-label">Institution</span><span>K.S. Institute of Technology</span>
                <span className="about-label">License</span><span>MIT (Open Source)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SidePanel;
