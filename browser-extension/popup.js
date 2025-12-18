// Popup script for Fayda to Smart Branch extension
console.log('Popup script loaded');

const statusEl = document.getElementById('status');
const extractBtn = document.getElementById('extractBtn');
const viewDataBtn = document.getElementById('viewDataBtn');
const clearBtn = document.getElementById('clearBtn');
const dataPreview = document.getElementById('dataPreview');
const dataContent = document.getElementById('dataContent');

// Update status display
function updateStatus(message, type = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

// Display extracted data
function displayData(data) {
  if (!data || !data.data) {
    dataContent.innerHTML = '<p style="color: #6b7280; text-align: center;">No data available</p>';
    return;
  }

  const fields = data.data;
  let html = '';

  const fieldLabels = {
    firstName: 'First Name',
    middleName: 'Middle Name',
    surname: 'Surname',
    dateOfBirth: 'Date of Birth',
    region: 'Region',
    city: 'City',
    sex: 'Sex',
    zone: 'Zone',
    nationality: 'Nationality',
    woreda: 'Woreda',
    phoneNumber: 'Phone Number',
    idNumber: 'ID Number',
    fullName: 'Full Name',
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (fields[key]) {
      html += `
        <div class="data-item">
          <span class="data-label">${label}:</span>
          <span class="data-value">${fields[key]}</span>
        </div>
      `;
    }
  }

  if (html === '') {
    html = '<p style="color: #6b7280; text-align: center;">No data extracted yet</p>';
  }

  dataContent.innerHTML = html;
}

// Extract data from Fayda tab
async function extractFromFayda() {
  try {
    updateStatus('🔍 Looking for Fayda tab...', 'extracting');
    extractBtn.disabled = true;

    // Find Fayda tab
    const tabs = await chrome.tabs.query({ url: 'https://bankpc.fayda.et/*' });

    if (tabs.length === 0) {
      updateStatus('❌ Fayda tab not found. Please open Fayda first.', 'error');
      extractBtn.disabled = false;
      return;
    }

    updateStatus('📥 Extracting data from Fayda...', 'extracting');

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      type: 'EXTRACT_FAYDA_DATA'
    });

    if (response && response.success) {
      updateStatus('✅ Data extracted successfully!', 'success');
      viewDataBtn.style.display = 'block';
      clearBtn.style.display = 'block';

      // Store data
      await chrome.storage.local.set({ faydaData: response });

      // Send to background for processing
      chrome.runtime.sendMessage({
        type: 'FAYDA_DATA_EXTRACTED',
        data: response
      });

      // Show data preview
      dataPreview.style.display = 'block';
      displayData(response);

      setTimeout(() => {
        updateStatus('✅ Data sent to Smart Branch', 'success');
      }, 1000);
    } else {
      updateStatus('❌ Failed to extract data', 'error');
    }
  } catch (error) {
    console.error('Extraction error:', error);
    updateStatus('❌ Error: ' + error.message, 'error');
  } finally {
    extractBtn.disabled = false;
  }
}

// View extracted data
async function viewExtractedData() {
  const result = await chrome.storage.local.get(['faydaData']);
  if (result.faydaData) {
    dataPreview.style.display = 'block';
    displayData(result.faydaData);
    updateStatus('👁️ Viewing extracted data', 'ready');
  } else {
    updateStatus('ℹ️ No data available', 'idle');
    dataPreview.style.display = 'none';
  }
}

// Clear extracted data
async function clearData() {
  await chrome.storage.local.remove(['faydaData']);
  chrome.runtime.sendMessage({ type: 'CLEAR_EXTRACTED_DATA' });
  updateStatus('🗑️ Data cleared', 'idle');
  dataPreview.style.display = 'none';
  viewDataBtn.style.display = 'none';
  clearBtn.style.display = 'none';
}

// Event listeners
extractBtn.addEventListener('click', extractFromFayda);
viewDataBtn.addEventListener('click', viewExtractedData);
clearBtn.addEventListener('click', clearData);

// Check if data already exists on load
chrome.storage.local.get(['faydaData'], (result) => {
  if (result.faydaData) {
    updateStatus('✅ Data ready to send', 'success');
    viewDataBtn.style.display = 'block';
    clearBtn.style.display = 'block';
  }
});

// Check if Fayda tab is open
chrome.tabs.query({ url: 'https://bankpc.fayda.et/*' }, (tabs) => {
  if (tabs.length > 0) {
    updateStatus('✅ Fayda tab detected - Ready to extract', 'ready');
  } else {
    updateStatus('ℹ️ Please open Fayda tab (download-pdf)', 'idle');
  }
});
