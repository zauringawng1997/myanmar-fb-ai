
export type ContentTone = 'Friendly' | 'Professional' | 'Urgent' | 'Funny' | 'Storytelling' | 'Educational';

export interface PostRequest {
  topic?: string;
  image?: string; // base64
  phoneNumber?: string;
  address?: string;
  businessName?: string;
  tone: ContentTone;
  type: 'topic' | 'image' | 'design';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  type: 'topic' | 'image' | 'design';
  isImage?: boolean;
}

export const TONE_LABELS: Record<ContentTone, string> = {
  Friendly: 'ရင်းနှီးသော (Friendly)',
  Professional: 'လေးနက်သော (Professional)',
  Urgent: 'အရေးကြီးသော (Urgent)',
  Funny: 'ပျော်စရာကောင်းသော (Funny)',
  Storytelling: 'ပုံပြင်ပြောသလို (Storytelling)',
  Educational: 'ဗဟုသုတပေးသော (Educational)',
};
