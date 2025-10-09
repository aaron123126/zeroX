Complete Installation & Debugging Guide
Table of Contents

    For End Users
    For Developers
    Configuration
    Troubleshooting

For End Users (Installation)
Method 1: Install from VSIX (Recommended for Testing)
Prerequisites

    VS Code version 1.85.0 or higher
    Node.js 18+ (only if building from source)

Steps:

    Download or Build the Extension

    If you have the .vsix file, skip to step 2.

    To build from source:

Bash

# Clone or download the extension code
cd zerox-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm install -g @vscode/vsce
vsce package

This creates zerox-ai-agent-1.0.0.vsix

Install in VS Code

Option A: Via Command Line

Bash

    code --install-extension zerox-ai-agent-1.0.0.vsix

    Option B: Via VS Code UI
        Open VS Code
        Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
        Type: Extensions: Install from VSIX
        Select the .vsix file
        Click "Install"
        Reload VS Code when prompted

    Verify Installation
        Look for the robot icon (🤖) in the Activity Bar (left sidebar)
        Or press Ctrl+Shift+P and type "ZeroX" - you should see ZeroX commands

Method 2: Install from VS Code Marketplace (When Published)

    Open VS Code
    Go to Extensions (Ctrl+Shift+X)
    Search for "ZeroX AI Agent"
    Click "Install"

First-Time Setup

    Get Your Gemini API Key
        Go to Google AI Studio
        Click "Create API Key"
        Copy the key

    Configure the Extension
        Open VS Code Settings (Ctrl+, or Cmd+,)
        Search for "ZeroX"
        Paste your API key in Zerox: Gemini Api Key

    Start Using ZeroX
        Click the robot icon in the Activity Bar
        Type a message in the chat
        Example: "Explain what this file does" (with a file open)

For Developers (Setup & Debugging)
Prerequisites
Required Software

    VS Code: Version 1.85.0 or higher
    Node.js: Version 18.x or higher (LTS recommended)
    npm: Version 9.x or higher (comes with Node.js)
    Git: For version control

Check Your Versions

Bash

node --version    # Should be v18.x.x or higher
npm --version     # Should be 9.x.x or higher
code --version    # Should be 1.85.0 or higher

Initial Setup
1. Clone the Repository

Bash

git clone <your-repo-url>
cd zerox-vscode

2. Install Dependencies

Bash

# Install all required packages
npm install

# This installs:
# - TypeScript compiler
# - VS Code extension API types
# - Google Generative AI SDK
# - Axios for HTTP requests
# - ESLint for code quality
# - And more...

3. Project Structure Explanation

text

zerox-vscode/
├── src/                          # Source code (TypeScript)
│   ├── extension.ts             # Extension entry point
│   ├── geminiClient.ts          # Gemini API integration
│   ├── webviewProvider.ts       # Main UI and logic
│   ├── fileOperations.ts        # File system operations
│   ├── terminalManager.ts       # Terminal command execution
│   ├── gitOperations.ts         # Git integration
│   ├── webSearch.ts             # Google search
│   ├── taskManager.ts           # Task tracking
│   └── types.ts                 # TypeScript type definitions
├── out/                         # Compiled JavaScript (generated)
├── node_modules/                # Dependencies (generated)
├── package.json                 # Extension manifest
├── tsconfig.json                # TypeScript configuration
└── .vscodeignore               # Files to exclude from package

Development Workflow
Method 1: Using VS Code Debugger (Recommended)

    Open the Project in VS Code

Bash

code .

Open the Debug Panel

    Click the Debug icon in the Activity Bar (or Ctrl+Shift+D)
    You should see "Run Extension" in the dropdown

Set Up API Key for Testing

Create a file .vscode/settings.json in the project:

