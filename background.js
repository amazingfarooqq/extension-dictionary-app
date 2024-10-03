chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "wordLookup",
      title: "Look up '%s'",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "wordLookup") {
      const selectedText = info.selectionText;
      
      // First, show the tooltip with loading indicator
      await chrome.tabs.sendMessage(tab.id, {
        type: 'showTooltip'
      });
      
      try {
        // Fetch word data
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`);
        const data = await response.json();
        

        
        if (data.length > 0) {
          // Send the result to content script
          await chrome.tabs.sendMessage(tab.id, {
            type: 'displayResult',
            data: data[0]
          });
        }
      } catch (error) {
        console.error('Error fetching word data:', error);
      }
    }
  });