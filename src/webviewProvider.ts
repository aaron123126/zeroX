import * as vscode from 'vscode';
import { GeminiClient } from './geminiClient';
import { TaskManager } from './taskManager';
import { FileOperations } from './fileOperations';
import { TerminalManager } from './terminalManager';
import { GitOperations } from './gitOperations';
import { WebSearch } from './webSearch';
import { Message, Task, ToolCall } from './types';

export class WebviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private gemini: GeminiClient;
  private taskManager: TaskManager;
  private fileOps: FileOperations;
  private terminal: TerminalManager;
  private git: GitOperations;
  private webSearch: WebSearch;
  private messages: Message[] = [];
  private isProcessing = false;

  constructor(private readonly extensionUri: vscode.Uri) {
    this.gemini = new GeminiClient();
    this.taskManager = new TaskManager();
    this.fileOps = new FileOperations();
    this.terminal = new TerminalManager();
    this.git = new GitOperations(this.terminal);
    this.webSearch = new WebSearch();

    this.taskManager.setUpdateCallback((tasks) => {
      this.sendMessageToWebview({ type: 'updateTasks', tasks });
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'sendMessage':
          await this.handleUserMessage(data.message);
          break;
        case 'newConversation':
          this.newConversation();
          break;
        case 'stopExecution':
          this.stopExecution();
          break;
        case 'confirmAction':
          await this.executeToolCall(data.toolCall);
          break;
        case 'rejectAction':
          this.sendAssistantMessage('Action cancelled by user.');
          break;
      }
    });
  }

  private async handleUserMessage(content: string) {
    if (this.isProcessing) {
      vscode.window.showWarningMessage('ZeroX is currently processing. Please wait...');
      return;
    }

    this.isProcessing = true;
    this.taskManager.clearTasks();

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    this.messages.push(userMessage);
    this.sendMessageToWebview({ type: 'addMessage', message: userMessage });

    try {
      await this.processWithGemini();
    } catch (error: any) {
      this.sendAssistantMessage(`Error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processWithGemini() {
    const systemPrompt = this.gemini.getSystemPrompt();
    const tools = this.gemini.getTools();

    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...this.messages,
    ];

    let continueProcessing = true;
    let iterationCount = 0;
    const maxIterations = 10;

    while (continueProcessing && iterationCount < maxIterations) {
      iterationCount++;

      const response = await this.gemini.chat(conversationMessages, tools);
      
      // Handle function calls
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          const result = await this.handleToolCall(call.name, call.args);
          
          // Add function result to conversation
          conversationMessages.push({
            role: 'function',
            name: call.name,
            content: JSON.stringify(result),
          });
        }
      } else {
        // Regular text response
        const text = response.text();
        if (text) {
          this.sendAssistantMessage(text);
          this.messages.push({
            role: 'assistant',
            content: text,
            timestamp: Date.now(),
          });
        }
        continueProcessing = false;
      }
    }
  }

  private async handleToolCall(toolName: string, params: any): Promise<any> {
    const task = this.taskManager.createTask(`${toolName}: ${JSON.stringify(params)}`);
    this.taskManager.updateTask(task.id, { status: 'in-progress' });

    try {
      let result: any;

      // Check if auto-execute is enabled
      const config = vscode.workspace.getConfiguration('zerox');
      const autoExecute = config.get<boolean>('autoExecuteCommands');

      // For destructive operations, always ask for confirmation unless auto-execute is on
      const destructiveOps = ['delete_file', 'execute_command', 'git_commit', 'write_file'];
      if (!autoExecute && destructiveOps.includes(toolName)) {
        const shouldExecute = await this.requestConfirmation(toolName, params);
        if (!shouldExecute) {
          this.taskManager.updateTask(task.id, { 
            status: 'failed', 
            error: 'Cancelled by user' 
          });
          return { error: 'Cancelled by user' };
        }
      }

      switch (toolName) {
        case 'execute_command':
          result = await this.terminal.executeCommand(params.command, params.cwd);
          this.sendToolOutput(toolName, result);
          break;

        case 'read_file':
          result = await this.fileOps.readFile(params.path);
          this.sendToolOutput(toolName, { path: params.path, content: result });
          break;

        case 'write_file':
          await this.fileOps.writeFile(params.path, params.content);
          result = { success: true, path: params.path };
          this.sendToolOutput(toolName, result);
          break;

        case 'edit_file':
          await this.fileOps.editFile(params.path, params.search, params.replace);
          result = { success: true, path: params.path };
          this.sendToolOutput(toolName, result);
          break;

        case 'delete_file':
          await this.fileOps.deleteFile(params.path, params.recursive);
          result = { success: true, path: params.path };
          this.sendToolOutput(toolName, result);
          break;

        case 'create_directory':
          await this.fileOps.createDirectory(params.path);
          result = { success: true, path: params.path };
          this.sendToolOutput(toolName, result);
          break;

        case 'list_directory':
          result = await this.fileOps.listDirectory(params.path);
          this.sendToolOutput(toolName, { path: params.path, entries: result });
          break;

        case 'search_web':
          result = await this.webSearch.search(params.query, params.num_results || 5);
          this.sendToolOutput(toolName, result);
          break;

        case 'git_status':
          result = await this.git.getStatus();
          this.sendToolOutput(toolName, result);
          break;

        case 'git_commit':
          result = await this.git.commit(params.message, params.files);
          this.sendToolOutput(toolName, result);
          break;

        case 'get_current_file':
          result = await this.fileOps.getCurrentFile();
          this.sendToolOutput(toolName, result);
          break;

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      this.taskManager.updateTask(task.id, { status: 'completed' });
      return result;

    } catch (error: any) {
      this.taskManager.updateTask(task.id, { 
        status: 'failed', 
        error: error.message 
      });
      this.sendToolOutput(toolName, { error: error.message });
      return { error: error.message };
    }
  }

  private async requestConfirmation(toolName: string, params: any): Promise<boolean> {
    const message = `ZeroX wants to execute: ${toolName}\nParameters: ${JSON.stringify(params, null, 2)}`;
    const result = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      'Allow',
      'Deny'
    );
    return result === 'Allow';
  }

  private sendAssistantMessage(content: string) {
    const message: Message = {
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    this.sendMessageToWebview({ type: 'addMessage', message });
  }

  private sendToolOutput(toolName: string, output: any) {
    this.sendMessageToWebview({ 
      type: 'toolOutput', 
      toolName, 
      output 
    });
  }

  private sendMessageToWebview(message: any) {
    this.view?.webview.postMessage(message);
  }

  private newConversation() {
    this.messages = [];
    this.taskManager.clearTasks();
    this.sendMessageToWebview({ type: 'clearChat' });
  }

  private stopExecution() {
    this.isProcessing = false;
    this.sendAssistantMessage('Execution stopped by user.');
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZeroX AI Agent</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            padding: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header h2 {
            font-size: 16px;
            font-weight: 600;
        }

        .header button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .header button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .message {
            display: flex;
            flex-direction: column;
            gap: 8px;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message.user .message-content {
            background: var(--vscode-input-background);
            margin-left: auto;
            border: 1px solid var(--vscode-input-border);
        }

        .message.assistant .message-content {
            background: var(--vscode-editor-inactiveSelectionBackground);
            margin-right: auto;
        }

        .message-content {
            padding: 12px 16px;
            border-radius: 8px;
            max-width: 85%;
            word-wrap: break-word;
            white-space: pre-wrap;
        }

        .message-role {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            opacity: 0.7;
            margin-bottom: 4px;
        }

        .tasks-container {
            padding: 12px 16px;
            border-top: 1px solid var(--vscode-panel-border);
            background: var(--vscode-sideBar-background);
            max-height: 200px;
            overflow-y: auto;
        }

        .tasks-title {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            opacity: 0.8;
        }

        .task {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 0;
            font-size: 12px;
        }

        .task-status {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .task-status.pending {
            background: var(--vscode-charts-yellow);
        }

        .task-status.in-progress {
            background: var(--vscode-charts-blue);
            animation: pulse 1.5s ease-in-out infinite;
        }

        .task-status.completed {
            background: var(--vscode-charts-green);
        }

        .task-status.failed {
            background: var(--vscode-charts-red);
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .input-container {
            padding: 16px;
            border-top: 1px solid var(--vscode-panel-border);
            display: flex;
            gap: 8px;
        }

        .input-box {
            flex: 1;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            padding: 10px 12px;
            font-size: 13px;
            font-family: inherit;
            resize: none;
            min-height: 40px;
            max-height: 120px;
        }

        .input-box:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .send-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 6px;
            padding: 0 20px;
            cursor: pointer;
            font-weight: 500;
            font-size: 13px;
        }

        .send-button:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
        }

        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .tool-output {
            background: var(--vscode-textCodeBlock-background);
            border-left: 3px solid var(--vscode-charts-purple);
            padding: 8px 12px;
            margin-top: 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            overflow-x: auto;
        }

        .tool-name {
            color: var(--vscode-charts-purple);
            font-weight: 600;
            margin-bottom: 4px;
        }

        code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🤖 ZeroX AI Agent</h2>
        <button onclick="newConversation()">New Chat</button>
    </div>

    <div class="chat-container" id="chatContainer"></div>

    <div class="tasks-container" id="tasksContainer" style="display: none;">
        <div class="tasks-title">Current Tasks:</div>
        <div id="tasksList"></div>
    </div>

    <div class="input-container">
        <textarea 
            class="input-box" 
            id="messageInput" 
            placeholder="Ask ZeroX to help with your code..."
            rows="1"
        ></textarea>
        <button class="send-button" id="sendButton" onclick="sendMessage()">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const tasksContainer = document.getElementById('tasksContainer');
        const tasksList = document.getElementById('tasksList');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Send on Enter (Shift+Enter for new line)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            vscode.postMessage({
                type: 'sendMessage',
                message: message
            });

            messageInput.value = '';
            messageInput.style.height = 'auto';
            sendButton.disabled = true;
        }

        function newConversation() {
            vscode.postMessage({ type: 'newConversation' });
        }

        function addMessage(message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${message.role}\`;
            
            const content = escapeHtml(message.content)
                .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
                .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
                .replace(/\\n/g, '<br>');

            messageDiv.innerHTML = \`
                <div class="message-role">\${message.role}</div>
                <div class="message-content">\${content}</div>
            \`;

            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            sendButton.disabled = false;
        }

        function updateTasks(tasks) {
            if (tasks.length === 0) {
                tasksContainer.style.display = 'none';
                return;
            }

            tasksContainer.style.display = 'block';
            tasksList.innerHTML = tasks.map(task => \`
                <div class="task">
                    <div class="task-status \${task.status}"></div>
                    <div>\${escapeHtml(task.description)}</div>
                </div>
            \`).join('');
        }

        function addToolOutput(toolName, output) {
            const outputDiv = document.createElement('div');
            outputDiv.className = 'tool-output';
            outputDiv.innerHTML = \`
                <div class="tool-name">🔧 \${toolName}</div>
                <pre>\${escapeHtml(JSON.stringify(output, null, 2))}</pre>
            \`;
            chatContainer.appendChild(outputDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function clearChat() {
            chatContainer.innerHTML = '';
            tasksList.innerHTML = '';
            tasksContainer.style.display = 'none';
            sendButton.disabled = false;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'addMessage':
                    addMessage(message.message);
                    break;
                case 'updateTasks':
                    updateTasks(message.tasks);
                    break;
                case 'toolOutput':
                    addToolOutput(message.toolName, message.output);
                    break;
                case 'clearChat':
                    clearChat();
                    break;
            }
        });
    </script>
</body>
</html>`;
  }
}