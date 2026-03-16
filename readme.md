# ReType - VS Code Extension

Learn coding by actually typing real code in VS Code! With ReType, beginners can highlight code or paste in any snippet, then type over it as practice—helping you get used to programming syntax and structure.

## Features

### Current

- **Practice Mode**: Convert any file into a typing practice session
- **Visual Feedback**: Solarized Light color scheme with real-time visual feedback
  - Faint text for untyped content
  - Normal color for correctly typed text
  - Red highlighting for errors
  - Green highlighting for current character
- **Real-time Stats**: Live WPM, accuracy, and error tracking in the status bar
- **Smart Error Handling**: Backspace support with intelligent error correction
- **Session Management**: Reset and restart sessions easily
- **Language Agnostic**: Works with any programming language supported by VS Code

## Usage

### Getting Started

1. Open any code file in VS Code
2. **Select/highlight the text you want to practice typing**
3. Use one of these methods to start:
   - **Command Palette**: Ctrl+Shift+P → "ReType: Start Practice Mode"
   - **Keyboard Shortcut**: <kbd>Ctrl</kbd>+<kbd>`</kbd> (Windows/Linux) or <kbd>Cmd</kbd>+<kbd>`</kbd> (Mac)

### During Practice

- **Type naturally**: Just start typing the code as it appears
- **Visual feedback**: Watch colors change as you type
  - Untyped text appears faded
  - Correct text appears in normal color
  - Incorrect characters are highlighted in red
  - Current character is highlighted in green
- **Real-time stats**: Monitor your progress in the status bar
- **Error correction**: Use backspace to fix mistakes

### Ending Practice

- **Stop Practice**: <kbd>Ctrl</kbd>+<kbd>`</kbd> (Windows/Linux) or <kbd>Cmd</kbd>+<kbd>`</kbd> (Mac) - same key toggles start/stop
- **Reset Session**: Use "ReType: Reset Current Session" from command palette
- **Auto-complete**: When you finish typing all text, you'll see a completion dialog

### Available Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `ReType: Toggle Practice Mode` | <kbd>Ctrl</kbd>+<kbd>`</kbd> | Toggle typing practice on selected text |
| `ReType: Start Practice Mode` | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> | Start typing practice on selected text |
| `ReType: Stop Practice Mode` | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Q</kbd> | Stop current practice session |
| `ReType: Reset Current Session` | - | Reset current session and start over |
| `ReType: Paste & Practice` | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> | Paste from clipboard and start practice |
| `ReType: Configure Keybinds` | - | Open keybindings configuration panel |

## Settings

Access settings via `File > Preferences > Settings` and search for "ReType":

- **`retype.theme`**: Color theme for typing practice (default: "solarized-light")
- **`retype.showRealTimeStats`**: Show real-time typing statistics in status bar (default: true)

## Development

### Building from Source

```bash
# Clone the repository
git clone <repository-url>
cd retype

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch
```

### Extension Structure

```
retype-extension/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── retypeMode.ts         # Core typing practice logic
│   ├── decorationManager.ts  # Handle text decorations
│   ├── statsTracker.ts       # Performance tracking
│   ├── themeManager.ts       # Solarized color management
│   └── commands.ts           # Command implementations
├── package.json             # Extension manifest
└── README.md               # This file
```

## Recent Updates

- Changed the start typing test to use highlight instead of cursor
- Added a "Configure Keybinds for Retype" command as a Ctrl+Shift+P menu option
- Added "Reset Current Session" functionality
- Changed startPractice and stopPractice to a togglePractice command, now using "Ctrl+`"
- Fixed a bug where ` and ' were recognised as the same character
- Added Settings sidebar panel with custom activity bar icon

## Known Issues

- Large files may impact performance during decoration updates
- Some complex Unicode characters may not be handled correctly
- Multi-cursor editing is not supported during practice mode

## Upcoming Features

- Advanced statistics and progress tracking
- Multiple color themes
- Difficulty levels and practice modes
- Achievement system and gamification
- Export statistics and progress data
- Timed practice sessions

## ReType-Edit Upcoming Features

- Paste in typing test
- Edit mode in typing test with git-like diff for changes to the original text
- Git mode paste that only shows changed content that was replaced to show changes during the typing test edit
- Git changes mode that allows you to retype the current git dif status

## License

This extension is provided as-is for educational and productivity purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Happy Typing!**