JSON

    {
      "zerox.geminiApiKey": "YOUR_API_KEY_HERE"
    }

    ⚠️ IMPORTANT: Add .vscode/settings.json to .gitignore to avoid committing your API key!

    Start Debugging
        Press F5 or click the green play button
        A new VS Code window opens (Extension Development Host)
        Your extension is now running in this window

    Test the Extension
        In the Extension Development Host window:
            Click the robot icon in the Activity Bar
            Try sending a message
            Test various features

    View Debug Output
        In your main VS Code window (not the Extension Development Host):
            Open Debug Console (Ctrl+Shift+Y)
            See console.log outputs and errors
            Set breakpoints in your code

    Make Changes
        Edit code in the main window
        Press Ctrl+Shift+F5 to reload the extension
        Or click the reload button in the debug toolbar
        Changes are reflected immediately

Method 2: Manual Compilation & Testing

    Compile TypeScript

Bash

    # One-time compilation
    npm run compile

    # Watch mode (auto-recompile on changes)
    npm run watch

    Run the Compiled Extension
        Press F5 as described above
        The compiled code in out/ is what runs

Debugging Tips
Setting Breakpoints

    In TypeScript Files
        Click left of line number to set breakpoint (red dot appears)
        Breakpoints work in .ts files thanks to source maps

    Common Places to Set Breakpoints

TypeScript

    // src/extension.ts - When extension activates
    export function activate(context: vscode.ExtensionContext) {
      console.log('Extension activated'); // <- Set breakpoint here
    }

    // src/webviewProvider.ts - When user sends message
    private async handleUserMessage(content: string) {
      console.log('User message:', content); // <- Set breakpoint here
    }

    // src/geminiClient.ts - Before API call
    async chat(messages: any[], tools: any[]): Promise<any> {
      console.log('Calling Gemini API'); // <- Set breakpoint here
    }

Viewing Logs

    Extension Host Logs
        Main VS Code window
        Debug Console panel
        Shows all console.log() outputs

    Webview Logs (UI)
        Extension Development Host window
        Ctrl+Shift+P → "Developer: Open Webview Developer Tools"
        Shows frontend console logs

    Extension Output Channel

TypeScript

    // Add to extension.ts
    const outputChannel = vscode.window.createOutputChannel('ZeroX');
    outputChannel.appendLine('This appears in Output panel');
    outputChannel.show();

Common Debugging Scenarios

Problem: Extension doesn't activate

TypeScript

// Check package.json activationEvents
"activationEvents": [
  "onStartupFinished"  // Activates when VS Code starts
]

// Or activate on command
"activationEvents": [
  "onCommand:zerox.openChat"
]

Problem: Webview doesn't load

TypeScript

// Add debug logging in webviewProvider.ts
public resolveWebviewView(webviewView: vscode.WebviewView) {
  console.log('Resolving webview');
  webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  console.log('Webview HTML set');
}

Problem: API calls failing

TypeScript

// Add try-catch in geminiClient.ts
async chat(messages: any[], tools: any[]) {
  try {
    console.log('API Request:', { messages, tools });
    const result = await this.model.generateContent(...);
    console.log('API Response:', result);
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

Running Tests
Create Test Files

Create src/test/extension.test.ts:

TypeScript

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('your-publisher-name.zerox-ai-agent'));
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('zerox.openChat'));
  });
});

Run Tests

Bash

npm test

Building for Production
1. Prepare for Release

Bash

# Clean previous builds
rm -rf out/
rm *.vsix

# Install fresh dependencies
rm -rf node_modules/
npm install

# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Compile with production settings
npm run compile

2. Update Version

Edit package.json:

JSON

{
  "version": "1.0.0",  // Increment as needed
  "publisher": "your-publisher-name",  // Set your publisher ID
}

3. Package the Extension

Bash

# Install VSCE (VS Code Extension Manager)
npm install -g @vscode/vsce

# Package
vsce package

# This creates: zerox-ai-agent-1.0.0.vsix

4. Test the Package

Bash

