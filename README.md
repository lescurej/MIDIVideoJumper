# MIDI Video Jumper

Chrome extension that controls YouTube playback with a MIDI keyboard. Map notes to video positions and toggle play/pause with note on/off.

## Requirements

- Google Chrome
- A MIDI input device (keyboard, controller, etc.)
- YouTube page (extension only activates on youtube.com)

## Installation

### 1. Download the project and unzip it

Ensure all files are in a single folder:
- `manifest.json`
- `content.js`
- `popup.html`
- `popup.js`
- `popup.css`
- `style.css`

### 2. Open Chrome Extensions

- Open Chrome and go to `chrome://extensions`
- Or: menu (⋮) → **Extensions** → **Manage Extensions**

### 3. Enable Developer mode

Toggle **Developer mode** in the top-right corner.

### 4. Load the unpacked extension

1. Click **Load unpacked**
2. Select the folder containing the extension files (the `MIDIVideoJumper` folder)
3. Confirm with **Select**

The extension icon should appear in the Chrome toolbar.

## Usage

1. Open a YouTube video
2. Click the MIDI Video Jumper icon in the toolbar
3. Choose your MIDI input device
4. Play notes on your MIDI keyboard to jump to positions in the video:
   - Lower notes → start of the video  
   - Higher notes → end of the video
5. Note on = toggle play/pause  
   Note off (with "Pause on release" enabled) = pause
