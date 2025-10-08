export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  error?: string;
}

export interface ToolCall {
  name: string;
  parameters: any;
  result?: any;
  error?: string;
}

export interface ConversationContext {
  messages: Message[];
  tasks: Task[];
  workingDirectory: string;
}

export type ToolFunction = (params: any) => Promise<any>;