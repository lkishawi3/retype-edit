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
            }
        });
    }

    private getWebviewContent(webview: vscode.Webview): string {
        const config = vscode.workspace.getConfiguration('retype');
        const showStats = config.get<boolean>('showRealTimeStats', true);
        const theme = config.get<string>('theme', 'solarized-light');

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
                    Color Theme
                </div>
                <div class="setting-description">
                    Choose the color theme for the typing practice interface
                </div>
                <div class="setting-control">
                    <select id="themeSelect">
                        <option value="solarized-light" ${theme === 'solarized-light' ? 'selected' : ''}>Solarized Light</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="button-group">
            <button id="openSettingsBtn">Open Extension Settings</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // Handle checkbox toggle
        document.getElementById('showStats').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'toggleStats',
                value: e.target.checked
            });
        });

        // Handle open settings button
        document.getElementById('openSettingsBtn').addEventListener('click', () => {
            vscode.postMessage({
                command: 'openSettings'
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
            }
        });
    </script>
</body>
</html>`;
    }
}
