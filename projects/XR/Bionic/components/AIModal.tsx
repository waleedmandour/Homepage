import React, { useState, useEffect, useRef } from 'react';
import { generateEditedImage } from '../services/geminiService';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  captureRef: React.RefObject<HTMLElement>; // Reference to capture screen
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, captureRef }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Capture the canvas when modal opens
  useEffect(() => {
    if (isOpen && captureRef.current) {
      const canvas = captureRef.current.querySelector('canvas');
      if (canvas) {
        setCapturedImage(canvas.toDataURL('image/png'));
        setResultImage(null);
        setPrompt('');
      }
    }
  }, [isOpen, captureRef]);

  const handleGenerate = async () => {
    if (!capturedImage || !prompt) return;

    setIsProcessing(true);
    try {
      const result = await generateEditedImage(capturedImage, prompt);
      setResultImage(result);
    } catch (e) {
      console.error(e);
      alert("AI Generation failed. Check console or API key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSpeech = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-gray-900 border border-teal-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(20,184,166,0.2)]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse shadow-[0_0_10px_#14b8a6]"></div>
                <h2 className="text-xl font-bold text-teal-400 tracking-wider">GEMINI NANO VISION LAB</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="flex flex-col md:flex-row h-[600px]">
            {/* Image Viewport */}
            <div className="flex-1 bg-black/50 relative flex items-center justify-center p-4 border-r border-gray-800">
                {!resultImage ? (
                    capturedImage ? (
                        <div className="relative">
                            <img src={capturedImage} alt="Captured" className="max-h-[500px] rounded-lg border border-gray-700" />
                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-teal-500 font-mono">SOURCE_FEED</div>
                        </div>
                    ) : (
                        <div className="text-gray-500 font-mono animate-pulse">Initializing Video Feed...</div>
                    )
                ) : (
                    <div className="relative">
                        <img src={resultImage} alt="Generated" className="max-h-[500px] rounded-lg border border-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.3)]" />
                        <div className="absolute top-2 left-2 bg-teal-900/80 px-2 py-1 rounded text-xs text-white font-mono">GEMINI_PROCESSED</div>
                         <button 
                            onClick={() => setResultImage(null)}
                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                    </div>
                )}
                
                {isProcessing && (
                     <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                        <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                        <div className="mt-4 text-teal-400 font-mono text-sm tracking-widest animate-pulse">PROCESSING NEURAL DATA...</div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="w-full md:w-80 bg-gray-900 p-6 flex flex-col">
                <div className="flex-1">
                    <label className="block text-xs font-mono text-teal-500 mb-2 tracking-widest">COMMAND PROMPT</label>
                    <div className="relative">
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'Make the arm rusty gold', 'Add holographic wires', 'Cyberpunk city background'..."
                            className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none font-code"
                        />
                        <button 
                            onClick={toggleSpeech}
                            className={`absolute bottom-2 right-2 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                            title="Voice Command"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-xs font-mono text-gray-500 mb-3 tracking-widest">QUICK COMMANDS</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {['Rusty Metal Style', 'Neon Cyberpunk', 'X-Ray Blueprint', 'Gold Plating'].map((cmd) => (
                                <button 
                                    key={cmd}
                                    onClick={() => setPrompt(cmd)}
                                    className="text-xs bg-gray-800 hover:bg-gray-700 text-teal-400/80 hover:text-teal-300 py-2 px-3 rounded border border-gray-700 transition-all text-left truncate"
                                >
                                    {cmd}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={!prompt || isProcessing}
                    className={`w-full py-4 mt-6 rounded-lg font-bold tracking-widest text-sm uppercase transition-all flex items-center justify-center gap-2
                        ${!prompt || isProcessing 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-black shadow-[0_0_20px_rgba(20,184,166,0.4)]'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Initialize Generation
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIModal;
