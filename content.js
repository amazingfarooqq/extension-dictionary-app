let tooltip = null;

async function fetchTranslations(text, languages) {
  const translations = {};
  
  // Using LibreTranslate API (you'll need to set up your own instance or use a different translation API)
  for (const lang of languages) {
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: lang
        })
      });
      
      const data = await response.json();
      if (data.translatedText) {
        translations[lang] = data.translatedText;
      }
    } catch (error) {
      console.error(`Error translating to ${lang}:`, error);
    }
  }
  
  return translations;
}

function createTooltip(x, y) {
  removeTooltip(); // Remove any existing tooltip
  
  tooltip = document.createElement('div');
  tooltip.className = 'word-lookup-tooltip';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  
  // Add close button
  const closeBtn = document.createElement('div');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = removeTooltip;
  tooltip.appendChild(closeBtn);
  
  // Add loading spinner
  const loading = document.createElement('div');
  loading.className = 'loading';
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  loading.appendChild(spinner);
  tooltip.appendChild(loading);
  
  document.body.appendChild(tooltip);
  
  // Position adjustment if tooltip goes off-screen
  const rect = tooltip.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  
  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${window.innerWidth - rect.width - 20 + scrollX}px`;
  }
  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - 10}px`;
  }
}

function removeTooltip() {
  if (tooltip && tooltip.parentElement) {
    tooltip.parentElement.removeChild(tooltip);
    tooltip = null;
  }
}

function displayResult(wordData) {
  if (!tooltip) return;
  
  // Clear loading spinner
  tooltip.innerHTML = '';
  
  // Add close button
  const closeBtn = document.createElement('div');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '×';
  closeBtn.onclick = removeTooltip;
  tooltip.appendChild(closeBtn);
  
  // Word and phonetic
  const wordElement = document.createElement('div');
  wordElement.className = 'word';
  wordElement.textContent = wordData.word;
  tooltip.appendChild(wordElement);

  if (wordData.phonetic) {
    const phoneticElement = document.createElement('div');
    phoneticElement.className = 'phonetic';
    phoneticElement.textContent = wordData.phonetic;
    tooltip.appendChild(phoneticElement);
  }

  // Meanings
  wordData.meanings.slice(0, 2).forEach(meaning => {
    const meaningDiv = document.createElement('div');
    meaningDiv.className = 'meaning';

    const posElement = document.createElement('div');
    posElement.className = 'part-of-speech';
    posElement.textContent = meaning.partOfSpeech;
    meaningDiv.appendChild(posElement);

    meaning.definitions.slice(0, 2).forEach(def => {
      const definitionElement = document.createElement('div');
      definitionElement.className = 'definition';
      definitionElement.textContent = `• ${def.definition}`;
      meaningDiv.appendChild(definitionElement);

      if (def.example) {
        const exampleElement = document.createElement('div');
        exampleElement.className = 'example';
        exampleElement.textContent = `Example: "${def.example}"`;
        meaningDiv.appendChild(exampleElement);
      }
    });

    tooltip.appendChild(meaningDiv);
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'showTooltip') {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    createTooltip(
      window.scrollX + rect.left,
      window.scrollY + rect.bottom + 10
    );
  } else if (message.type === 'displayResult') {
    displayResult(message.data);
  }
});

// Close tooltip when clicking outside
document.addEventListener('click', (e) => {
  if (tooltip && !tooltip.contains(e.target)) {
    removeTooltip();
  }
});