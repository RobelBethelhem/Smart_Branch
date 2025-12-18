# Fayda to Smart Branch Data Bridge - Browser Extension

This Chrome/Edge browser extension extracts Ethiopian Digital ID data from the Fayda website (bankpc.fayda.et) and sends it to the Smart Branch application for automatic form filling.

## Features

- 🔍 **Automatic Data Extraction**: Extracts personal information from Fayda ID cards
- 🚀 **One-Click Transfer**: Send data to Smart Branch with a single click
- 📋 **Data Preview**: View extracted data before sending
- 🔄 **Smart Queuing**: Stores data if Smart Branch isn't open yet
- ✅ **Accuracy Focus**: Designed to maximize data extraction accuracy

## Extracted Data Fields

The extension attempts to extract the following fields from Fayda:

- First Name (የመጀመሪያ ስም)
- Middle Name (የአባት ስም)
- Surname (የአያት ስም)
- Date of Birth (የልደት ቀን)
- Region (ክልል)
- City (ከተማ)
- Sex/Gender (ጾታ)
- Zone (ዞን)
- Nationality (ዜግነት)
- Woreda (ወረዳ)
- Phone Number (ስልክ ቁጥር)
- ID Number (የመታወቂያ ቁጥር)

## Installation

### Step 1: Add Extension Icons

The extension requires three icon files. You can create simple icons using any image editor or use placeholder icons:

1. Create three PNG images:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. Save them in the `browser-extension` folder

**Quick Method**: You can download Ethiopian flag icons or create simple red icons as placeholders.

### Step 2: Load the Extension in Chrome/Edge

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `D:\Smart_Branch\browser-extension` folder
6. The extension should now appear in your extensions list

### Step 3: Pin the Extension (Optional but Recommended)

1. Click the puzzle icon in your browser toolbar
2. Find "Fayda to Smart Branch Data Bridge"
3. Click the pin icon to pin it to your toolbar

## Usage

### Method 1: Using the Floating Button (Recommended)

1. Open Fayda website: `https://bankpc.fayda.et`
2. Log in and navigate to your Digital ID card page
3. Look for the red **"📤 Send to Smart Branch"** button in the bottom-right corner
4. Click the button to extract and send data
5. Open Smart Branch (`http://localhost:4000`)
6. The extracted data will appear in a modal automatically

### Method 2: Using the Extension Popup

1. Open Fayda website with your ID card visible
2. Click the extension icon in your toolbar
3. Click **"📤 Extract from Fayda"** button
4. View the extracted data in the popup
5. Open Smart Branch to see the data modal

### Method 3: Direct from Smart Branch

1. Open Smart Branch (`http://localhost:4000`)
2. Click the **"Import from Fayda"** button
3. A new tab will open to Fayda
4. Log in and view your ID card
5. Use Method 1 or 2 to extract data
6. Return to Smart Branch to see the extracted data

## How It Works

1. **Content Script**: Runs on bankpc.fayda.et and analyzes the page for ID card data
2. **Data Extraction**: Uses multiple strategies to find data:
   - Searches for common label patterns in English and Amharic
   - Checks input fields and their attributes
   - Analyzes table structures
3. **Background Script**: Manages communication between Fayda and Smart Branch
4. **Message Passing**: Sends extracted data to Smart Branch via window.postMessage
5. **Storage**: Queues data if Smart Branch isn't open yet

## Data Extraction Strategies

The extension uses intelligent extraction methods:

### Strategy 1: Label-Based Extraction
- Looks for labels in both English and Amharic (አማርኛ)
- Examples: "First Name", "የመጀመሪያ ስም", "Date of Birth", "የልደት ቀን"
- Finds associated values next to labels

### Strategy 2: Input Field Detection
- Scans all input fields for relevant data
- Checks field names and IDs
- Extracts values from readonly fields

### Strategy 3: Table Structure Analysis
- Identifies data in table rows
- Matches labels to values in adjacent cells

## Testing the Accuracy

To test the accuracy of data extraction:

1. Open Fayda and load your ID card
2. Use the extension to extract data
3. Compare the extracted data shown in the Smart Branch modal with the actual ID card
4. Note any missing or incorrect fields
5. Report discrepancies for improvement

## Troubleshooting

### Extension Not Showing

- Make sure Developer mode is enabled
- Reload the extension from `chrome://extensions`
- Check browser console for errors

### No Data Extracted

- Ensure you're on the correct Fayda page with ID card visible
- Try refreshing the Fayda page
- Check if the page structure has changed
- Open browser console (F12) and look for error messages

### Data Not Appearing in Smart Branch

- Make sure Smart Branch is running on `http://localhost:4000`
- Check browser console in both tabs for errors
- Try closing and reopening Smart Branch
- Clear extension storage: Click extension icon → "🗑️ Clear Data"

### Floating Button Not Appearing

- Refresh the Fayda page
- Check if the page is fully loaded
- Look for the button in the bottom-right corner
- Check browser console for JavaScript errors

## Development Notes

### Updating the Extension

If you make changes to the extension code:

1. Go to `chrome://extensions/`
2. Find the extension
3. Click the refresh icon ↻
4. Test the changes

### Debugging

- **Content Script Console**: Open console on Fayda page (F12)
- **Background Script Console**: Click "Service Worker" in extension details
- **Popup Console**: Right-click extension icon → Inspect popup

### Modifying Extraction Logic

To improve extraction accuracy:

1. Open `content.js`
2. Update the `labelMappings` object with new label patterns
3. Add new extraction strategies in `extractFaydaData()` function
4. Test thoroughly with actual Fayda pages

## Security & Privacy

- ✅ Extension only runs on bankpc.fayda.et and localhost:4000
- ✅ No data is sent to external servers
- ✅ Data is only sent to your local Smart Branch application
- ✅ You can view all extracted data before confirming
- ✅ Data is cleared from storage after use

## File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── content.js            # Runs on Fayda page, extracts data
├── background.js         # Manages messaging and storage
├── popup.html           # Extension popup UI
├── popup.js             # Popup functionality
├── icon16.png           # Small icon (required)
├── icon48.png           # Medium icon (required)
├── icon128.png          # Large icon (required)
└── README.md            # This file
```

## Future Improvements

- [ ] OCR support for image-based ID cards
- [ ] Support for multiple ID card layouts
- [ ] Automatic field validation
- [ ] Support for other government ID systems
- [ ] Enhanced error reporting

## Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Open browser console for error messages
3. Test the extraction on different Fayda pages
4. Report persistent issues to the development team

## Version History

### v1.0.0 (Current)
- Initial release
- Multi-strategy data extraction
- Automatic data transfer to Smart Branch
- Floating button on Fayda pages
- Data preview and confirmation

---

**Note**: This extension is for internal use only and requires both Fayda access and Smart Branch to be running locally.
