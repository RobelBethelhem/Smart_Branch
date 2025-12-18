// Background script for Fayda to Smart Branch extension
console.log('Fayda Extension: Background script loaded');

// Store extracted data temporarily
let extractedData = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.type === 'FAYDA_DATA_EXTRACTED') {
    extractedData = request.data;
    console.log('Stored extracted data:', extractedData);

    // Try to send to Smart Branch app if it's open
    sendToSmartBranch(extractedData)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Failed to send to Smart Branch:', error);
        sendResponse({ success: true, queued: true }); // Still success, but queued
      });

    return true; // Keep message channel open
  }

  if (request.type === 'GET_EXTRACTED_DATA') {
    sendResponse({
      success: true,
      data: extractedData
    });
    return true;
  }

  if (request.type === 'CLEAR_EXTRACTED_DATA') {
    extractedData = null;
    sendResponse({ success: true });
    return true;
  }
});

// Function to send data to Smart Branch app
async function sendToSmartBranch(data) {
  try {
    // Try to find Smart Branch tab (check both port 3000 and 4000)
    let tabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });
    if (tabs.length === 0) {
      tabs = await chrome.tabs.query({ url: 'http://localhost:4000/*' });
    }

    if (tabs.length > 0) {
      // Smart Branch is open, inject script to send message
      for (const tab of tabs) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (data) => {
              window.postMessage({
                type: 'FAYDA_DATA_RECEIVED',
                data: data
              }, '*');
            },
            args: [data]
          });
          console.log('Data sent to Smart Branch tab:', tab.id);
          return true;
        } catch (error) {
          console.error('Failed to send to tab:', tab.id, error);
        }
      }
    }

    // If no tab found or sending failed, store in chrome.storage
    await chrome.storage.local.set({ faydaData: data });
    console.log('Data stored in chrome.storage for later retrieval');
    return true;
  } catch (error) {
    console.error('Error sending to Smart Branch:', error);
    throw error;
  }
}

// Listen for tab updates to detect when Smart Branch opens
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url &&
      (tab.url.startsWith('http://localhost:3000') || tab.url.startsWith('http://localhost:4000'))) {
    // Smart Branch just loaded, check if we have queued data
    const result = await chrome.storage.local.get(['faydaData']);
    if (result.faydaData) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (data) => {
            window.postMessage({
              type: 'FAYDA_DATA_RECEIVED',
              data: data
            }, '*');
          },
          args: [result.faydaData]
        });
        console.log('Queued data sent to newly loaded Smart Branch tab');
        // Clear the queued data
        await chrome.storage.local.remove(['faydaData']);
      } catch (error) {
        console.error('Failed to send queued data:', error);
      }
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Check if we're on Fayda page
  if (tab.url && tab.url.includes('bankpc.fayda.et')) {
    // Extract data from current tab
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_FAYDA_DATA'
      });

      if (response && response.success) {
        extractedData = response;
        await sendToSmartBranch(response);
        console.log('Data extracted and sent');
      }
    } catch (error) {
      console.error('Failed to extract data:', error);
    }
  }
});

console.log('Fayda Extension: Background script ready');
