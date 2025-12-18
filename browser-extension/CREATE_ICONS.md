# How to Create Extension Icons

The browser extension requires three icon files. You have several options:

## Option 1: Use Online Icon Generator (Easiest)

1. Go to https://www.favicon-generator.org/
2. Upload any image (Ethiopian flag, Zemen Bank logo, or simple red square)
3. Generate the favicons
4. Download the generated files
5. Rename them to:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)
6. Copy them to this folder

## Option 2: Use Paint or Any Image Editor

### For Windows:

1. Open Paint
2. Resize canvas to 128x128 pixels
   - File → Properties → Width: 128, Height: 128
3. Fill with red color (#E60000)
4. Add white text "F" (for Fayda) using Text tool
5. Save as `icon128.png`
6. Repeat for 48x48 and 16x16 (you can skip text on 16x16)

## Option 3: Download Ethiopian Flag Icon

1. Search Google Images for "Ethiopian flag icon PNG"
2. Download three sizes: 16x16, 48x48, 128x128
3. Rename them as required
4. Copy to this folder

## Option 4: Use Placeholder Icons (Temporary)

If you just want to test the extension quickly, create simple solid color PNG files:

1. Use any online PNG generator (like https://placehold.co/)
2. Generate:
   - https://placehold.co/16x16/E60000/FFFFFF/png (save as icon16.png)
   - https://placehold.co/48x48/E60000/FFFFFF/png (save as icon48.png)
   - https://placehold.co/128x128/E60000/FFFFFF/png (save as icon128.png)
3. Download and save to this folder

## Quick PowerShell Script (Windows Only)

You can also run this PowerShell command to download placeholder icons:

```powershell
# Run this from PowerShell in the browser-extension folder

Invoke-WebRequest -Uri "https://placehold.co/16x16/E60000/FFFFFF/png" -OutFile "icon16.png"
Invoke-WebRequest -Uri "https://placehold.co/48x48/E60000/FFFFFF/png" -OutFile "icon48.png"
Invoke-WebRequest -Uri "https://placehold.co/128x128/E60000/FFFFFF/png" -OutFile "icon128.png"
```

## Verify Icons

After creating the icons, ensure:
- All three files exist in the `browser-extension` folder
- Files are named exactly: `icon16.png`, `icon48.png`, `icon128.png`
- Files are PNG format
- Files are the correct sizes (16x16, 48x48, 128x128)

Once icons are created, reload the extension in Chrome/Edge.
