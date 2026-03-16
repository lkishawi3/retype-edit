# CHANGELOG

## 0.0.5

- Add "Paste & Practice" feature (Ctrl+Shift+V)
- Fix ReType: command 'tab' already exists error
- Fix command 'default:deleteLeft' not found after exiting practice mode
- Improve event listener cleanup to prevent command persistence issues
- Disable inline suggestions during practice mode to prevent interference
- Properly restore inline suggestions setting when practice mode ends

## 0.0.4

- Added Settings sidebar panel with custom activity bar icon
- Added "Open Extension Settings" button in settings sidebar
- Added comprehensive debug logging for extension initialization

## 0.0.3

- Added a "Configure Keybinds for Retype" command as a Ctrl+Shift+P menu option
- Added "Reset Current Session" functionality
- Fixed a bug where ` and ' were recognised as the same character

## 0.0.2

- Changed the start typing test to use highlight instead of cursor
- Fixed a bug where newlines could be typed twice
- Changed startPractice and stopPractice to a togglePractice command, now using "Ctrl+`"

## 0.0.1

- Changed stopPractice shortcut to "cmd+shift+q"