# Install in your VS Code
code --install-extension zerox-ai-agent-1.0.0.vsix

# Or test in clean environment
code --user-data-dir=/tmp/vscode-test --install-extension zerox-ai-agent-1.0.0.vsix

Publishing to Marketplace
1. Create Publisher Account

    Go to Visual Studio Marketplace
    Sign in with Microsoft account
    Create a publisher
    Note your publisher ID

2. Get Personal Access Token

    Go to Azure DevOps
    User Settings → Personal Access Tokens
    Create token with "Marketplace (Publish)" scope
    Save the token securely

3. Login & Publish

Bash

# Login to marketplace
vsce login your-publisher-name
# Enter your Personal Access Token

# Publish
vsce publish

# Or publish specific version
vsce publish 1.0.1
vsce publish minor  # 1.0.0 -> 1.1.0
vsce publish major  # 1.0.0 -> 2.0.0

Configuration Guide
Required Settings
Gemini API Key (Required)

Get Your Key:

    Visit Google AI Studio
    Sign in with Google account
    Click "Create API Key"
    Select existing project or create new one
    Copy the API key

Configure in VS Code:

JSON

{
  "zerox.geminiApiKey": "AIzaSyC_your_api_key_here"
}

Or via UI:

    Ctrl+, → Search "zerox api key"
    Paste your key

Optional Settings
Google Custom Search (For Web Search Feature)

Get CSE Credentials:

    Get API Key:
        Go to Google Cloud Console
        Create project or select existing
        Enable "Custom Search API"
        Credentials → Create Credentials → API Key
        Copy the API key

    Create Search Engine:
        Go to Programmable Search Engine
        Name your search engine
        What to search: "Search the entire web"
        Create
        Copy the "Search engine ID"

Configure in VS Code:

JSON

{
  "zerox.googleCseApiKey": "AIzaSyD_your_search_api_key",
  "zerox.googleCseId": "your_search_engine_id"
}

Model Selection

JSON

{
  "zerox.model": "gemini-2.0-flash-exp"
  // Options:
  // - "gemini-2.0-flash-exp" (fastest, latest)
  // - "gemini-1.5-pro-latest" (most capable)
  // - "gemini-1.5-flash-latest" (balanced)
}

Auto-Execute Mode

JSON

{
  "zerox.autoExecuteCommands": false
  // true = No confirmations (DANGEROUS!)
  // false = Asks before destructive operations
}

Complete Settings Example

User Settings (settings.json):

JSON

{
  "zerox.geminiApiKey": "AIzaSyC_your_gemini_key",
  "zerox.googleCseApiKey": "AIzaSyD_your_search_key",
  "zerox.googleCseId": "your_cse_id",
  "zerox.model": "gemini-2.0-flash-exp",
  "zerox.autoExecuteCommands": false
}

Workspace Settings (.vscode/settings.json in your project):

JSON

{
  "zerox.autoExecuteCommands": true,  // Override for this project
  "zerox.model": "gemini-1.5-pro-latest"  // Use more capable model
}

Troubleshooting
Installation Issues
"Command not found: code"

Solution:

Bash

# macOS
# In VS Code: Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"

# Linux
export PATH="$PATH:/usr/share/code/bin"

# Windows
# Add to PATH: C:\Users\YourName\AppData\Local\Programs\Microsoft VS Code\bin

"Cannot find module 'vscode'"

Solution:

Bash

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

TypeScript Compilation Errors

Solution:

Bash

# Check TypeScript version
npx tsc --version

# Should be 5.3.0 or higher
npm install -D typescript@latest

# Clean and rebuild
rm -rf out/
npm run compile

Runtime Issues
Extension Not Appearing

    Check Installation:

Bash

    code --list-extensions | grep zerox

    Check Activation Events:
        Open Command Palette (Ctrl+Shift+P)
        Type "Developer: Show Running Extensions"
        Look for "zerox-ai-agent"

    Check Logs:
        Help → Toggle Developer Tools
        Console tab → Look for errors

