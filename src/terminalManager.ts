import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TerminalManager {
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  }

  async executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> {
    const execOptions = {
      cwd: cwd || this.workspaceRoot,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    };

    try {
      const { stdout, stderr } = await execAsync(command, execOptions);
      return { stdout, stderr };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
      };
    }
  }

  async executeInTerminal(command: string, name: string = 'ZeroX'): Promise<void> {
    const terminal = vscode.window.terminals.find(t => t.name === name) ||
                     vscode.window.createTerminal(name);
    
    terminal.show();
    terminal.sendText(command);
  }
}