import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export class FileOperations {
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.workspaceRoot, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.workspaceRoot, relativePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async editFile(relativePath: string, search: string, replace: string): Promise<void> {
    const content = await this.readFile(relativePath);
    const newContent = content.replace(new RegExp(search, 'g'), replace);
    await this.writeFile(relativePath, newContent);
  }

  async deleteFile(relativePath: string, recursive: boolean = false): Promise<void> {
    const fullPath = path.join(this.workspaceRoot, relativePath);
    if (recursive) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }
  }

  async createDirectory(relativePath: string): Promise<void> {
    const fullPath = path.join(this.workspaceRoot, relativePath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  async listDirectory(relativePath: string): Promise<string[]> {
    const fullPath = path.join(this.workspaceRoot, relativePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map(entry => 
      entry.isDirectory() ? `${entry.name}/` : entry.name
    );
  }

  async getCurrentFile(): Promise<{ path: string; content: string } | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const document = editor.document;
    const relativePath = vscode.workspace.asRelativePath(document.uri);
    
    return {
      path: relativePath,
      content: document.getText(),
    };
  }
}