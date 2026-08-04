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

export type ModelId =
  | 'prv-v1-flash'
  | 'prv-v1-pro'
  | 'prv-v1.5-beta'
  | 'prv-v3.2-fire'
  | 'prv-v3.5-earth'
  | 'prv-v4-light';

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  api: string;
  group: 'PRV models' | 'Legacy models';
  accent: 'violet' | 'orange' | 'green' | 'sky' | 'slate';
  badge?: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'prv-v1-flash',
    name: 'PRV V1 Pro',
    description: 'Fast, balanced, and ready for everyday work.',
    api: 'gemini-3.1-flash-lite',
    group: 'Legacy models',
    accent: 'violet',
  },
  {
    id: 'prv-v1-pro',
    name: 'PRV V1 Pro Max',
    description: 'The original dense powerhouse for complex tasks.',
    api: 'gemma-4-31b-it',
    group: 'Legacy models',
    accent: 'slate',
  },
  {
    id: 'prv-v1.5-beta',
    name: 'PRV V1 Base',
    description: 'Reliable, efficient, and built for general-purpose reasoning.',
    api: 'gemma-4-27b-it',
    group: 'Legacy models',
    accent: 'slate',
  },
  {
    id: 'prv-v3.2-fire',
    name: 'PRV V3.2 Fire',
    description: 'Quick ignition for ideas, answers, and high-tempo workflows.',
    api: 'gemini-3.1-flash-lite',
    group: 'PRV models',
    accent: 'orange',
  },
  {
    id: 'prv-v3.5-earth',
    name: 'PRV V3.5 Earth',
    description: 'Grounded depth for reasoning, planning, and serious creation.',
    api: 'gemma-4-31b-it',
    group: 'PRV models',
    accent: 'green',
  },
  {
    id: 'prv-v4-light',
    name: 'PRV 4.0 Light',
    description: 'A bright next-generation model for fast, capable responses.',
    api: 'gemma-4-27b-it',
    group: 'PRV models',
    accent: 'sky',
    badge: 'BETA',
  },
];

export interface ModeOption {
  id: ModeType;
  name: string;
  icon: string;
}
