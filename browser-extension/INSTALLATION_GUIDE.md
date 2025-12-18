# Fayda to Smart Branch Extension - Installation & Testing Guide

## Quick Installation (5 Minutes)

### Step 1: Open Chrome Extensions Page

1. Open Google Chrome or Microsoft Edge
2. Type in the address bar: `chrome://extensions/` (or `edge://extensions/` for Edge)
3. Press Enter

### Step 2: Enable Developer Mode

1. Look for the **Developer mode** toggle in the top-right corner
2. Click to turn it ON (it should turn blue)

### Step 3: Load the Extension

1. Click the **"Load unpacked"** button (appears after enabling Developer mode)
2. Navigate to: `D:\Smart_Branch\browser-extension`
3. Click **"Select Folder"**
4. The extension should now appear in your list with the name "Fayda to Smart Branch Data Bridge"

### Step 4: Verify Installation

✅ You should see:
- Extension name: "Fayda to Smart Branch Data Bridge"
- Version: 1.0.0
- Status: Enabled (blue toggle)
- A small icon in your extensions list

### Step 5: Pin Extension (Optional but Recommended)

1. Click the puzzle piece icon (Extensions) in your browser toolbar
2. Find "Fayda to Smart Branch Data Bridge"
3. Click the pin icon 📌 next to it
4. The extension icon will now appear in your toolbar

## Testing the Extension

### Test 1: Extension Loads Successfully

**Steps:**
1. Extension appears in `chrome://extensions/`
2. No error messages shown
3. Extension icon is visible

**Expected Result:** ✅ Extension is installed and enabled

---

### Test 2: Floating Button Appears on Fayda

**Steps:**
1. Open a new tab
2. Go to: `https://bankpc.fayda.et`
3. Log in with your Fayda credentials
4. Navigate to your Digital ID card page
5. Look for a red button in the bottom-right corner

**Expected Result:** ✅ Red button labeled "📤 Send to Smart Branch" appears

**Troubleshooting:**
- If button doesn't appear, refresh the page (F5)
- Check browser console (F12) for errors
- Make sure you're on the ID card page, not the login page

---

### Test 3: Extension Popup Works

**Steps:**
1. While on Fayda page, click the extension icon in your toolbar
2. Popup window should open

**Expected Result:** ✅ Popup shows:
- Header: "🇪🇹 Fayda Bridge"
- Status: "✅ Fayda tab detected - Ready to extract"
- Button: "📤 Extract from Fayda"
- Instructions at the bottom

**Troubleshooting:**
- If popup is blank, reload the extension
- If status says "Fayda tab not found", make sure you have bankpc.fayda.et open

---

### Test 4: Data Extraction (CRITICAL TEST)

**Steps:**
1. Open Fayda in one tab: `https://bankpc.fayda.et`
2. Log in and view your Digital ID card
3. Click the floating "📤 Send to Smart Branch" button in bottom-right
4. Button should change to "⏳ Extracting..."
5. After 1-2 seconds, button should change to "✅ Sent Successfully!"

**Expected Result:** ✅ Console logs (F12) show:
```
Fayda Data Extractor: Content script loaded
Extracting Fayda data...
Extracted Fayda data: {firstName: "...", middleName: "...", ...}
```

**What to Check:**
- Open browser console (F12 on Fayda page)
- Look for "Extracted Fayda data:" log
- Verify which fields were extracted (firstName, middleName, etc.)
- Note which fields are `null` (not found)

**Troubleshooting:**
- If no data extracted, the page structure may be different
- Take a screenshot of your ID card page
- Share the HTML structure for analysis

---

### Test 5: Data Transfer to Smart Branch

**Steps:**
1. Keep Fayda tab open with ID card
2. Open Smart Branch in a new tab: `http://localhost:4000`
3. In Fayda tab, click "📤 Send to Smart Branch" button
4. Switch to Smart Branch tab
5. A modal should appear automatically

**Expected Result:** ✅ Smart Branch shows:
- Modal with title "Fayda Data Extracted"
- Extracted personal information displayed
- Buttons: "Cancel" and "Use This Data"

**Check the Modal Shows:**
- **Personal Information section:**
  - First Name
  - Middle Name
  - Surname
  - Date of Birth
  - Sex
  - Nationality
  - ID Number

- **Location Information section:**
  - Region
  - City
  - Zone
  - Woreda

- **Contact Information section:**
  - Phone Number

**Troubleshooting:**
- If modal doesn't appear, check console (F12) on Smart Branch tab
- Look for "Received Fayda data from extension:" log
- Make sure Smart Branch is running on port 4000

---

### Test 6: Queued Data (Advanced Test)

**Steps:**
1. Close Smart Branch tab (if open)
2. On Fayda tab, click "📤 Send to Smart Branch"
3. Wait for "✅ Sent Successfully!" confirmation
4. Now open Smart Branch: `http://localhost:4000`
5. Modal should appear automatically when page loads

**Expected Result:** ✅ Modal appears with queued data

**This Tests:** Data storage when Smart Branch isn't open yet

---

### Test 7: Import from Fayda Button

**Steps:**
1. Open Smart Branch: `http://localhost:4000`
2. Look for "Import from Fayda" button (green button)
3. Click it
4. New tab should open to Fayda

**Expected Result:** ✅ New tab opens to `https://bankpc.fayda.et`

**Note:** You'll still need to extract data using the floating button

---

## Data Extraction Accuracy Test

### Manual Verification Checklist

After extracting data, compare with your actual Fayda ID card:

