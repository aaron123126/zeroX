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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearch = void 0;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
class WebSearch {
    async search(query, numResults = 5) {
        const config = vscode.workspace.getConfiguration('zerox');
        const apiKey = config.get('googleCseApiKey');
        const cseId = config.get('googleCseId');
        if (!apiKey || !cseId) {
            throw new Error('Google Custom Search API key and CSE ID must be configured');
        }
        try {
            const response = await axios_1.default.get('https://www.googleapis.com/customsearch/v1', {
                params: {
                    key: apiKey,
                    cx: cseId,
                    q: query,
                    num: Math.min(numResults, 10),
                },
            });
            return response.data.items?.map((item) => ({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
            })) || [];
        }
        catch (error) {
            throw new Error(`Web search failed: ${error.message}`);
        }
    }
}
exports.WebSearch = WebSearch;
//# sourceMappingURL=webSearch.js.map