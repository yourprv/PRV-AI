export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: string;
  mode?: ModeType;
  attachments?: Attachment[];
}

export type ModeType = 'auto' | 'thinking' | 'fast';

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: ModelId;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export type ModelId = 'prv-v1-flash' | 'prv-v1-pro' | 'prv-v1.5-beta';

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  api: string;
  badge?: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'prv-v1-flash',
    name: 'PRV V1 Pro',
    description: 'The ultimate balance between lightning-fast intelligence and pure speed in answers. Your shortcut to brilliance.',
    api: 'gemini-3.1-flash-lite',
  },
  {
    id: 'prv-v1-pro',
    name: 'PRV V1 Pro Max',
    description: 'The full dense powerhouse with maximum AI index from the PRV family. Unleash pure capability for complex tasks—the most formidable mind in the V1 arsenal.',
    api: 'gemma-4-31b-it',
  },
  {
    id: 'prv-v1.5-beta',
    name: 'PRV V1 Base',
    description: 'The reliable PRV V1 Base model—balanced, efficient, and designed for general-purpose reasoning with strong performance across everyday tasks.',
    api: 'gemma-4-26b-a4b-it',
  },
];

export interface ModeOption {
  id: ModeType;
  name: string;
  icon: string;
}
