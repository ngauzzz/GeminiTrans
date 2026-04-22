
export interface TranscriptionResult {
  transcription: string;
  language: string;
  summary: string;
  timestamp: number;
}

export interface FileState {
  file: File | null;
  youtubeUrl: string;
  mode: 'file' | 'youtube';
  processing: boolean;
  uploadProgress?: number;
  stage?: 'uploading' | 'processing' | 'complete';
  error: string | null;
  result: TranscriptionResult | null;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
