import * as vscode from 'vscode';

export class SettingsView {
    private webviewView: vscode.WebviewView | undefined;

    constructor(context: vscode.ExtensionContext) {
        console.log('[SettingsView] Constructor called');
        
        // Register the webview view provider
        const provider = new SettingsWebviewProvider(context);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('retypeSettingsView', provider)
        );

        // Register settings commands
        this.registerSettingsCommands(context);

        console.log('[SettingsView] Initialized successfully');
    }

    private registerSettingsCommands(context: vscode.ExtensionContext): void {
        // Open Settings command
        const openSettingsCmd = vscode.commands.registerCommand('retype.openSettings', async () => {
            await vscode.commands.executeCommand('retypeSettingsView.focus');
        });

        context.subscriptions.push(openSettingsCmd);
    }

    public dispose(): void {
        // Cleanup
    }

    refresh(): void {
        // Refresh handled by webview
    }
}

class SettingsWebviewProvider implements vscode.WebviewViewProvider {
    constructor(private context: vscode.ExtensionContext) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        webviewView.webview.html = this.getWebviewContent(webviewView.webview);

        // Load keybindings with a small delay to ensure webview is ready
        setTimeout(() => {
            this.loadCurrentKeybindings(webviewView);
        }, 100);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            const config = vscode.workspace.getConfiguration('retype');
            
