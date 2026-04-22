import React, { useState } from 'react';
import { FileState } from './types';
import { transcribeMedia, transcribeYouTubeUrl } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<FileState>({
    file: null,
    youtubeUrl: '',
    mode: 'file',
    processing: false,
    error: null,
    result: null,
    uploadProgress: 0,
    stage: 'complete'
  });
  
  const [activeTab, setActiveTab] = useState<'transcription' | 'summary'>('transcription');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
      
      if (file.size > MAX_SIZE) {
         setState(prev => ({ ...prev, error: "File exceeds the 5GB limit." }));
         return;
      }

      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        setState(prev => ({ ...prev, error: "Please select an MP3 or MP4 file." }));
        return;
      }
      
      setState(prev => ({
        ...prev,
        file,
        processing: false,
        error: null,
        result: null,
        uploadProgress: 0,
        stage: 'complete'
      }));
      setActiveTab('transcription');
    }
  };

  const startTranscription = async () => {
    if (state.mode === 'file' && !state.file) return;
    if (state.mode === 'youtube' && !state.youtubeUrl) return;

    setState(prev => ({ 
      ...prev, 
      processing: true, 
      error: null,
      stage: state.mode === 'file' ? 'uploading' : 'processing',
      uploadProgress: 0
    }));

    try {
      let result;
      if (state.mode === 'file' && state.file) {
        result = await transcribeMedia(state.file, (progress) => {
          setState(prev => ({ 
            ...prev, 
            uploadProgress: progress,
            stage: progress < 100 ? 'uploading' : 'processing'
          }));
        });
      } else {
        result = await transcribeYouTubeUrl(state.youtubeUrl);
      }
      
      setState(prev => ({ ...prev, processing: false, result, stage: 'complete' }));
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      setState(prev => ({ 
        ...prev, 
        processing: false, 
        error: errorMessage
      }));
    }
  };

  const downloadText = () => {
    if (!state.result) return;
    const content = `LANGUAGE: ${state.result.language}\n\nSUMMARY:\n${state.result.summary}\n\nTRANSCRIPTION:\n${state.result.transcription}`;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcription_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full text-center mb-8">
        <div className="inline-block p-1 px-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-3 tracking-wide uppercase">
          Files • YouTube • Summarization
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Gemini Media AI
        </h1>
        <p className="text-slate-600">
          Convert Files & YouTube links to Text & Summaries using Gemini 3 Flash.
        </p>
      </div>

      <main className="max-w-3xl w-full space-y-6">
        
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
            
            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => setState(prev => ({ ...prev, mode: 'file' }))}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${state.mode === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Upload File
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, mode: 'youtube' }))}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${state.mode === 'youtube' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                YouTube Link
              </button>
            </div>

            {state.mode === 'file' ? (
              /* File Input */
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50 hover:bg-indigo-50/30 transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="transition-transform group-hover:scale-105 duration-200">
                   <svg className="w-12 h-12 text-blue-500 mb-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                   </svg>
                </div>
                <p className="text-slate-900 font-semibold text-center truncate w-full px-4">
                  {state.file ? state.file.name : "Tap to select MP3 / MP4"}
                </p>
                {!state.file && <p className="text-xs text-slate-500 mt-1">Max 5GB</p>}
              </div>
            ) : (
              /* YouTube Input */
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={state.youtubeUrl}
                    onChange={(e) => setState(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                    placeholder="Paste YouTube link here..."
                    className="block w-full pl-10 pr-3 py-4 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium px-1">
                  Supports public YouTube videos, shorts, and music.
                </p>
              </div>
            )}

            {state.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start">
                 <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                 {state.error}
              </div>
            )}

            {state.processing && (
               <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                    <span>{state.stage === 'uploading' ? 'Uploading...' : 'Transcribing...'}</span>
                    <span>{Math.round(state.uploadProgress || 0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${state.uploadProgress}%` }}
                    ></div>
                  </div>
               </div>
            )}

            <button
              onClick={startTranscription}
              disabled={(state.mode === 'file' ? !state.file : !state.youtubeUrl) || state.processing}
              className={`mt-6 w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all shadow-md flex items-center justify-center space-x-2 ${
                (state.mode === 'file' ? !state.file : !state.youtubeUrl) || state.processing
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : state.mode === 'file' ? 'bg-blue-600 hover:bg-blue-700 active:scale-95' : 'bg-red-600 hover:bg-red-700 active:scale-95'
              }`}
            >
              {state.processing ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {state.stage === 'uploading' ? 'Uploading...' : 'Transcribing Video...'}
                </>
              ) : (
                'Convert Now'
              )}
            </button>
          </div>

        {state.result && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('transcription')}
                className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === 'transcription' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Transcription
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Summary
              </button>
            </div>

            <div className="p-0">
               {activeTab === 'transcription' && (
                 <div className="p-6">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detected Language: {state.result.language}</span>
                      <button onClick={downloadText} className="text-blue-600 text-sm font-medium hover:underline flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download
                      </button>
                   </div>
                   <div className="prose prose-slate prose-sm max-w-none whitespace-pre-wrap text-slate-800 leading-relaxed max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                     {state.result.transcription}
                   </div>
                 </div>
               )}

               {activeTab === 'summary' && (
                 <div className="p-6 bg-yellow-50/30 h-full min-h-[200px]">
                   <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide flex items-center">
                     <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                     AI Summary
                   </h3>
                   <p className="text-slate-700 leading-relaxed text-base">
                     {state.result.summary}
                   </p>
                 </div>
               )}
            </div>
          </div>
        )}

      </main>

      <footer className="mt-12 text-slate-400 text-xs font-medium text-center space-y-2">
        <p>Gemini Converter PWA</p>
        <p>
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/download-source');
                if (!response.ok) throw new Error("Download failed");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gemini-transcribe-pro-source.tar.gz';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (e) {
                console.error(e);
                alert("Download failed. Please try again.");
              }
            }} 
            className="text-blue-500 hover:text-blue-700 underline transition-colors cursor-pointer"
          >
            ↓ Download Source Code (Export)
          </button>
        </p>
      </footer>
    </div>
  );
};

export default App;