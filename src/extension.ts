import * as vscode from 'vscode';
import { RetypeMode } from './retypeMode';
import { registerCommands } from './commands';
import { StatsTracker } from './statsTracker';
import { SettingsView } from './settingsView';

let retypeMode: RetypeMode | undefined;
let statsTracker: StatsTracker | undefined;
let settingsView: SettingsView | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('ReType extension is now active!');
    console.log('[ReType] Starting initialization...');

    try {
        // Initialize core components
        console.log('[ReType] Creating StatsTracker...');
        statsTracker = new StatsTracker();
        console.log('[ReType] StatsTracker created successfully');

        console.log('[ReType] Creating RetypeMode...');
        retypeMode = new RetypeMode(context, statsTracker);
        console.log('[ReType] RetypeMode created successfully');

        console.log('[ReType] Creating SettingsView...');
        settingsView = new SettingsView(context);
        console.log('[ReType] SettingsView created successfully');
        console.log('[ReType] SettingsView instance:', settingsView);

        // Register all commands
        console.log('[ReType] Registering commands...');
        registerCommands(context, retypeMode);
        console.log('[ReType] Commands registered successfully');
    } catch (error) {
        console.error('[ReType] Error during activation:', error);
        throw error;
    }

    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    // Update status bar when active
    const updateStatusBar = () => {
        if (retypeMode?.isActive()) {
            const stats = statsTracker?.getCurrentStats();
            statusBarItem.text = `$(keyboard) ReType: ${stats?.wpm || 0} WPM | ${stats?.accuracy || 100}% | ${stats?.errors || 0} errors`;
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    };

    // Listen for typing mode changes
    retypeMode.onModeChanged(updateStatusBar);

    // Update status bar periodically during active sessions
    setInterval(updateStatusBar, 1000);
}

export function deactivate() {
    if (retypeMode) {
        retypeMode.dispose();
        retypeMode = undefined;
    }
    if (statsTracker) {
        statsTracker.dispose();
        statsTracker = undefined;
    }
    if (settingsView) {
        settingsView.dispose();
        settingsView = undefined;
    }
}
