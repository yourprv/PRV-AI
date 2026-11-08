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
  imageUrl?: string;
  canvas?: boolean;
}

export type ModeType = 'auto' | 'thinking' | 'fast';

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: ModelId;
  customPrv?: CustomPRV;
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

export interface CustomPRV {
  id: string;
  name: string;
  description: string;
  instructions: string;
  model: 'prv-v3.2-fire' | 'prv-v1-flash';
}

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  group: 'PRV models' | 'Legacy models';
  accent: 'violet' | 'orange' | 'green' | 'sky' | 'slate';
  badge?: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'prv-v1-flash',
    name: 'PRV V1 Pro',
    description: 'PRV V1 Pro is your always-on everyday co-pilot: fast, focused, and tuned to turn rough thoughts into clean answers in seconds.',
    group: 'Legacy models',
    accent: 'violet',
  },
  {
    id: 'prv-v1-pro',
    name: 'PRV V1 Pro Max',
    description: 'PRV V1 Pro Max is built for the heavy lift—longer context, sharper structure, and confident help when the task refuses to stay simple.',
    group: 'Legacy models',
    accent: 'slate',
  },
  {
    id: 'prv-v1.5-beta',
    name: 'PRV V1 Base',
    description: 'PRV V1 Base keeps the fundamentals powerful: dependable reasoning, clear writing, and an efficient rhythm for getting more done.',
    group: 'Legacy models',
    accent: 'slate',
  },
  {
    id: 'prv-v3.2-fire',
    name: 'PRV V3.2 Fire',
    description: 'PRV V3.2 Fire is the high-voltage creative spark—rapid, energetic, and ready to launch ideas, answers, code, and plans at full speed.',
    group: 'PRV models',
    accent: 'orange',
  },
  {
    id: 'prv-v3.5-earth',
    name: 'PRV V3.5 Earth',
    description: 'PRV V3.5 Earth brings calm power to difficult work: grounded reasoning, deeper planning, and durable answers you can build on.',
    group: 'PRV models',
    accent: 'green',
  },
  {
    id: 'prv-v4-light',
    name: 'PRV 4.0 Light',
    description: 'PRV 4.0 Light is a glimpse of the next horizon—bright, agile, and designed to make everyday intelligence feel effortless.',
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
