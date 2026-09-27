(function() {
  const MESSAGE_TYPES = {
    SIMPLIFY_TEXT: 'SIMPLIFY_TEXT'
  };

  let enabled = true;

  function injectSimplifyButtons() {
    if (!enabled) return;

    const denseTexts = document.querySelectorAll('p[data-senseweb-dense-text]:not([data-senseweb-has-btn])');
    
    denseTexts.forEach(p => {
      p.setAttribute('data-senseweb-has-btn', 'true');
      
      const btn = document.createElement('button');
      btn.className = 'senseweb-simplify-btn';
      btn.innerText = '✨ Simplify';
      btn.setAttribute('data-senseweb-container', 'true');
      btn.setAttribute('aria-label', 'Simplify text with AI');
      
      // Position relatively
      p.style.position = 'relative';
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (btn.classList.contains('loading')) return;
        
        btn.classList.add('loading');
        btn.innerText = '⏳ Simplifying...';
        
        const textBlock = p.innerText || p.textContent;
        
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.SIMPLIFY_TEXT,
          payload: { text_block: textBlock, mode: 'simplify' }
        }, (response) => {
          btn.classList.remove('loading');
          btn.innerText = '✨ Simplify';
          
          if (response && response.result_text) {
            showSimplifiedText(p, response.result_text);
            btn.style.display = 'none'; // Hide button after success
          } else {
            btn.innerText = '❌ Failed';
            setTimeout(() => { btn.innerText = '✨ Simplify'; }, 2000);
          }
        });
      });

      p.appendChild(btn);
    });
  }

  function showSimplifiedText(originalElement, simplifiedText) {
    const container = document.createElement('div');
    container.className = 'senseweb-simplified';
    container.setAttribute('data-senseweb-container', 'true');
    
    const textNode = document.createElement('p');
    textNode.innerText = simplifiedText;
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'senseweb-simplified-toggle';
    toggleBtn.innerText = 'Show Original';
    
    let showingOriginal = false;
    
    toggleBtn.addEventListener('click', () => {
      showingOriginal = !showingOriginal;
      if (showingOriginal) {
        originalElement.style.display = '';
        textNode.style.display = 'none';
        toggleBtn.innerText = 'Show Simplified';
      } else {
        originalElement.style.display = 'none';
        textNode.style.display = '';
        toggleBtn.innerText = 'Show Original';
      }
    });

    container.appendChild(textNode);
    container.appendChild(toggleBtn);
    
    originalElement.parentNode.insertBefore(container, originalElement.nextSibling);
    originalElement.style.display = 'none'; // Hide original by default
  }

  document.addEventListener('senseweb:dom-updated', () => {
    requestAnimationFrame(injectSimplifyButtons);
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'TOGGLE_PROFILE' && request.payload.profiles) {
      enabled = true; // Could be tied to a specific profile
    }
  });

})();
