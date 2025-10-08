import { GoogleGenerativeAI } from '@google/generative-ai';
import * as vscode from 'vscode';

export class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const config = vscode.workspace.getConfiguration('zerox');
    const apiKey = config.get<string>('geminiApiKey');
    
    if (!apiKey) {
      vscode.window.showWarningMessage(
        'ZeroX: Please set your Gemini API key in settings'
      );
      return;
    }

    const modelName = config.get<string>('model') || 'gemini-2.0-flash-exp';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  async chat(messages: any[], tools: any[]): Promise<any> {
    if (!this.model) {
      this.initialize();
      if (!this.model) {
        throw new Error('Gemini API not initialized. Please check your API key.');
      }
    }

    const chat = this.model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    
    return result.response;
  }

  getSystemPrompt(): string {
    return `You are ZeroX, an advanced AI code agent integrated into VS Code. You can:

1. Execute terminal commands
2. Read, write, modify, and delete files and directories
3. Search the web for information
4. Make git commits and manage version control
5. Analyze codebases and provide insights

IMPORTANT THINKING PROCESS:
Before taking ANY action, you MUST:
1. Break down the user's request into clear, atomic tasks
2. Create a mental checklist of steps needed
3. Consider edge cases and potential issues
4. Think about the current project context
5. Plan the order of operations

When responding:
1. First, create a numbered todo list of tasks you'll perform
2. Execute each task step-by-step
3. Use the appropriate tools for each task
4. Provide clear feedback on what you're doing
5. Report results and any issues encountered

Available Tools:
- execute_command: Run terminal commands
- read_file: Read file contents
- write_file: Create or overwrite a file
- edit_file: Modify specific parts of a file
- delete_file: Delete a file
- create_directory: Create a new directory
- list_directory: List directory contents
- search_web: Search the web using Google
- git_commit: Make a git commit
- git_status: Check git status
- get_current_file: Get the currently open file

Always think step-by-step and be thorough in your approach. Safety first - ask for confirmation before potentially destructive operations unless auto-execute is enabled.`;
  }

  getTools(): any[] {
    return [
      {
        name: 'execute_command',
        description: 'Execute a terminal command in the workspace',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to execute',
            },
            cwd: {
              type: 'string',
              description: 'Working directory (optional)',
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file relative to workspace',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file (creates or overwrites)',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file',
            },
            content: {
              type: 'string',
              description: 'Content to write',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'edit_file',
        description: 'Edit specific lines or sections of a file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file',
            },
            search: {
              type: 'string',
              description: 'Text to search for',
            },
            replace: {
              type: 'string',
              description: 'Text to replace with',
            },
          },
          required: ['path', 'search', 'replace'],
        },
      },
      {
        name: 'delete_file',
        description: 'Delete a file or directory',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to delete',
            },
            recursive: {
              type: 'boolean',
              description: 'Delete recursively for directories',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_web',
        description: 'Search the web using Google Custom Search',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            num_results: {
              type: 'number',
              description: 'Number of results (1-10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'git_status',
        description: 'Get current git status',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'git_commit',
        description: 'Make a git commit',
        parameters: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Commit message',
            },
            files: {
              type: 'array',
              items: { type: 'string' },
              description: 'Files to commit (empty for all staged)',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'get_current_file',
        description: 'Get the path and content of the currently open file in the editor',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }
}