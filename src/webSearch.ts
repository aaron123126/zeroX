import axios from 'axios';
import * as vscode from 'vscode';

export class WebSearch {
  async search(query: string, numResults: number = 5): Promise<any[]> {
    const config = vscode.workspace.getConfiguration('zerox');
    const apiKey = config.get<string>('googleCseApiKey');
    const cseId = config.get<string>('googleCseId');

    if (!apiKey || !cseId) {
      throw new Error('Google Custom Search API key and CSE ID must be configured');
    }

    try {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: apiKey,
          cx: cseId,
          q: query,
          num: Math.min(numResults, 10),
        },
      });

      return response.data.items?.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      })) || [];
    } catch (error: any) {
      throw new Error(`Web search failed: ${error.message}`);
    }
  }
}