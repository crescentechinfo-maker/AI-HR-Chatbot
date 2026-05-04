export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  language: 'en' | 'ms';
}

export interface AdminSettings {
  apiKey: string;
  model: string;
  systemPrompt: string;
  useKnowledgeBase: boolean;
  useGeneralKnowledge: boolean;
}

export interface DocumentChunk {
  id: string;
  text: string;
  source: string;
  chunkIndex: number;
  tokens: string[];
}

export interface VectorStoreData {
  chunks: DocumentChunk[];
  avgChunkLength: number;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export type Language = 'en' | 'ms';
