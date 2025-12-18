// Content script for extracting Fayda Ethiopian Digital ID data from PDF
console.log('Fayda Data Extractor: Content script loaded');

// Load PDF.js library
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Function to load PDF.js
async function loadPDFJS() {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_URL;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      console.log('PDF.js loaded successfully');
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

// Function to get PDF URL from Chrome's PDF viewer
function getPDFUrl() {
  // In Chrome's PDF viewer, the URL is the current page URL
  const url = window.location.href;

  // Check if it's a PDF URL
  if (url.includes('.pdf') || url.includes('download-pdf')) {
    return url;
  }

  // Try to find embed or iframe with PDF
  const embed = document.querySelector('embed[type="application/pdf"]');
  if (embed && embed.src) {
    return embed.src;
  }

  const iframe = document.querySelector('iframe[src*=".pdf"]');
  if (iframe && iframe.src) {
    return iframe.src;
  }

  return url;
}

// Function to extract text from PDF using PDF.js
async function extractTextFromPDF() {
  console.log('Attempting to extract text from PDF...');

  try {
    // Load PDF.js library
    const pdfjsLib = await loadPDFJS();

    // Get PDF URL
    const pdfUrl = getPDFUrl();
    console.log('PDF URL:', pdfUrl);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    console.log('PDF loaded, pages:', pdf.numPages);

    let fullText = '';

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine all text items
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');

      fullText += pageText + '\n';
      console.log(`Page ${pageNum} text length:`, pageText.length);
    }

    console.log('Total extracted text length:', fullText.length);
    console.log('First 500 chars:', fullText.substring(0, 500));

    return fullText;

  } catch (error) {
    console.error('PDF extraction error:', error);

    // Fallback: try to select all text manually
    console.log('Trying fallback method: text selection...');
    const selection = window.getSelection();

    // Try to execute copy command to get PDF text
    try {
      document.execCommand('selectAll');
      const selectedText = selection.toString();
      selection.removeAllRanges();

      if (selectedText && selectedText.length > 50) {
        console.log('Fallback successful, text length:', selectedText.length);
        return selectedText;
      }
    } catch (e) {
      console.error('Fallback failed:', e);
    }

    throw error;
  }
}