"API Key Not Set" Warning

Solution:

    Open Settings (Ctrl+,)
    Search "zerox.geminiApiKey"
    Enter your key
    Reload VS Code

Webview Shows Blank Screen

Solution:

    Open webview developer tools:
        Ctrl+Shift+P → "Developer: Open Webview Developer Tools"
    Check console for errors
    Common fixes:

TypeScript

    // In webviewProvider.ts, ensure:
    webviewView.webview.options = {
      enableScripts: true,  // Must be true!
      localResourceRoots: [this.extensionUri]
    };

API Calls Failing

Check API Key:

Bash

# Test API key with curl
curl "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

Enable Debug Logging:

TypeScript

// Add to geminiClient.ts
async chat(messages: any[], tools: any[]) {
  console.log('=== GEMINI API CALL ===');
  console.log('Messages:', JSON.stringify(messages, null, 2));
  console.log('Tools:', JSON.stringify(tools, null, 2));
  
  try {
    const result = await this.model.generateContent(...);
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

Development Issues
Changes Not Reflected

Solution:

    If using watch mode:
        Check terminal for compilation errors
        TypeScript might not be recompiling

    Reload extension:
        In Extension Development Host: Ctrl+R (or Cmd+R on Mac)
        Or use reload button in debug toolbar

    Full rebuild:

Bash

    npm run compile
    # Then F5 again

Breakpoints Not Hitting

Solution:

    Check source maps:

JSON

// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true  // Must be true
  }
}

Verify breakpoint is in executed code:

    Add console.log() before breakpoint
    If log doesn't appear, code path isn't executing

Use debugger statement:

TypeScript

    function myFunction() {
      debugger;  // Forces break here
      // ...
    }

Memory Leaks During Development

Solution:

    Dispose resources properly:

TypeScript

export function activate(context: vscode.ExtensionContext) {
  const provider = new WebviewProvider(context.extensionUri);
  
  // Add to subscriptions for auto-disposal
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('zerox.chatView', provider)
  );
}

Clear intervals/timeouts:

TypeScript

    let interval: NodeJS.Timeout;

    export function activate(context: vscode.ExtensionContext) {
      interval = setInterval(() => {}, 1000);
      
      context.subscriptions.push(new vscode.Disposable(() => {
        clearInterval(interval);
      }));
    }

Getting Help

    Check Extension Logs:
        View → Output → Select "ZeroX" from dropdown

    Enable Verbose Logging:

TypeScript

    // Add to extension.ts
    const output = vscode.window.createOutputChannel('ZeroX Debug');
    output.show();
    output.appendLine('Extension activated');

    Check VS Code Logs:
        Help → Toggle Developer Tools → Console

    Report Issues:
        Include VS Code version: Help → About
        Include extension version
        Include error messages
        Include steps to reproduce

Quick Reference
Essential Commands

Bash

# Install dependencies
npm install

# Development
npm run watch          # Auto-compile on changes
npm run compile        # One-time compile
npm run lint          # Check code quality

# Testing
npm test              # Run tests
code --install-extension zerox-ai-agent-1.0.0.vsix  # Test install

# Building
vsce package          # Create .vsix
vsce publish          # Publish to marketplace

# Debugging
# Press F5 in VS Code
# Ctrl+Shift+F5 to reload

Keyboard Shortcuts

    F5 - Start debugging
    Ctrl+Shift+F5 - Reload extension
    Shift+F5 - Stop debugging
    Ctrl+Shift+Y - Debug console
    Ctrl+Shift+P - Command palette

Useful VS Code Commands

    Developer: Reload Window - Restart VS Code
    Developer: Show Running Extensions - See active extensions
    Developer: Open Webview Developer Tools - Debug webview
    Preferences: Open Settings (JSON) - Edit settings directly