| Field | On Fayda ID | Extracted Correctly? | Notes |
|-------|------------|---------------------|-------|
| First Name | ____________ | ☐ Yes ☐ No | |
| Middle Name | ____________ | ☐ Yes ☐ No | |
| Surname | ____________ | ☐ Yes ☐ No | |
| Date of Birth | ____________ | ☐ Yes ☐ No | |
| Sex | ____________ | ☐ Yes ☐ No | |
| Region | ____________ | ☐ Yes ☐ No | |
| City | ____________ | ☐ Yes ☐ No | |
| Zone | ____________ | ☐ Yes ☐ No | |
| Woreda | ____________ | ☐ Yes ☐ No | |
| Phone Number | ____________ | ☐ Yes ☐ No | |
| ID Number | ____________ | ☐ Yes ☐ No | |
| Nationality | ____________ | ☐ Yes ☐ No | |

### If Data is Missing or Incorrect

1. **Open Browser Console on Fayda Page:**
   - Press F12
   - Go to Console tab
   - Look for "Extracted Fayda data:" log
   - Note which fields are `null`

2. **Inspect the Fayda Page:**
   - Press F12
   - Go to Elements tab
   - Find the ID card information
   - Note the HTML structure (labels, divs, tables, etc.)

3. **Take Screenshots:**
   - Screenshot of Fayda ID card page
   - Screenshot of browser console with extraction logs
   - Screenshot of Smart Branch modal with extracted data

4. **Report Missing Fields:**
   - Which fields are missing?
   - Are they visible on the Fayda page?
   - What language are the labels (English/Amharic)?

---

## Common Issues & Solutions

### Issue 1: Extension Not Loading

**Symptoms:** Extension doesn't appear in `chrome://extensions/`

**Solutions:**
1. Make sure Developer mode is ON
2. Reload the page: `chrome://extensions/`
3. Try loading unpacked again
4. Check if all files exist in `D:\Smart_Branch\browser-extension`

---

### Issue 2: Floating Button Not Appearing

**Symptoms:** No red button on Fayda page

**Solutions:**
1. Refresh the page (F5)
2. Make sure you're on `https://bankpc.fayda.et`
3. Check if you're logged in and viewing ID card page
4. Open console (F12) and look for errors
5. Reload the extension from `chrome://extensions/`

---

### Issue 3: No Data Extracted

**Symptoms:** Modal shows "No Data Extracted" or all fields are empty

**Solutions:**
1. Make sure ID card is fully loaded and visible
2. Try refreshing the Fayda page
3. Check if page structure changed (Fayda updated their website)
4. Open console and look for "Extracted Fayda data:" log
5. The extension may need updates for new Fayda layout

---

### Issue 4: Modal Not Appearing in Smart Branch

**Symptoms:** Data extracted but modal doesn't show

**Solutions:**
1. Make sure Smart Branch is on `http://localhost:4000` (not 3000 or other port)
2. Check Smart Branch console (F12) for errors
3. Try closing and reopening Smart Branch
4. Clear extension storage: Click extension icon → "🗑️ Clear Data"
5. Extract data again

---

### Issue 5: Incomplete Data

**Symptoms:** Some fields extracted, others missing

**Solutions:**
1. This is expected - the extension uses best-effort extraction
2. Note which fields are consistently missing
3. The content script may need updates for those fields
4. Some fields may not be visible on the Fayda page
5. Report missing fields for improvement

---

## Browser Console Debugging

### Fayda Page Console (F12)

**What to Look For:**
```javascript
// Good signs:
✅ "Fayda Data Extractor: Content script loaded"
✅ "Extraction button created"
✅ "Extracting Fayda data..."
✅ "Extracted Fayda data: {...}"

// Error signs:
❌ JavaScript errors (red text)
❌ "Element not found" errors
❌ No extraction logs
```

### Smart Branch Console (F12)

**What to Look For:**
```javascript
// Good signs:
✅ "Received Fayda data from extension:"
✅ "Found queued Fayda data:"

// Error signs:
❌ Component errors
❌ Modal rendering errors
❌ No data received logs
```

### Extension Background Console

**How to Access:**
1. Go to `chrome://extensions/`
2. Find "Fayda to Smart Branch Data Bridge"
3. Click "service worker" (blue link)
4. New DevTools window opens

**What to Look For:**
```javascript
✅ "Fayda Extension: Background script loaded"
✅ "Stored extracted data:"
✅ "Data sent to Smart Branch tab:"
```

---

## Next Steps After Testing

### If Everything Works:
1. ✅ Mark all tests as passed
2. ✅ Fill out the accuracy checklist
3. ✅ Start using the extension for actual customer onboarding
4. ✅ Report any edge cases or issues

### If Some Tests Fail:
1. ⚠️ Note which tests failed
2. ⚠️ Collect error messages from console
3. ⚠️ Take screenshots
4. ⚠️ Report to development team

### For Production Use:
1. Test with multiple different Fayda accounts
2. Verify accuracy across different ID card layouts
3. Test with both English and Amharic interfaces
4. Document any consistent missing fields
5. Create user training documentation

---

## Need Help?

**Error Logs Location:**
- Fayda console: F12 on bankpc.fayda.et
- Smart Branch console: F12 on localhost:4000
- Extension background: chrome://extensions/ → service worker

**Report Issues With:**
1. Screenshot of Fayda ID card page
2. Screenshot of extracted data modal
3. Browser console logs (from both tabs)
4. Accuracy checklist results
5. Which test(s) failed

---

## Version

Current Version: **1.0.0**
Last Updated: December 2024
