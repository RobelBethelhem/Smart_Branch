// Content script for extracting Fayda Ethiopian Digital ID data from Chrome PDF viewer
console.log('Fayda Data Extractor: Content script loaded');

// Wait for PDF to be fully rendered in Chrome's viewer
async function waitForPDFToLoad() {
  return new Promise((resolve) => {
    // Chrome's PDF viewer takes time to render
    setTimeout(() => {
      console.log('PDF should be loaded now');
      resolve(true);
    }, 3000);
  });
}

// Extract text by selecting all content in the PDF viewer
async function extractTextFromChromeViewer() {
  console.log('Attempting to extract text from Chrome PDF viewer...');

  try {
    // Method 1: Try to select all text in the viewer
    const previousSelection = window.getSelection();
    const previousRange = previousSelection.rangeCount > 0 ? previousSelection.getRangeAt(0) : null;

    // Select all
    document.execCommand('selectAll');

    // Get selected text
    const selection = window.getSelection();
    const text = selection.toString();

    console.log('Extracted text length:', text.length);
    console.log('First 500 characters:', text.substring(0, 500));

    // Restore previous selection
    selection.removeAllRanges();
    if (previousRange) {
      selection.addRange(previousRange);
    }

    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Parse extracted text for Fayda ID fields
function parseTextForFields(text) {
  console.log('Parsing text for fields...');

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
    idNumber: null,
    fullName: null,
    address: null,
  };

  console.log('Full text to parse:', text);

  // Extract FCN (ID Number) - Format: FCN: 3019280297846759
  const fcnMatch = text.match(/FCN:\s*(\d{16})/);
  if (fcnMatch) {
    data.idNumber = fcnMatch[1];
    console.log('✓ Found FCN:', data.idNumber);
  }

  // Extract full name - Look for pattern: FirstName MiddleName Surname (capitalized English name)
  // This appears after the Amharic name
  const fullNameMatch = text.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/);
  if (fullNameMatch) {
    data.firstName = fullNameMatch[1];
    data.middleName = fullNameMatch[2];
    data.surname = fullNameMatch[3];
    data.fullName = `${fullNameMatch[1]} ${fullNameMatch[2]} ${fullNameMatch[3]}`;
    console.log('✓ Found name:', data.fullName);
  }

  // Extract date of birth - Format: DD/MM/YYYY | YYYY/MM/DD
  const dobMatch = text.match(/(\d{2}\/\d{2}\/\d{4})\s*\|\s*(\d{4}\/\d{2}\/\d{2})/);
  if (dobMatch) {
    data.dateOfBirth = dobMatch[1]; // Use DD/MM/YYYY format
    console.log('✓ Found DOB:', data.dateOfBirth);
  }

  // Extract sex - Format: ወንድ | Male or ሴት | Female
  const sexMatch = text.match(/(?:ወንድ|ሴት)\s*\|\s*(Male|Female)/i);
  if (sexMatch) {
    data.sex = sexMatch[1];
    console.log('✓ Found sex:', data.sex);
  }

  // Extract nationality
  if (text.includes('Ethiopian') || text.includes('ኢትዮጵያዊ')) {
    data.nationality = 'Ethiopian';
    console.log('✓ Found nationality:', data.nationality);
  }

  // Extract Region/City Admin - Common values: Addis Ababa, Oromia, etc.
  const regionMatch = text.match(/(?:አዲስ አበባ|ኦሮሚያ|አማራ|ትግራይ|አፋር|ሶማሊ|የደቡብ)\s+(Addis Ababa|Oromia|Amhara|Tigray|Afar|Somali|SNNP|Benishangul|Gambela|Harari|Dire Dawa)/i);
  if (regionMatch) {
    data.region = regionMatch[1];
    console.log('✓ Found region:', data.region);
  } else {
    // Try alternative pattern
    const altRegionMatch = text.match(/Region\/City Admin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (altRegionMatch) {
      data.region = altRegionMatch[1];
      console.log('✓ Found region (alt):', data.region);
    }
  }

  // Extract Zone/Sub City - Format: "አዲስ ከተማ Addis Ketema"
  // Look for Amharic text followed by capitalized English
  const zoneMatch = text.match(/Zone\/City Admin\/Sub City\s+[ሀ-፼\s]+\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (zoneMatch) {
    data.zone = zoneMatch[1];
    data.city = zoneMatch[1]; // Zone/Sub City is the city
    console.log('✓ Found zone/city:', data.zone);
  } else {
    // Alternative: just look for capitalized name after Amharic
    const altZoneMatch = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?=Woreda|ወረዳ)/);
    if (altZoneMatch && altZoneMatch[1] !== data.region) {
      data.zone = altZoneMatch[1];
      data.city = altZoneMatch[1];
      console.log('✓ Found zone/city (alt):', data.zone);
    }
  }

  // Extract Woreda - Format: "ወረዳ 06 Woreda 06"
  const woredaMatch = text.match(/Woreda\s+(\d{2})/i);
  if (woredaMatch) {
    data.woreda = `Woreda ${woredaMatch[1]}`;
    console.log('✓ Found woreda:', data.woreda);
  }

  // Extract phone number - Format: 0910668555 (10 digits starting with 09 or 07)
  const phoneMatch = text.match(/Phone Number\s+(0[97]\d{8})/i);
  if (phoneMatch) {
    data.phoneNumber = phoneMatch[1];
    console.log('✓ Found phone:', data.phoneNumber);
  } else {
    // Alternative: just find any 10-digit number starting with 09 or 07
    const altPhoneMatch = text.match(/(0[97]\d{8})/);
    if (altPhoneMatch) {
      data.phoneNumber = altPhoneMatch[1];
      console.log('✓ Found phone (alt):', data.phoneNumber);
    }
  }

  console.log('Final extracted data:', data);
  return data;
}

