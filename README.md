# ZeroX - AI Code Agent

A powerful VS Code extension that brings AI-powered code assistance directly into your editor, powered by Google Gemini.

## Features

- 🤖 **AI Code Agent**: Intelligent code analysis and generation
- 📝 **File Operations**: Create, read, update, and delete files
- 💻 **Terminal Integration**: Execute commands directly
- 🔍 **Web Search**: Search the web for solutions
- 🌿 **Git Integration**: Automated commits and status checks
- ✅ **Task Tracking**: Visual task breakdown for each request
- 🎨 **Modern UI**: Clean, Cursor-like interface

## Setup

1. Install the extension
2. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. (Optional) Set up Google Custom Search for web search:
   - Get API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Create a Custom Search Engine at [CSE](https://cse.google.com/)
4. Configure in VS Code settings:
   - `zerox.geminiApiKey`: Your Gemini API key
   - `zerox.googleCseApiKey`: Your Google API key
   - `zerox.googleCseId`: Your Custom Search Engine ID
   - `zerox.model`: Choose your Gemini model
   - `zerox.autoExecuteCommands`: Auto-execute without confirmation (use carefully!)

## Usage

1. Click the robot icon in the Activity Bar
2. Type your request in the chat
3. ZeroX will break down tasks and execute them step-by-step
4. Review and approve actions (unless auto-execute is enabled)

## Examples

- "Create a new React component called Button"
- "Fix the TypeScript errors in this file"
- "Search for the latest Express.js routing best practices"
- "Commit all changes with message: Add authentication"
- "Refactor this code to use async/await"

## Safety

ZeroX asks for confirmation before:
- Executing terminal commands
- Deleting files
- Making git commits
- Writing files

Enable auto-execute at your own risk!

## License

MIT