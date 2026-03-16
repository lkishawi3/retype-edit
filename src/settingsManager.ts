import * as vscode from 'vscode';

export class SettingsManager {
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.registerCommands();
    }

    private registerCommands(): void {
        const openSettingsCommand = vscode.commands.registerCommand('retype.openSettings', async () => {
            await vscode.commands.executeCommand('retypeSettingsView.focus');
        });

        this.disposables.push(openSettingsCommand);
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