            if (message.command === 'toggleStats') {
                const current = config.get<boolean>('showRealTimeStats', true);
                await config.update('showRealTimeStats', !current, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Real-time stats ${!current ? 'enabled' : 'disabled'}`);
                // Update UI without reloading
                const newStatus = !current;
                webviewView.webview.postMessage({ 
                    command: 'updateStats', 
                    value: newStatus 
                });
            } else if (message.command === 'openSettings') {
                await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:Nirmiti.retype');
            } else if (message.command === 'configureKeybinds') {
                await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', 'retype.');
            } else if (message.command === 'setKeybind') {
                const command = message.keybind;
                const key = message.key;
                
                try {
                    await this.updateKeybinding(command, key);
                    vscode.window.showInformationMessage(`Keybind updated: ${command} -> ${key}`);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Failed to update keybind: ${errorMsg}`);
                }
            } else if (message.command === 'resetKeybindsToDefault') {
                // Show confirmation dialog using VS Code's native dialog
                const result = await vscode.window.showWarningMessage(
                    'Reset all keybindings to defaults?',
                    { modal: true },
                    'Yes',
                    'No'
                );

                if (result === 'Yes') {
                    try {
                        await this.resetKeybindsToDefault();
                        vscode.window.showInformationMessage('Keybinds reset to defaults! Reload to apply changes.');
                        // Reload keybindings in UI
                        this.loadCurrentKeybindings(webviewView);
                    } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : String(error);
                        vscode.window.showErrorMessage(`Failed to reset keybinds: ${errorMsg}`);
                    }
                } else {
                    // User clicked 'No' or dismissed the dialog
                    webviewView.webview.postMessage({
                        command: 'debugLog',
                        message: '[SettingsView] User cancelled reset from confirmation dialog'
                    });
                }
            } else if (message.command === 'debugLog') {
                // Handle debug messages from webview
                console.log('[SettingsView] Webview debug:', message.message);
            }
        });
    }

    private async updateKeybinding(command: string, key: string): Promise<void> {
        try {
            const fs = require('fs');
            const path = require('path');
            const keybindingsPath = this.getKeybindingsPath();

            // Ensure directory exists
            const dir = path.dirname(keybindingsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Read existing keybindings or start with empty array
            let keybindings: any[] = [];
            if (fs.existsSync(keybindingsPath)) {
                try {
                    const content = fs.readFileSync(keybindingsPath, 'utf-8');
                    // Remove JS comments from JSON (VS Code keybindings.json can have comments)
                    const cleanedContent = content
                        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
                        .replace(/\/\/.*$/gm, ''); // Remove // comments
                    keybindings = JSON.parse(cleanedContent);
                    if (!Array.isArray(keybindings)) {
                        keybindings = [];
                    }
                } catch (parseError) {
                    // If parsing fails, start fresh
                    keybindings = [];
                }
            }

            // Remove existing keybindings for this command
            keybindings = keybindings.filter((kb: any) => kb.command !== command);

            // Add new keybinding
            keybindings.push({
                key: key,
                command: command
            });

            // Write back to file with pretty formatting
            const jsonContent = JSON.stringify(keybindings, null, 4);
            fs.writeFileSync(keybindingsPath, jsonContent, 'utf-8');
            
            // Notify user of success
            vscode.window.showInformationMessage(`Keybinding saved! Restart VS Code or reload to apply changes.`);
        } catch (error) {
            throw new Error(`Failed to update keybindings: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private getKeybindingsPath(): string {
        const path = require('path');
        const os = require('os');
        const fs = require('fs');
        const homeDir = os.homedir();
        const appDataPath = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
        
        // Determine which editor to write to based on what exists
        if (process.platform === 'win32') {
            // Windows: Check which editor's directory exists
            const cursorDir = path.join(appDataPath, 'Cursor');
            const codeDir = path.join(appDataPath, 'Code');
            
            if (fs.existsSync(cursorDir)) {
                return path.join(appDataPath, 'Cursor', 'User', 'keybindings.json');
            } else if (fs.existsSync(codeDir)) {
                return path.join(appDataPath, 'Code', 'User', 'keybindings.json');
            } else {
                // Default to Cursor if neither exists
                return path.join(appDataPath, 'Cursor', 'User', 'keybindings.json');
            }
        } else if (process.platform === 'darwin') {
            // macOS: Check which editor's directory exists
            const cursorDir = path.join(homeDir, 'Library', 'Application Support', 'Cursor');
            const codeDir = path.join(homeDir, 'Library', 'Application Support', 'Code');
            
            if (fs.existsSync(cursorDir)) {
                return path.join(cursorDir, 'User', 'keybindings.json');
            } else if (fs.existsSync(codeDir)) {
                return path.join(codeDir, 'User', 'keybindings.json');
            } else {
                // Default to Cursor if neither exists
                return path.join(cursorDir, 'User', 'keybindings.json');
            }
        } else {
            // Linux: Check which editor's directory exists
            const cursorDir = path.join(homeDir, '.config', 'Cursor');
            const codeDir = path.join(homeDir, '.config', 'Code');
            
            if (fs.existsSync(cursorDir)) {
                return path.join(cursorDir, 'User', 'keybindings.json');
            } else if (fs.existsSync(codeDir)) {
                return path.join(codeDir, 'User', 'keybindings.json');
            } else {
                // Default to Cursor if neither exists
                return path.join(cursorDir, 'User', 'keybindings.json');
            }
        }
    }

    private loadCurrentKeybindings(webviewView: vscode.WebviewView): void {
        try {
            const fs = require('fs');
            const keybindingsPath = this.getKeybindingsPath();
            
            const keybindings: { [key: string]: string } = {};
            
            // First, load default ReType keybindings from extension
            const defaultRetypeKeybindings: { [key: string]: string } = {
                'retype.togglePractice': 'ctrl+`',
                'retype.startPractice': 'ctrl+shift+r',
                'retype.stopPractice': 'ctrl+shift+q',
                'retype.resetSession': '',
                'retype.pasteAndPractice': 'ctrl+shift+v',
                'retype.configureKeybinds': ''
            };
            
            // Add default keybindings
            Object.assign(keybindings, defaultRetypeKeybindings);
            console.log('[SettingsView] Loaded default ReType keybindings');
            
            console.log('[SettingsView] Loading user keybindings from:', keybindingsPath);
            
            if (fs.existsSync(keybindingsPath)) {
                try {
                    const content = fs.readFileSync(keybindingsPath, 'utf-8');
                    console.log('[SettingsView] Keybindings file content length:', content.length);
                    
                    // Remove JS comments from JSON
                    const cleanedContent = content
                        .replace(/\/\*[\s\S]*?\*\//g, '')
                        .replace(/\/\/.*$/gm, '');
                    const parsedKeybindings = JSON.parse(cleanedContent);
                    
                    // Map keybindings to commands (overrides defaults)
                    if (Array.isArray(parsedKeybindings)) {
                        parsedKeybindings.forEach((kb: any) => {
                            if (kb.command && kb.key) {
                                keybindings[kb.command] = kb.key;
                                console.log('[SettingsView] User override:', kb.command, '->', kb.key);
                            }
                        });
                    }
                    console.log('[SettingsView] User keybindings loaded, total now:', Object.keys(keybindings).length);
                } catch (parseError) {
                    console.error('[SettingsView] Failed to parse keybindings.json:', parseError);
                }
            } else {
                console.log('[SettingsView] Keybindings file does not exist yet, using defaults only');
            }
            
            // Send keybindings to webview (including defaults + overrides)
            console.log('[SettingsView] Sending keybindings to webview...');
            console.log('[SettingsView] ReType keybindings to display:', {
                'retype.togglePractice': keybindings['retype.togglePractice'],
                'retype.startPractice': keybindings['retype.startPractice'],
                'retype.stopPractice': keybindings['retype.stopPractice'],
                'retype.resetSession': keybindings['retype.resetSession'],
                'retype.pasteAndPractice': keybindings['retype.pasteAndPractice'],
                'retype.configureKeybinds': keybindings['retype.configureKeybinds']
            });
            
            webviewView.webview.postMessage({
                command: 'loadKeybindings',
                keybindings: keybindings
            });
            console.log('[SettingsView] Keybindings message sent to webview');
        } catch (error) {
            console.error('[SettingsView] Error loading keybindings:', error);
        }
    }

    private async resetKeybindsToDefault(): Promise<void> {
        try {
            const fs = require('fs');
            const path = require('path');
            const keybindingsPath = this.getKeybindingsPath();

            console.log('[SettingsView] Resetting keybindings to defaults');
            console.log('[SettingsView] Keybindings path:', keybindingsPath);

            // Read existing keybindings
            let currentKeybindings: any[] = [];
            
            if (fs.existsSync(keybindingsPath)) {
                try {
                    const content = fs.readFileSync(keybindingsPath, 'utf-8');
                    const cleanedContent = content
                        .replace(/\/\*[\s\S]*?\*\//g, '')
                        .replace(/\/\/.*$/gm, '');
                    currentKeybindings = JSON.parse(cleanedContent);
                    if (!Array.isArray(currentKeybindings)) {
                        currentKeybindings = [];
                    }
                } catch (parseError) {
                    // If parsing fails, start fresh
                    currentKeybindings = [];
                }
            }

            console.log('[SettingsView] Current keybindings before reset:', currentKeybindings);

            // Remove ALL retype.* keybindings from keybindings.json
            // VS Code will fall back to extension defaults from package.json
            const beforeRemoval = currentKeybindings.length;
            currentKeybindings = currentKeybindings.filter((kb: any) => {
                if (!kb.command) return true;
                // Remove any command that starts with 'retype.' or '-retype.'
                return !kb.command.startsWith('retype.') && !kb.command.startsWith('-retype.');
            });
            const afterRemoval = currentKeybindings.length;
            
            console.log(`[SettingsView] Removed ${beforeRemoval - afterRemoval} retype keybindings from keybindings.json`);
            console.log('[SettingsView] VS Code will now use extension defaults from package.json');

            // Write the cleaned keybindings back to file
            const jsonContent = JSON.stringify(currentKeybindings, null, 4);
            console.log(`[SettingsView] Updated keybindings.json:`, jsonContent);
            fs.writeFileSync(keybindingsPath, jsonContent, 'utf-8');
            
            console.log('[SettingsView] Successfully reset all ReType keybindings to defaults');
        } catch (error) {
            console.error('[SettingsView] Error resetting keybindings:', error);
            throw new Error(`Failed to reset keybindings: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private getKeybindStatus(command: string): string {
        // For now, return checked as all commands are active by default
        // In a real implementation, you would check the actual keybind configuration
        return 'checked';
    }

    private getWebviewContent(webview: vscode.Webview): string {
        const config = vscode.workspace.getConfiguration('retype');
        const showStats = config.get<boolean>('showRealTimeStats', true);
        const theme = config.get<string>('theme', 'solarized-light');

        const keybindStatusToggle = this.getKeybindStatus('retype.togglePractice');
        const keybindStatusStart = this.getKeybindStatus('retype.startPractice');
        const keybindStatusStop = this.getKeybindStatus('retype.stopPractice');
        const keybindStatusReset = this.getKeybindStatus('retype.resetSession');
        const keybindStatusPaste = this.getKeybindStatus('retype.pasteAndPractice');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 16px;
            font-size: 13px;
            line-height: 1.6;
        }

        .settings-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .settings-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .settings-header h1 {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
        }

        .settings-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .settings-section-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
        }

        .setting-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 12px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            transition: all 0.2s ease;
        }

        .setting-item:hover {
            background-color: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
        }

        .setting-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }

        .setting-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-left: 24px;
        }

        .setting-control {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 24px;
        }

        input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: var(--vscode-focusBorder);
        }

        .keybind-input {
            padding: 6px 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 12px;
            font-family: monospace;
            cursor: text;
            flex: 1;
            max-width: 200px;
        }

        .keybind-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .keybind-input.recording {
            background-color: var(--vscode-list-activeSelectionBackground);
            border-color: var(--vscode-focusBorder);
        }

        select {
            padding: 6px 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        select:hover {
            border-color: var(--vscode-focusBorder);
        }

        select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }

        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .status-badge.enabled {
            background-color: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }

        .status-badge.disabled {
            background-color: rgba(244, 67, 54, 0.2);
            color: #f44336;
        }

        .button-group {
            display: flex;
            gap: 8px;
            margin-top: 16px;
        }

        button {
            flex: 1;
            padding: 8px 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button:active {
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="settings-container">
        <div class="settings-section">
            <div class="settings-section-title">Practice Settings</div>
            
            <div class="setting-item">
                <div class="setting-label">
                    Show Real-Time Stats
                    <span class="status-badge ${showStats ? 'enabled' : 'disabled'}" id="statsBadge">
                        ${showStats ? '✓ ON' : '✗ OFF'}
                    </span>
                </div>
                <div class="setting-description">
                    Display typing statistics (WPM, accuracy, errors) in the status bar during practice sessions
                </div>
                <div class="setting-control">
                    <input type="checkbox" id="showStats" ${showStats ? 'checked' : ''}>
                    <label for="showStats" style="margin: 0; cursor: pointer;">Enable real-time statistics</label>
                </div>
            </div>

            <div class="setting-item">
                <div class="setting-label">
                    Paste & Practice
                </div>
                <div class="setting-description">
                    Paste clipboard content and start practice (default: Ctrl+Shift+V)
                </div>
                <div class="setting-control">
                    <input type="text" id="pasteAndPracticeKeybindInput" class="keybind-input" placeholder="Press keys..." data-command="retype.pasteAndPractice">
                </div>
            </div>

            <div class="setting-item">
                <div class="setting-label">
                    Configure Keybinds
                </div>
                <div class="setting-description">
                    Open the keybindings configuration (default: None)
                </div>
                <div class="setting-control">
                    <input type="text" id="configureKeybindsKeybindInput" class="keybind-input" placeholder="Press keys..." data-command="retype.configureKeybinds">
                </div>
            </div>
            </div>
            </div>
        </div>

        <div class="settings-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div class="settings-section-title">Keybinds</div>
                <button id="resetKeybindsBtn" style="flex:0; padding:4px 24px; font-size:10px; margin:0; min-width:120px;">Reset Keybinds</button>
            </div>
            
            <div class="setting-item">
                <div class="setting-label">
                    Toggle Practice Mode
                </div>
                <div class="setting-description">
                    Start or stop practice mode (default: Ctrl+\`)</div>
                <div class="setting-control">
                    <input type="text" id="togglePracticeKeybindInput" class="keybind-input" placeholder="Press keys..." data-command="retype.togglePractice">
                </div>
            </div>

            <div class="setting-item">
                <div class="setting-label">
                    Start Practice Mode
                </div>
                <div class="setting-description">
                    Start practice mode (default: Ctrl+Shift+R)
                </div>
                <div class="setting-control">
                    <input type="text" id="startPracticeKeybindInput" class="keybind-input" placeholder="Press keys..." data-command="retype.startPractice">
                </div>
            </div>

            <div class="setting-item">
                <div class="setting-label">
                    Stop Practice Mode
                </div>
                <div class="setting-description">
                    Stop practice mode (default: Ctrl+Shift+Q)
                </div>
                <div class="setting-control">
                    <input type="text" id="stopPracticeKeybindInput" class="keybind-input" placeholder="Press keys..." data-command="retype.stopPractice">
                </div>
            </div>

            <div class="setting-item">
                <div class="setting-label">
                    Paste & Practice
                </div>
                <div class="setting-description">
                    Paste clipboard content and start practice (default: Ctrl+Shift+V)
                </div>
                <div class="setting-control">
                    <input type="text" id="pasteAndPracticeKeybindInput" class="keybind-input" placeholder="Press keys..." data-command="retype.pasteAndPractice">
                </div>
            </div>

            <div class="setting-item">
                <div class="setting-label">
                    Reset Session
                </div>
                <div class="setting-description">
                    Reset current practice session (default: None)
                </div>
                <div class="setting-control">
                    <input type="text" id="resetSessionKeybindInput" class="keybind-input" placeholder="Press keys..." data-command="retype.resetSession">
                </div>
            </div>
            </div>
        </div>

        <div class="button-group">
            <button id="openSettingsBtn">Open Extension Settings</button>
            <button id="configureKeybindsBtn">Configure Keybinds</button>
        </div>
    </div>

    <script>
        const vscodeApi = acquireVsCodeApi();

        // Handle checkbox toggle
        document.getElementById('showStats').addEventListener('change', (e) => {
            vscodeApi.postMessage({
                command: 'toggleStats',
                value: e.target.checked
            });
        });

        // Handle open settings button
        document.getElementById('openSettingsBtn').addEventListener('click', () => {
            vscodeApi.postMessage({
                command: 'openSettings'
            });
        });

        // Handle configure keybinds button
        document.getElementById('configureKeybindsBtn').addEventListener('click', () => {
            vscodeApi.postMessage({
                command: 'configureKeybinds'
            });
        });

        // Handle reset keybinds button
        document.getElementById('resetKeybindsBtn').addEventListener('click', () => {
            // Send debug message to extension console
            vscodeApi.postMessage({
                command: 'debugLog',
                message: '[SettingsView] Reset button clicked'
            });
            
            // Send reset message to extension
            // Confirmation will be handled by VS Code's native dialog in the extension
            vscodeApi.postMessage({
                command: 'resetKeybindsToDefault'
            });
            
            // Send debug message to extension console
            vscodeApi.postMessage({
                command: 'debugLog',
                message: '[SettingsView] Message sent to extension'
            });
        });

        // Handle keybind input fields
        const keybindInputs = document.querySelectorAll('.keybind-input');
        
        keybindInputs.forEach(input => {
            input.setAttribute('data-original', input.value);

            input.addEventListener('focus', (e) => {
                e.target.classList.add('recording');
                e.target.setAttribute('data-original', e.target.value);
                e.target.value = '';
                e.target.placeholder = 'Recording... (Del to clear, Esc to cancel)';
            });

            input.addEventListener('blur', (e) => {
                e.target.classList.remove('recording');
                e.target.placeholder = 'Press keys...';
            });

            input.addEventListener('keydown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Handle Delete/Backspace - clear keybind
                if (e.code === 'Delete' || e.code === 'Backspace') {
                    e.target.value = '';
                    vscodeApi.postMessage({
                        command: 'setKeybind',
                        keybind: e.target.dataset.command,
                        key: ''
                    });
                    e.target.blur();
                    return;
                }
                
                // Handle Escape - restore original
                if (e.code === 'Escape') {
                    const original = e.target.getAttribute('data-original') || '';
                    e.target.value = original;
                    e.target.blur();
                    return;
                }
                
                const keys = [];
                if (e.ctrlKey) keys.push('Ctrl');
                if (e.shiftKey) keys.push('Shift');
                if (e.altKey) keys.push('Alt');
                if (e.metaKey) keys.push('Cmd');
                
                if (e.key && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
                    const keyName = e.key === ' ' ? 'Space' : e.key.toUpperCase();
                    keys.push(keyName);
                }
                
                const keybind = keys.join('+');
                e.target.value = keybind;
                
                if (keys.length > 1) {
                    vscodeApi.postMessage({
                        command: 'setKeybind',
                        keybind: e.target.dataset.command,
                        key: keybind
                    });
                }
            });

            input.addEventListener('keyup', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            });
        });

        // Listen for update messages
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'updateStats') {
                // Update checkbox and badge without reloading
                const checkbox = document.getElementById('showStats');
                const badge = document.getElementById('statsBadge');
                checkbox.checked = message.value;
                badge.textContent = message.value ? '✓ ON' : '✗ OFF';
                badge.className = 'status-badge ' + (message.value ? 'enabled' : 'disabled');
            } else if (message.command === 'loadKeybindings') {
                // Load keybindings into input fields
                const keybindings = message.keybindings || {};
                const keybindMap = {
                    'retype.togglePractice': 'togglePracticeKeybindInput',
                    'retype.startPractice': 'startPracticeKeybindInput',
                    'retype.stopPractice': 'stopPracticeKeybindInput',
                    'retype.resetSession': 'resetSessionKeybindInput',
                    'retype.pasteAndPractice': 'pasteAndPracticeKeybindInput',
                    'retype.configureKeybinds': 'configureKeybindsKeybindInput'
                };
                
                for (const [command, inputId] of Object.entries(keybindMap)) {
                    const input = document.getElementById(inputId);
                    if (input && keybindings[command]) {\n                        input.value = keybindings[command];\n                        input.setAttribute('data-original', keybindings[command]);\n                    }\n                }\n            }
        });
    </script>
</body>
</html>`;
    }
}
