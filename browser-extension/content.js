// Content script for extracting Fayda Ethiopian Digital ID data
console.log('Fayda Data Extractor: Content script loaded');

// Function to wait for elements to be available
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Function to extract text by label
function extractByLabel(labelText) {
  // Try to find by label text
  const labels = Array.from(document.querySelectorAll('label, span, div, td, th'));
  const label = labels.find(el =>
    el.textContent.toLowerCase().includes(labelText.toLowerCase())
  );

  if (label) {
    // Try to find the value in various ways
    // 1. Next sibling
    if (label.nextElementSibling) {
      return label.nextElementSibling.textContent.trim();
    }
    // 2. Parent's next sibling
    if (label.parentElement && label.parentElement.nextElementSibling) {
      return label.parentElement.nextElementSibling.textContent.trim();
    }
    // 3. Same row in table
    const row = label.closest('tr');
    if (row) {
      const cells = row.querySelectorAll('td');
      if (cells.length > 1) {
        return cells[1].textContent.trim();
      }
    }
  }
  return null;
}

// Function to extract all possible data patterns
function extractFaydaData() {
  console.log('Extracting Fayda data...');

  // Try multiple extraction strategies
  const data = {
    firstName: null,
    middleName: null,
    surname: null,
    dateOfBirth: null,
    region: null,
    city: null,
    sex: null,
    zone: null,
    nationality: null,
    woreda: null,
    phoneNumber: null,

    // Additional fields that might be useful
    idNumber: null,
    fullName: null,
    address: null,
  };

  // Strategy 1: Extract by common label patterns
  const labelMappings = {
    firstName: ['first name', 'given name', 'name', 'የመጀመሪያ ስም'],
    middleName: ['middle name', 'father name', 'የአባት ስም', 'fathers name'],
    surname: ['surname', 'last name', 'family name', 'grandfather name', 'የአያት ስም'],
    dateOfBirth: ['date of birth', 'birth date', 'dob', 'የልደት ቀን', 'birthday'],
    region: ['region', 'ክልል', 'state'],
    city: ['city', 'ከተማ', 'town', 'city admin'],
    sex: ['sex', 'gender', 'ጾታ'],
    zone: ['zone', 'ዞን'],
    nationality: ['nationality', 'ዜግነት', 'citizen'],
    woreda: ['woreda', 'ወረዳ', 'district'],
    phoneNumber: ['phone', 'mobile', 'telephone', 'ስልክ ቁጥር', 'tel'],
    idNumber: ['id number', 'id no', 'card number', 'የመታወቂያ ቁጥር'],
    fullName: ['full name', 'name', 'ሙሉ ስም'],
  };

  // Try to extract each field
  for (const [field, labels] of Object.entries(labelMappings)) {
    for (const label of labels) {
      const value = extractByLabel(label);
      if (value && value.length > 0 && value !== '-' && value !== 'N/A') {
        data[field] = value;
        break;
      }
    }
  }

  // Strategy 2: Try to find data in input fields
  const inputs = document.querySelectorAll('input[type="text"], input[readonly]');
  inputs.forEach(input => {
    const name = input.name || input.id || '';
    const value = input.value.trim();

    if (value && value.length > 0) {
      if (name.toLowerCase().includes('first') || name.toLowerCase().includes('given')) {
        data.firstName = data.firstName || value;
      }
      if (name.toLowerCase().includes('middle') || name.toLowerCase().includes('father')) {
        data.middleName = data.middleName || value;
      }
      if (name.toLowerCase().includes('last') || name.toLowerCase().includes('surname') || name.toLowerCase().includes('grandfather')) {
        data.surname = data.surname || value;
      }
      if (name.toLowerCase().includes('birth') || name.toLowerCase().includes('dob')) {
        data.dateOfBirth = data.dateOfBirth || value;
      }
      if (name.toLowerCase().includes('phone') || name.toLowerCase().includes('mobile')) {
        data.phoneNumber = data.phoneNumber || value;
      }
    }
  });

  // Strategy 3: Try to find data in the entire page HTML
  const pageText = document.body.innerText;

  // Log what we found
  console.log('Extracted Fayda data:', data);

  // Return data with metadata
  return {
    success: true,
    data: data,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    extractionMethod: 'content-script',
  };
}

// Function to create a floating button for manual extraction
function createExtractionButton() {
  // Check if button already exists
  if (document.getElementById('fayda-extract-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'fayda-extract-btn';
  button.innerHTML = '📤 Send to Smart Branch';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background: linear-gradient(to right, #E60000, #FF0000);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.3)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
  });

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerHTML = '⏳ Extracting...';

    try {
      const extractedData = extractFaydaData();

      // Send to background script
      chrome.runtime.sendMessage({
        type: 'FAYDA_DATA_EXTRACTED',
        data: extractedData
      }, (response) => {
        if (response && response.success) {
          button.innerHTML = '✅ Sent Successfully!';
          button.style.background = 'linear-gradient(to right, #10B981, #059669)';

          setTimeout(() => {
            button.innerHTML = '📤 Send to Smart Branch';
            button.style.background = 'linear-gradient(to right, #E60000, #FF0000)';
            button.disabled = false;
          }, 2000);
        } else {
          throw new Error('Failed to send data');
        }
      });
    } catch (error) {
      console.error('Extraction error:', error);
      button.innerHTML = '❌ Failed - Try Again';
      button.style.background = 'linear-gradient(to right, #EF4444, #DC2626)';

      setTimeout(() => {
        button.innerHTML = '📤 Send to Smart Branch';
        button.style.background = 'linear-gradient(to right, #E60000, #FF0000)';
        button.disabled = false;
      }, 2000);
    }
  });

  document.body.appendChild(button);
  console.log('Extraction button created');
}

// Listen for messages from background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.type === 'EXTRACT_FAYDA_DATA') {
    try {
      const extractedData = extractFaydaData();
      sendResponse(extractedData);
    } catch (error) {
      console.error('Extraction error:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
    return true; // Keep the message channel open for async response
  }
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(createExtractionButton, 1000);
  });
} else {
  setTimeout(createExtractionButton, 1000);
}

console.log('Fayda Data Extractor: Ready');
