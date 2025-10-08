import { TerminalManager } from './terminalManager';

export class GitOperations {
  private terminal: TerminalManager;

  constructor(terminal: TerminalManager) {
    this.terminal = terminal;
  }

  async getStatus(): Promise<string> {
    const result = await this.terminal.executeCommand('git status --porcelain');
    return result.stdout + result.stderr;
  }

  async commit(message: string, files?: string[]): Promise<string> {
    let commands = [];
    
    if (files && files.length > 0) {
      commands.push(`git add ${files.join(' ')}`);
    } else {
      // Check if there are staged files, if not, stage all
      const status = await this.terminal.executeCommand('git diff --cached --name-only');
      if (!status.stdout.trim()) {
        commands.push('git add -A');
      }
    }
    
    commands.push(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    
    const result = await this.terminal.executeCommand(commands.join(' && '));
    return result.stdout + result.stderr;
  }

  async getCurrentBranch(): Promise<string> {
    const result = await this.terminal.executeCommand('git branch --show-current');
    return result.stdout.trim();
  }

  async getRecentCommits(count: number = 5): Promise<string> {
    const result = await this.terminal.executeCommand(`git log -${count} --oneline`);
    return result.stdout;
  }
}