// Function to parse text and extract fields
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

  // Clean the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('Lines found:', lines.length);
  console.log('Sample lines:', lines.slice(0, 20));

  // Pattern matching for common field formats
  const patterns = {
    // Name patterns - try to capture names that follow labels
    firstName: [
      /(?:First\s*Name|Given\s*Name|የመጀመሪያ\s*ስም)[:\s]*([A-Za-zሀ-፼]+)/i,
      /Name[:\s]*([A-Za-zሀ-፼]+)\s+([A-Za-zሀ-፼]+)\s+([A-Za-zሀ-፼]+)/i,
    ],
    middleName: [
      /(?:Middle\s*Name|Father'?s?\s*Name|የአባት\s*ስም)[:\s]*([A-Za-zሀ-፼]+)/i,
    ],
    surname: [
      /(?:Surname|Last\s*Name|Grandfather'?s?\s*Name|የአያት\s*ስም)[:\s]*([A-Za-zሀ-፼]+)/i,
    ],
    dateOfBirth: [
      /(?:Date\s*of\s*Birth|Birth\s*Date|DOB|የልደት\s*ቀን)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    ],
    sex: [
      /(?:Sex|Gender|ጾታ)[:\s]*(Male|Female|M|F|ወንድ|ሴት)/i,
    ],
    nationality: [
      /(?:Nationality|ዜግነት)[:\s]*([A-Za-zሀ-፼]+)/i,
      /(Ethiopian|ኢትዮጵያዊ)/i,
    ],
    region: [
      /(?:Region|ክልል)[:\s]*([A-Za-zሀ-፼\s]+?)(?=\s*(?:City|Zone|Woreda|Sex|DOB|ከተማ|ዞን|ወረዳ|$))/i,
    ],
    city: [
      /(?:City|Town|ከተማ)[:\s]*([A-Za-zሀ-፼\s]+?)(?=\s*(?:Zone|Woreda|Region|Sex|DOB|ዞን|ወረዳ|ክልል|$))/i,
    ],
    zone: [
      /(?:Zone|ዞን)[:\s]*([A-Za-zሀ-፼\s]+?)(?=\s*(?:City|Woreda|Region|Sex|DOB|ከተማ|ወረዳ|ክልል|$))/i,
    ],
    woreda: [
      /(?:Woreda|ወረዳ)[:\s]*([A-Za-zሀ-፼\s]+?)(?=\s*(?:City|Zone|Region|Sex|DOB|ከተማ|ዞን|ክልል|$))/i,
    ],
    phoneNumber: [
      /(?:Phone|Mobile|Tel|Telephone|ስልክ)[:\s]*(\+?\d{10,15})/i,
      /(\+251\d{9})/,
      /(09\d{8})/,
      /(07\d{8})/,
    ],
    idNumber: [
      /(?:ID\s*Number|Card\s*Number|Number|የመታወቂያ\s*ቁጥር)[:\s]*([A-Z0-9\-\/]+)/i,
    ],
  };

  // Try pattern matching
  for (const [field, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      const match = cleanText.match(regex);
      if (match) {
        if (field === 'firstName' && match.length > 3) {
          // Full name pattern matched
          data.firstName = match[1];
          data.middleName = match[2];
          data.surname = match[3];
          data.fullName = `${match[1]} ${match[2]} ${match[3]}`;
        } else {
          data[field] = match[1] || match[0];
        }
        if (data[field]) break;
      }
    }
  }

  // Try line-by-line extraction (when labels are on separate lines)
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].toLowerCase();
    const nextLine = lines[i + 1];

    // Skip if next line is too long (probably not a field value)
    if (nextLine.length > 50) continue;

    if ((line.includes('first name') || line.includes('given name') || line.includes('የመጀመሪያ ስም')) && !data.firstName) {
      data.firstName = nextLine;
    }
    if ((line.includes('middle name') || line.includes('father') || line.includes('የአባት ስም')) && !data.middleName) {
      data.middleName = nextLine;
    }
    if ((line.includes('surname') || line.includes('last name') || line.includes('grandfather') || line.includes('የአያት ስም')) && !data.surname) {
      data.surname = nextLine;
    }
    if ((line.includes('date of birth') || line.includes('birth date') || line.includes('የልደት ቀን')) && !data.dateOfBirth) {
      const dateMatch = nextLine.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
      if (dateMatch) data.dateOfBirth = dateMatch[0];
    }
    if ((line.includes('sex') || line.includes('gender') || line.includes('ጾታ')) && !data.sex) {
      data.sex = nextLine;
    }
    if ((line.includes('region') || line.includes('ክልል')) && !data.region) {
      data.region = nextLine;
    }
    if ((line.includes('city') || line.includes('town') || line.includes('ከተማ')) && !data.city) {
      data.city = nextLine;
    }
    if ((line.includes('zone') || line.includes('ዞን')) && !data.zone) {
      data.zone = nextLine;
    }
    if ((line.includes('woreda') || line.includes('ወረዳ')) && !data.woreda) {
      data.woreda = nextLine;
    }
    if ((line.includes('nationality') || line.includes('ዜግነት')) && !data.nationality) {
      data.nationality = nextLine;
    }
    if ((line.includes('phone') || line.includes('mobile') || line.includes('ስልክ')) && !data.phoneNumber) {
      const phoneMatch = nextLine.match(/\+?\d{10,15}/);
      if (phoneMatch) data.phoneNumber = phoneMatch[0];
    }
  }

  // Default nationality if not found
  if (!data.nationality && (cleanText.includes('Ethiopia') || cleanText.includes('ኢትዮጵያ'))) {
    data.nationality = 'Ethiopian';
  }

  // Try to construct full name if we have parts
  if (!data.fullName && data.firstName && data.middleName && data.surname) {
    data.fullName = `${data.firstName} ${data.middleName} ${data.surname}`.trim();
  }

  // Clean up extracted data
  for (const key in data) {
    if (data[key] && typeof data[key] === 'string') {
      // Remove common noise
      data[key] = data[key]
        .replace(/^[:\s]+|[:\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Validate length (probably not a valid field if too long or too short)
      if (data[key].length > 100 || data[key].length < 1) {
        data[key] = null;
      }
    }
  }

  return data;
}

// Main extraction function
async function extractFaydaData() {
  console.log('Extracting Fayda data...');

  try {
    // Wait a bit for PDF to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract text from PDF
    const pdfText = await extractTextFromPDF();

    if (!pdfText || pdfText.length < 50) {
      console.warn('Could not extract sufficient text from PDF');
      return {
        success: false,
        error: 'Could not extract text from PDF. The PDF may not have a text layer, or it may be an image-based PDF.',
        data: {},
      };
    }

    // Parse the text for fields
    const data = parseTextForFields(pdfText);

    console.log('Extracted Fayda data:', data);

    return {
      success: true,
      data: data,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      extractionMethod: 'pdf-text-extraction',
      rawText: pdfText.substring(0, 1000), // Include sample of raw text for debugging
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
      const extractedData = await extractFaydaData();

      if (extractedData.success) {
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
      } else {
        throw new Error(extractedData.error || 'Extraction failed');
      }
    } catch (error) {
      console.error('Extraction error:', error);
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
  console.log('Extraction button created');
}

// Listen for messages from background script or popup
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
    return true; // Keep the message channel open for async response
  }
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(createExtractionButton, 2000); // Wait for PDF to load
  });
} else {
  setTimeout(createExtractionButton, 2000); // Wait for PDF to load
}

console.log('Fayda Data Extractor: Ready');
