# 🧠 SenseWeb AI

> **AI-powered cognitive web accessibility layer** — dynamically remediates non-compliant web interfaces for users with cognitive, motor, or visual disabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![Chrome Extension MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow.svg)](https://developer.chrome.com/docs/extensions/mv3/)

## 🎯 What is SenseWeb AI?

SenseWeb AI is an open-source, client-side cognitive web accessibility layer. It works as a **Chrome browser extension** backed by an **AI-powered API server** to make any website more accessible — **without requiring source code changes from website owners**.

### Core Features

| Feature | Description |
|---------|-------------|
| 🖼️ **AI Image Captioning** | Automatically generates descriptive alt-text for images that lack accessibility labels using the BLIP vision-language model |
| 📝 **Text Simplification** | Converts complex, jargon-heavy paragraphs into plain-language summaries using FLAN-T5 and DistilBART |
| 🔤 **Bionic Reading** | Bolds the first portion of each word to guide eye tracking for faster, more focused reading |
| 🎯 **Focus Mode** | Dims non-focused paragraphs so users can concentrate on one section at a time |
| 🌗 **High Contrast** | Forces high-contrast colors for users with low vision |
| 📖 **Dyslexia-Friendly** | Applies OpenDyslexic font with optimized letter and word spacing |
| 🔍 **Large Text** | Scales all text by 1.5x without breaking page layouts |
| ⏸️ **Reduced Motion** | Disables all animations and transitions for motion-sensitive users |
| ⌨️ **Skip Navigation** | Injects "Skip to Main Content" links for keyboard-only navigation |
| 🔲 **Focus Indicators** | Adds visible focus outlines for all interactive elements |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Chrome Extension (Client)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Popup   │ │  Side    │ │  Content Scripts  │ │
│  │  (React) │ │  Panel   │ │  (Vanilla JS)     │ │
│  │          │ │  (React) │ │  • DOM Scanner    │ │
│  │  Quick   │ │  Full    │ │  • Image Captioner│ │
│  │  Toggles │ │  Dashboard│ │  • Text Simplifier│ │
│  └────┬─────┘ └────┬─────┘ │  • CSS Profiles   │ │
│       │             │       └────────┬───────────┘ │
│       └──────┬──────┘                │             │
│              │                       │             │
│       ┌──────▼──────────────────────▼───────┐     │
│       │       Service Worker (Background)    │     │
│       │   • API Proxy  • Cache  • Storage    │     │
│       └──────────────────┬───────────────────┘     │
└──────────────────────────┼─────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────▼─────────────────────────┐
│              FastAPI Backend (Server)                │
│  ┌──────────────────────────────────────────────┐   │
│  │  /api/v1/caption   → BLIP Image Captioning   │   │
│  │  /api/v1/simplify  → DistilBART / FLAN-T5    │   │
│  │  /api/v1/profile   → User Preferences        │   │
│  │  /health           → System Status            │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Google Chrome** (latest version)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/senseweb-ai.git
cd senseweb-ai
```

### 2. Start the Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start the server (models download automatically on first run)
python run.py
```

The API server starts at `http://localhost:8000`. Visit `http://localhost:8000/docs` for interactive API documentation.

> **Note:** The first startup will download ~3.2 GB of AI models. Subsequent starts are instant.

### 3. Build the Extension

```bash
cd extension

# Install dependencies
npm install

# Build for production
npm run build
```

### 4. Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder
5. Pin the SenseWeb AI extension to your toolbar

## 📡 API Reference

### `POST /api/v1/caption`

Generate alt-text for an image.

```json
// Request
{
  "image_url": "https://example.com/photo.jpg",
  "context": "Article about climate change"
}

// Response
{
  "caption": "a polar bear standing on a melting ice cap in the arctic ocean",
  "model_used": "Salesforce/blip-image-captioning-base",
  "inference_time_ms": 245.6
}
```

### `POST /api/v1/simplify`

Simplify or summarize complex text.

```json
// Request
{
  "text_block": "The implementation of quantum computing paradigms...",
  "mode": "simplify"
}

// Response
{
  "result_text": "Quantum computing uses special physics rules to solve problems faster...",
  "original_length": 2450,
  "result_length": 312,
  "mode": "simplify",
  "model_used": "google/flan-t5-base",
  "inference_time_ms": 180.3
}
```

### `GET /api/v1/profile?user_id=default`

Retrieve user accessibility preferences.

## 🤖 AI Disclosure

This project uses the following open-source AI/ML models:

| Model | Provider | Purpose | License |
|-------|----------|---------|---------|
| [BLIP](https://huggingface.co/Salesforce/blip-image-captioning-base) | Salesforce | Image captioning for alt-text generation | BSD-3-Clause |
| [DistilBART](https://huggingface.co/sshleifer/distilbart-cnn-12-6) | Hugging Face | Text summarization | Apache-2.0 |
| [FLAN-T5](https://huggingface.co/google/flan-t5-base) | Google | Text simplification | Apache-2.0 |

All AI processing occurs on the self-hosted backend server. **No user data is sent to external AI services.** The browser extension communicates only with your local backend instance.

## 👥 Team

**Team P S** — K. S. Institute of Technology

| Member | Role |
|--------|------|
| Pawan Kumar M T | Lead Developer |
| Sachin M S | Co-Developer |

**Problem Statement:** AI-01 (AI-powered accessibility assistant)

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for open-source model hosting
- [FastAPI](https://fastapi.tiangolo.com/) for the high-performance Python web framework
- [Vite](https://vitejs.dev/) for the blazing-fast build tooling
- The web accessibility community for guidelines and standards (WCAG 2.1)
