import Head from 'next/head';
import { useState, useEffect } from 'react';

const API = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

export default function Home() {
  const [activeTab, setActiveTab] = useState('caption');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [deviceInfo, setDeviceInfo] = useState('');

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus('checking');
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        setBackendStatus('connected');
        setDeviceInfo(data.device || 'cpu');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  return (
    <>
      <Head>
        <title>SenseWeb AI — Accessibility Dashboard</title>
        <meta name="description" content="AI-powered cognitive web accessibility assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>" />
      </Head>

      <div className="app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <span className="logo-icon">🧠</span>
            <div>
              <h1>SenseWeb AI</h1>
              <span className="tagline">Accessibility Assistant</span>
            </div>
          </div>

          <nav className="nav">
            {[
              { id: 'caption', icon: '🖼️', label: 'Image Captioning' },
              { id: 'simplify', icon: '📝', label: 'Text Simplifier' },
              { id: 'profiles', icon: '⚙️', label: 'CSS Profiles' },
              { id: 'about', icon: 'ℹ️', label: 'About' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className={`status-card ${backendStatus}`} onClick={checkBackend}>
              <span className="status-dot"></span>
              <div>
                <span className="status-label">
                  {backendStatus === 'connected' ? 'Backend Online' : backendStatus === 'checking' ? 'Checking...' : 'Backend Offline'}
                </span>
                {backendStatus === 'connected' && <span className="status-detail">Device: {deviceInfo}</span>}
                {backendStatus === 'offline' && <span className="status-detail">Click to retry</span>}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="content">
          {backendStatus === 'offline' && activeTab !== 'profiles' && activeTab !== 'about' && (
            <div className="offline-banner">
              <span className="banner-icon">⚡</span>
              <div>
                <strong>Backend is offline</strong>
                <p>Start it with: <code>cd backend → python run.py</code></p>
              </div>
              <button className="retry-btn" onClick={checkBackend}>↻ Retry</button>
            </div>
          )}

          {activeTab === 'caption' && <CaptionPanel status={backendStatus} />}
          {activeTab === 'simplify' && <SimplifyPanel status={backendStatus} />}
          {activeTab === 'profiles' && <ProfilesPanel />}
          {activeTab === 'about' && <AboutPanel />}
        </main>
      </div>
    </>
  );
}

/* ─── Image Captioning Panel ─── */
function CaptionPanel({ status }) {
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState(null);

  const handleCaption = async () => {
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError('');
    setCaption('');
    setPreview(imageUrl);

    try {
      const res = await fetch('/api/v1/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setCaption(data.caption);
        setTime(data.inference_time_ms);
      } else {
        setError(data.detail || 'Failed to generate caption');
      }
    } catch {
      setError('Cannot connect to backend. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>🖼️ AI Image Captioning</h2>
        <p className="panel-desc">Paste an image URL to generate accessible alt-text using the BLIP vision model.</p>
      </div>

      <div className="input-group">
        <label>Image URL</label>
        <div className="input-row">
          <input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCaption()}
          />
          <button className="action-btn primary" onClick={handleCaption} disabled={loading || status !== 'connected'}>
            {loading ? '⏳ Generating...' : '✨ Generate Caption'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="preview-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={caption || 'Preview'} onError={() => setPreview('')} />
        </div>
      )}

      {error && <div className="result-card error"><span>❌</span> {error}</div>}

      {caption && (
        <div className="result-card success">
          <h3>Generated Alt-Text</h3>
          <p className="caption-text">&quot;{caption}&quot;</p>
          <div className="result-meta">
            <span>⏱️ {time?.toFixed(0)}ms</span>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(caption)}>📋 Copy</button>
          </div>
          <div className="code-preview">
            <code>&lt;img src=&quot;...&quot; alt=&quot;{caption}&quot; /&gt;</code>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Text Simplifier Panel ─── */
function SimplifyPanel({ status }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('simplify');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);

  const handleProcess = async () => {
    if (!text.trim() || text.length < 10) return;
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/v1/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_block: text, mode })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result_text);
        setMeta(data);
      } else {
        setError(data.detail || 'Failed to process text');
      }
    } catch {
      setError('Cannot connect to backend. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>📝 Text Simplifier & Summarizer</h2>
        <p className="panel-desc">Paste complex text to get a simplified or summarized version for better readability.</p>
      </div>

      <div className="mode-toggle">
        <button className={`mode-btn ${mode === 'simplify' ? 'active' : ''}`} onClick={() => setMode('simplify')}>
          📖 Simplify
        </button>
        <button className={`mode-btn ${mode === 'summarize' ? 'active' : ''}`} onClick={() => setMode('summarize')}>
          📋 Summarize
        </button>
      </div>

      <div className="input-group">
        <label>Input Text <span className="char-count">{text.length} chars</span></label>
        <textarea
          placeholder="Paste complex text here..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
        />
        <button className="action-btn primary full" onClick={handleProcess} disabled={loading || text.length < 10 || status !== 'connected'}>
          {loading ? '⏳ Processing...' : mode === 'simplify' ? '✨ Simplify Text' : '✨ Summarize Text'}
        </button>
      </div>

      {error && <div className="result-card error"><span>❌</span> {error}</div>}

      {result && (
        <div className="result-card success">
          <h3>{mode === 'simplify' ? 'Simplified Text' : 'Summary'}</h3>
          <p className="result-text">{result}</p>
          <div className="result-meta">
            <span>⏱️ {meta?.inference_time_ms?.toFixed(0)}ms</span>
            <span>📏 {meta?.original_length} → {meta?.result_length} chars</span>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(result)}>📋 Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CSS Profiles Panel ─── */
function ProfilesPanel() {
  const profiles = [
    { key: 'bionic_reading', icon: '📖', name: 'Bionic Reading', desc: 'Bolds the first portion of each word to guide eye tracking.' },
    { key: 'focus_mode', icon: '🎯', name: 'Focus Mode', desc: 'Dims non-focused paragraphs so you can concentrate on one section.' },
    { key: 'high_contrast', icon: '🌗', name: 'High Contrast', desc: 'White text on black background with gold links.' },
    { key: 'dyslexia_friendly', icon: '🔤', name: 'Dyslexia Friendly', desc: 'OpenDyslexic font with wider spacing.' },
    { key: 'large_text', icon: '🔍', name: 'Large Text', desc: 'Increases all text by 150%.' },
    { key: 'reduced_motion', icon: '⏸️', name: 'Reduced Motion', desc: 'Disables animations and transitions.' },
    { key: 'skip_navigation', icon: '⌨️', name: 'Skip Navigation', desc: 'Adds "Skip to Main Content" link.' },
    { key: 'focus_indicators', icon: '🔲', name: 'Focus Indicators', desc: 'Visible focus ring on interactive elements.' },
  ];

  const [active, setActive] = useState({});

  const toggle = (key) => {
    const newState = !active[key];
    setActive(prev => ({ ...prev, [key]: newState }));
    applyProfileToPage(key, newState);
  };

  const applyProfileToPage = (key, enabled) => {
    const styleId = `senseweb-demo-${key}`;
    if (!enabled) {
      document.getElementById(styleId)?.remove();
      if (key === 'bionic_reading') {
        document.querySelectorAll('[data-bionic-applied]').forEach(el => {
          el.textContent = el.textContent;
          delete el.dataset.bionicApplied;
        });
      }
      if (key === 'skip_navigation') document.getElementById('senseweb-skip-link')?.remove();
      return;
    }

    const css = {
      focus_mode: `body p { opacity: 0.3 !important; transition: opacity 0.2s; } body p:hover { opacity: 1 !important; }`,
      high_contrast: `body { background: #000 !important; color: #fff !important; } a { color: #FFD700 !important; } .sidebar { background: #111 !important; } .content { background: #000 !important; }`,
      dyslexia_friendly: `@import url('https://fonts.cdnfonts.com/css/opendyslexic'); * { font-family: 'OpenDyslexic', sans-serif !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; line-height: 1.8 !important; }`,
      large_text: `html { font-size: 150% !important; }`,
      reduced_motion: `*, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }`,
      focus_indicators: `*:focus-visible { outline: 3px solid #4A90D9 !important; outline-offset: 2px !important; box-shadow: 0 0 0 5px rgba(74,144,217,0.3) !important; }`,
    };

    if (css[key]) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = css[key];
      document.head.appendChild(style);
    }

    if (key === 'bionic_reading') {
      document.querySelectorAll('.panel-desc, .result-text, .profile-desc').forEach(el => {
        if (el.dataset.bionicApplied) return;
        el.dataset.bionicApplied = 'true';
        el.innerHTML = el.textContent.replace(/\b(\w+)\b/g, (word) => {
          const boldLen = Math.ceil(word.length * 0.4);
          return `<b>${word.slice(0, boldLen)}</b>${word.slice(boldLen)}`;
        });
      });
    }

    if (key === 'skip_navigation') {
      const link = document.createElement('a');
      link.id = 'senseweb-skip-link';
      link.href = '#';
      link.textContent = 'Skip to Main Content';
      link.style.cssText = 'position:fixed;top:0;left:0;background:#000;color:#fff;padding:8px 16px;z-index:999999;font-weight:bold;text-decoration:none;';
      document.body.prepend(link);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>⚙️ Accessibility Profiles</h2>
        <p className="panel-desc">Toggle profiles to preview them live on this page. No backend needed — pure CSS/JS.</p>
      </div>

      <div className="profiles-grid">
        {profiles.map(p => (
          <div key={p.key} className={`profile-card ${active[p.key] ? 'enabled' : ''}`} onClick={() => toggle(p.key)}>
            <div className="profile-top">
              <span className="profile-icon">{p.icon}</span>
              <div className={`toggle-dot ${active[p.key] ? 'on' : ''}`}></div>
            </div>
            <h3>{p.name}</h3>
            <p className="profile-desc">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── About Panel ─── */
function AboutPanel() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>ℹ️ About SenseWeb AI</h2>
        <p className="panel-desc">AI-powered cognitive web accessibility layer.</p>
      </div>

      <div className="about-section">
        <h3>🎯 Problem Statement</h3>
        <p>AI-01: AI-powered accessibility assistant</p>
      </div>

      <div className="about-section">
        <h3>👥 Team P S</h3>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar">PK</div>
            <div><strong>Pawan Kumar M T</strong><br/>Lead Developer</div>
          </div>
          <div className="team-card">
            <div className="team-avatar">SM</div>
            <div><strong>Sachin M S</strong><br/>Co-Developer</div>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h3>🏛️ Institution</h3>
        <p>K. S. Institute of Technology</p>
      </div>

      <div className="about-section">
        <h3>🤖 AI Models Used</h3>
        <table className="about-table">
          <thead><tr><th>Model</th><th>Purpose</th><th>License</th></tr></thead>
          <tbody>
            <tr><td>BLIP (Salesforce)</td><td>Image Captioning</td><td>BSD-3</td></tr>
            <tr><td>DistilBART</td><td>Summarization</td><td>Apache-2.0</td></tr>
            <tr><td>FLAN-T5 (Google)</td><td>Simplification</td><td>Apache-2.0</td></tr>
          </tbody>
        </table>
      </div>

      <div className="about-section">
        <h3>📄 License</h3>
        <p>MIT — Open Source</p>
      </div>
    </div>
  );
}
