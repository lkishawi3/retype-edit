# ReType - Quick Start Guide

## Get Started

### 1. Install Dependencies
```bash
npm install
npm run compile
```

### 2. Test the Extension
1. Press `F5` to launch a new VS Code window with ReType loaded.
2. Open any of the sample files:
   - `sample-practice.js` (JavaScript)
   - `sample-practice.py` (Python)

### 3. Start Practicing
1. **Select** the text you want to practice typing.
2. Press <kbd>Ctrl</kbd>+<kbd>`</kbd> or <kbd>Cmd</kbd>+<kbd>`</kbd> on Mac to start practice mode.
3. Start typing, the overlay will give real-time feedback as you type.

### 4. Visual Feedback & Behavior
- **Faded text**: Characters you haven't typed yet.
- **Normal text**: Characters you've typed correctly.
- **Red text**: Errors (typing halts until you enter the correct character).
- **Green highlight**: The current character to type.

### 5. Monitor Progress
- The status bar displays your WPM, accuracy, and error count in real-time.
- Completing a section shows a summary of your performance.

### 6. Controls & Commands
- <kbd>Ctrl</kbd>+<kbd>`</kbd> / <kbd>Ctrl</kbd>+<kbd>`</kbd> : Toggle practice mode (start/stop) after selecting text.
- Command Palette → "ReType: Reset Current Session": Restart your current practice session.
- Command Palette → "Configure Keybinds for Retype": Customize your key bindings.

## Development Mode

To work on the extension:
```bash
npm run watch  # Auto-compile on changes
```
Then press `F5` to launch the Extension Host and test your updates.

## Sample Files Included

- `sample-practice.js`: JavaScript ES6+ sample
- `sample-practice.py`: Python sample  
- `test-overlay.js`: Overlay functionality test
- `test-special-chars.js`: Special characters and quotes test
- `test-cursor-animation.js`: Cursor animation & syntax highlighting test

## Troubleshooting

**Extension not loading?**
- Ensure you've run `npm run compile`.
- Check the VS Code Debug Console for errors.

**Colors not showing?**
- Be sure practice mode is started with <kbd>Ctrl</kbd>+<kbd>`</kbd>
- Try resetting or restarting your session.

**Text getting modified accidentally?**
- The overlay should never modify your code. If it does, please report a bug.

**Performance issues?**
- Avoid using ReType with very large files (over 1000 lines).
- Consider disabling other heavy extensions if performance slows.

---

**Ready to boost your code typing speed? Open a sample file and start practicing!** 