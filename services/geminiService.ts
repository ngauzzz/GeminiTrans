import { TranscriptionResult } from "../types";

export const transcribeYouTubeUrl = async (
  url: string
): Promise<TranscriptionResult> => {
  try {
    const response = await fetch('/api/transcribe/youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to process YouTube link via backend.");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Backend YouTube Error:", error);
    throw new Error(error.message || "Failed to communicate with the server.");
  }
};

export const transcribeMedia = async (
  file: File,
  onProgress: ((percent: number) => void) | undefined
): Promise<TranscriptionResult> => {
  try {
    if (onProgress) onProgress(10); // Start uploading to our backend

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/transcribe/media', {
      method: 'POST',
      body: formData
    });

    if (onProgress) onProgress(80); // Upload and process done, await result parsing

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to process media file via backend.");
    }

    const data = await response.json();
    if (onProgress) onProgress(100);
    return data;
  } catch (error: any) {
    console.error("Backend Transcription Error:", error);
    throw new Error(error.message || "Failed to communicate with the server.");
  }
};