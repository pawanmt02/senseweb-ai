(function() {
  const STYLE_ID_PREFIX = 'senseweb-profile-';

  // Profile Definitions
  const PROFILES = {
    bionic_reading: {
      apply: applyBionicReading,
      remove: removeBionicReading
    },
    focus_mode: {
      apply: () => document.body.classList.add('senseweb-focus-active'),
      remove: () => document.body.classList.remove('senseweb-focus-active')
    },
    high_contrast: {
      apply: () => injectCSS('high_contrast', `
        body { background: #000 !important; color: #fff !important; }
        a { color: #FFD700 !important; text-decoration: underline !important; }
        h1, h2, h3, h4, h5, h6 { color: #fff !important; }
        input, textarea, select { background: #333 !important; color: #fff !important; border: 1px solid #fff !important; }
        img { filter: invert(1) hue-rotate(180deg); }
      `),
      remove: () => removeCSS('high_contrast')
    },
    dyslexia_friendly: {
      apply: () => injectCSS('dyslexia_friendly', `
        @import url('https://fonts.cdnfonts.com/css/opendyslexic');
        * {
          font-family: 'OpenDyslexic', sans-serif !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
          line-height: 1.8 !important;
        }
      `),
      remove: () => removeCSS('dyslexia_friendly')
    },
    large_text: {
      apply: () => injectCSS('large_text', `
        html { font-size: 150% !important; }
      `),
      remove: () => removeCSS('large_text')
    },
    reduced_motion: {
      apply: () => injectCSS('reduced_motion', `
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      `),
      remove: () => removeCSS('reduced_motion')
    },
    skip_navigation: {
      apply: applySkipNavigation,
      remove: removeSkipNavigation
    },
    focus_indicators: {
      apply: () => injectCSS('focus_indicators', `
        *:focus-visible {
          outline: 3px solid #4A90D9 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 5px rgba(74, 144, 217, 0.3) !important;
        }
      `),
      remove: () => removeCSS('focus_indicators')
    }
  };

  function injectCSS(name, css) {
    if (document.getElementById(STYLE_ID_PREFIX + name)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID_PREFIX + name;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function removeCSS(name) {
    const style = document.getElementById(STYLE_ID_PREFIX + name);
    if (style) style.remove();
  }

  // --- Bionic Reading ---
  function applyBionicReading() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        const p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'b', 'strong'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (p.hasAttribute('data-senseweb-bionic')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      nodesToProcess.push(node);
    }

    nodesToProcess.forEach(textNode => {
      const text = textNode.nodeValue;
      const words = text.split(/(\s+)/);
      const span = document.createElement('span');
      span.setAttribute('data-senseweb-bionic', 'true');
      
      words.forEach(word => {
        if (!word.trim()) {
          span.appendChild(document.createTextNode(word));
        } else {
          const len = word.length;
          const boldLen = Math.ceil(len * 0.4);
          const b = document.createElement('b');
          b.style.fontWeight = '700';
          b.textContent = word.substring(0, boldLen);
          span.appendChild(b);
          span.appendChild(document.createTextNode(word.substring(boldLen)));
        }
      });

      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
  }

  function removeBionicReading() {
    const spans = document.querySelectorAll('span[data-senseweb-bionic="true"]');
    spans.forEach(span => {
      const text = span.textContent;
      const textNode = document.createTextNode(text);
      if (span.parentNode) {
        span.parentNode.replaceChild(textNode, span);
      }
    });
  }

  // --- Skip Navigation ---
  function applySkipNavigation() {
    if (document.getElementById('senseweb-skip-link')) return;
    const link = document.createElement('a');
    link.id = 'senseweb-skip-link';
    link.className = 'senseweb-skip-link';
    link.href = '#';
    link.textContent = 'Skip to Main Content';
    link.setAttribute('data-senseweb-container', 'true');
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.querySelector('main, article, #content, h1');
      if (main) {
        main.tabIndex = -1;
        main.focus();
      }
    });
    
    document.body.insertBefore(link, document.body.firstChild);
  }

  function removeSkipNavigation() {
    const link = document.getElementById('senseweb-skip-link');
    if (link) link.remove();
  }

  // State Management
  let currentProfiles = {};

  function syncProfiles(profiles) {
    for (const [key, enabled] of Object.entries(profiles)) {
      if (PROFILES[key]) {
        if (enabled && !currentProfiles[key]) {
          PROFILES[key].apply();
        } else if (!enabled && currentProfiles[key]) {
          PROFILES[key].remove();
        }
      }
    }
    currentProfiles = { ...profiles };
  }

  // Initialization
  chrome.storage.sync.get(['profiles'], (result) => {
    if (result.profiles) {
      syncProfiles(result.profiles);
    }
  });

  // Listen for changes
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'TOGGLE_PROFILE' && request.payload.profiles) {
      syncProfiles(request.payload.profiles);
    }
  });

})();
