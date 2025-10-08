"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileOperations = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
class FileOperations {
    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }
    async readFile(relativePath) {
        const fullPath = path.join(this.workspaceRoot, relativePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        return content;
    }
    async writeFile(relativePath, content) {
        const fullPath = path.join(this.workspaceRoot, relativePath);
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
    }
    async editFile(relativePath, search, replace) {
        const content = await this.readFile(relativePath);
        const newContent = content.replace(new RegExp(search, 'g'), replace);
        await this.writeFile(relativePath, newContent);
    }
    async deleteFile(relativePath, recursive = false) {
        const fullPath = path.join(this.workspaceRoot, relativePath);
        if (recursive) {
            await fs.rm(fullPath, { recursive: true, force: true });
        }
        else {
            await fs.unlink(fullPath);
        }
    }
    async createDirectory(relativePath) {
        const fullPath = path.join(this.workspaceRoot, relativePath);
        await fs.mkdir(fullPath, { recursive: true });
    }
    async listDirectory(relativePath) {
        const fullPath = path.join(this.workspaceRoot, relativePath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        return entries.map(entry => entry.isDirectory() ? `${entry.name}/` : entry.name);
    }
    async getCurrentFile() {
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
exports.FileOperations = FileOperations;
//# sourceMappingURL=fileOperations.js.map