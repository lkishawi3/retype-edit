import * as vscode from 'vscode';
import { RetypeMode } from './retypeMode';

export function registerCommands(context: vscode.ExtensionContext, retypeMode: RetypeMode) {
    // Toggle Practice Mode command (used for both start and stop with same keybinding)
    const togglePracticeCommand = vscode.commands.registerCommand('retype.togglePractice', async () => {
        if (retypeMode.isActive()) {
            // Stop practice if already active
            retypeMode.stopPractice();
            vscode.window.showInformationMessage('ReType: Practice mode stopped');
        } else {
            // Start practice if not active
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showWarningMessage('ReType: Please open a file to start practice mode');
                return;
            }

            try {
                await retypeMode.startPractice(activeEditor);
                vscode.window.showInformationMessage('ReType: Practice mode started! Start typing to begin.');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`ReType: ${errorMessage}`);
            }
        }
    });

    // Start Practice Mode command
    const startPracticeCommand = vscode.commands.registerCommand('retype.startPractice', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('ReType: Please open a file to start practice mode');
            return;
        }

        if (retypeMode.isActive()) {
            vscode.window.showInformationMessage('ReType: Practice mode is already active');
            return;
        }

        try {
            await retypeMode.startPractice(activeEditor);
            vscode.window.showInformationMessage('ReType: Practice mode started! Start typing to begin.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`ReType: ${errorMessage}`);
        }
    });

    // Stop Practice Mode command
    const stopPracticeCommand = vscode.commands.registerCommand('retype.stopPractice', () => {
        if (!retypeMode.isActive()) {
            vscode.window.showWarningMessage('ReType: Practice mode is not active');
            return;
        }

        retypeMode.stopPractice();
        vscode.window.showInformationMessage('ReType: Practice mode stopped');
    });

    // Reset Current Session command
    const resetSessionCommand = vscode.commands.registerCommand('retype.resetSession', () => {
        if (!retypeMode.isActive()) {
            vscode.window.showWarningMessage('ReType: Practice mode is not active');
            return;
        }

        retypeMode.resetSession();
        vscode.window.showInformationMessage('ReType: Current practice session restarted from the beginning');
    });

    // Configure ReType keybinds command
    const configureKeybindsCommand = vscode.commands.registerCommand('retype.configureKeybinds', async () => {
        // Open the global keybindings UI with the filter pre-filled to "retype"
        // so only ReType-related keybindings are shown.
        await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', 'retype.');
    });

    // Paste & Practice command: reads clipboard content, inserts it at the cursor,
    // selects the inserted text, then starts a normal practice session on that selection.
    const pasteAndPracticeCommand = vscode.commands.registerCommand('retype.pasteAndPractice', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('ReType: Please open a file first');
            return;
        }

        if (retypeMode.isActive()) {
            vscode.window.showWarningMessage('ReType: Practice mode is already active');
            return;
        }

        const clipboardText = await vscode.env.clipboard.readText();

        if (!clipboardText || clipboardText.trim().length === 0) {
            vscode.window.showWarningMessage('ReType: Clipboard is empty. Copy some code first, then use Paste & Practice.');
            return;
        }

        try {
            // 1) Insert clipboard text into the document at the current cursor position
            const insertPosition = activeEditor.selection.active;
            const inserted = await activeEditor.edit(editBuilder => {
                editBuilder.insert(insertPosition, clipboardText);
            });

            if (!inserted) {
                throw new Error('Failed to insert text into document');
            }

            // 2) Select the inserted text
            const document = activeEditor.document;
            const startOffset = document.offsetAt(insertPosition);
            const endOffset = startOffset + clipboardText.length;
            const endPosition = document.positionAt(endOffset);
            activeEditor.selection = new vscode.Selection(insertPosition, endPosition);

            // 3) Delegate to the existing startPractice for identical behavior
            await retypeMode.startPractice(activeEditor);

            vscode.window.showInformationMessage('ReType: Paste & Practice started! Type to practice the inserted text.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`ReType: ${errorMessage}`);
        }
    });

    // Register all commands
    context.subscriptions.push(
        togglePracticeCommand,
        startPracticeCommand,
        stopPracticeCommand,
        resetSessionCommand,
        configureKeybindsCommand,
        pasteAndPracticeCommand
    );
}
