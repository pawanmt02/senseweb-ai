(function() {
  const MESSAGE_TYPES = {
    CAPTION_IMAGE: 'CAPTION_IMAGE',
    SIMPLIFY_TEXT: 'SIMPLIFY_TEXT',
    GET_PROFILE: 'GET_PROFILE',
    TOGGLE_PROFILE: 'TOGGLE_PROFILE',
    SCAN_PAGE: 'SCAN_PAGE'
  };

  let lastUrl = location.href;
  let scanTimeout = null;

  function processNewElements() {
    const images = Array.from(document.querySelectorAll('img:not([data-senseweb-processed])'));
    
    // Find uncaptioned images
    images.forEach(img => {
      img.setAttribute('data-senseweb-processed', 'true');
      const alt = img.getAttribute('alt');
      const hasBadAlt = !alt || alt.trim() === '' || /^\w+_\d+\.(jpg|png|jpeg|gif)$/i.test(alt);
      
      if (hasBadAlt) {
        img.setAttribute('data-senseweb-needs-caption', 'true');
      }
    });

    // Find dense text blocks
    const paragraphs = Array.from(document.querySelectorAll('p:not([data-senseweb-processed])'));
    paragraphs.forEach(p => {
      p.setAttribute('data-senseweb-processed', 'true');
      const text = p.innerText || p.textContent;
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount > 150) {
        p.setAttribute('data-senseweb-dense-text', 'true');
      }
    });

    // Dispatch event for other scripts
    document.dispatchEvent(new CustomEvent('senseweb:dom-updated'));
  }

  const observer = new MutationObserver((mutations) => {
    // Filter out our own mutations
    const hasRelevantMutation = mutations.some(m => {
      if (m.type !== 'childList') return false;
      const node = m.target;
      if (node.hasAttribute && node.hasAttribute('data-senseweb-container')) return false;
      return true;
    });

    if (!hasRelevantMutation) return;

    // Check SPA navigation
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      document.querySelectorAll('[data-senseweb-processed]').forEach(el => {
        el.removeAttribute('data-senseweb-processed');
      });
    }

    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
      requestAnimationFrame(processNewElements);
    }, 200);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial scan
  requestAnimationFrame(processNewElements);

  // Listen for manual scans
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === MESSAGE_TYPES.SCAN_PAGE) {
      document.querySelectorAll('[data-senseweb-processed]').forEach(el => {
        el.removeAttribute('data-senseweb-processed');
      });
      requestAnimationFrame(processNewElements);
      sendResponse({ status: 'scanned' });
    }
  });

})();