// Main extraction function
async function extractFaydaData() {
  console.log('=== Starting Fayda data extraction ===');

  try {
    // Wait for PDF to load
    await waitForPDFToLoad();

    // Extract text from Chrome's PDF viewer
    const text = await extractTextFromChromeViewer();

    if (!text || text.length < 100) {
      throw new Error('Could not extract sufficient text from PDF. Text length: ' + text.length);
    }

    // Parse the text for fields
    const data = parseTextForFields(text);

    // Check if we got at least some data
    const hasData = Object.values(data).some(value => value !== null);
    if (!hasData) {
      console.warn('No data could be extracted from the text');
    }

    return {
      success: true,
      data: data,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      extractionMethod: 'chrome-pdf-viewer',
      rawText: text.substring(0, 2000), // Include more text for debugging
    };
  } catch (error) {
    console.error('Extraction error:', error);
    return {
      success: false,
      error: error.message,
      data: {},
    };
  }
}

// Create floating extraction button
function createExtractionButton() {
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
      const extractedData = await extractFaydaData();

      if (extractedData.success) {
        // Send to background script
        chrome.runtime.sendMessage({
          type: 'FAYDA_DATA_EXTRACTED',
          data: extractedData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Message error:', chrome.runtime.lastError);
          }

          if (response && response.success) {
            button.innerHTML = '✅ Sent Successfully!';
            button.style.background = 'linear-gradient(to right, #10B981, #059669)';

            setTimeout(() => {
              button.innerHTML = '📤 Send to Smart Branch';
              button.style.background = 'linear-gradient(to right, #E60000, #FF0000)';
              button.disabled = false;
            }, 2000);
          } else {
            throw new Error('Failed to send data to Smart Branch');
          }
        });
      } else {
        throw new Error(extractedData.error || 'Extraction failed');
      }
    } catch (error) {
      console.error('Button click error:', error);
      button.innerHTML = '❌ Failed - Try Again';
      button.style.background = 'linear-gradient(to right, #EF4444, #DC2626)';

      setTimeout(() => {
        button.innerHTML = '📤 Send to Smart Branch';
        button.style.background = 'linear-gradient(to right, #E60000, #FF0000)';
        button.disabled = false;
      }, 3000);
    }
  });

  document.body.appendChild(button);
  console.log('✓ Extraction button created');
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.type === 'EXTRACT_FAYDA_DATA') {
    extractFaydaData().then(extractedData => {
      sendResponse(extractedData);
    }).catch(error => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // Keep message channel open
  }
});

// Initialize when page loads
console.log('Document ready state:', document.readyState);

// Wait a bit longer for Chrome's PDF viewer to fully load
setTimeout(() => {
  console.log('Creating extraction button...');
  createExtractionButton();
}, 3000);

console.log('Fayda Data Extractor: Ready');
