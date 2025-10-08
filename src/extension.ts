import * as vscode from 'vscode';
import { WebviewProvider } from './webviewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('ZeroX AI Agent is now active!');

  const provider = new WebviewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('zerox.chatView', provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('zerox.openChat', () => {
      vscode.commands.executeCommand('zerox-sidebar.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('zerox.newConversation', () => {
      vscode.commands.executeCommand('zerox-sidebar.focus');
    })
  );

  // Show welcome message
  vscode.window.showInformationMessage('ZeroX AI Agent activated! Click the robot icon in the sidebar to start.');
}

export function deactivate() {}