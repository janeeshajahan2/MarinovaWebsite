import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  X, 
  PlayCircle, 
  StopCircle,
  Video,
  MapPin,
  Bot,
  User,
  Loader2
} from 'lucide-react';
import { ChatMessage, ChatAttachment } from '../types';
import { sendMessageToGemini } from '../services/chatService';
import { checkAndIncrementUsage } from '../services/usageService';
import WeatherChart from './WeatherChart';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Welcome, Commander. I am Captain. I can analyze ocean data, generate visuals, or answer questions via voice and text. How may I assist?",
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle File Select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: ChatAttachment[] = Array.from(e.target.files).map((file: File) => ({
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 
              file.type.startsWith('audio/') ? 'audio' : 'file',
        url: URL.createObjectURL(file),
        file,
        mimeType: file.type
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  // Handle Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioFile = new File([audioBlob], "voice_input.mp3", { type: 'audio/mp3' });
        const newAttachment: ChatAttachment = {
          type: 'audio',
          url: URL.createObjectURL(audioBlob),
          file: audioFile,
          mimeType: 'audio/mp3'
        };
        setAttachments(prev => [...prev, newAttachment]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Handle TTS
  const speakText = (text: string, id: string) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Send
  const handleSend = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (!checkAndIncrementUsage()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      attachments: [...attachments],
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(messages, inputText, userMsg.attachments || []);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error processing your request. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualization = (viz: any, idx: number) => {
    if (viz.type === 'chart') {
      return (
        <div key={idx} className="my-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <h4 className="text-sm font-bold text-slate-300 mb-2">Real-time Data: {viz.data.locationName}</h4>
          <WeatherChart data={viz.data.chartData} />
        </div>
      );
    }
    if (viz.type === 'map') {
      return (
        <div key={idx} className="my-4 bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
          <div className="bg-cyan-900/30 p-4 rounded-full">
            <MapPin className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
             <h4 className="font-bold text-white">{viz.data.locationName}</h4>
             <p className="text-sm text-slate-400 font-mono">
               LAT: {viz.data.latitude.toFixed(4)} | LON: {viz.data.longitude.toFixed(4)}
             </p>
             <p className="text-xs text-cyan-500 mt-1">Live Location Tracking Active</p>
          </div>
        </div>
      );
    }
    if (viz.type === 'image') {
      return (
        <div key={idx} className="my-4">
          <img 
            src={viz.data.url} 
            alt={viz.data.prompt} 
            className="rounded-xl border border-slate-700 shadow-lg max-w-full md:max-w-sm"
          />
          <p className="text-xs text-slate-500 mt-1 italic">Generated: {viz.data.prompt}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] relative">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 bg-[#1e293b]/50 backdrop-blur-md flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Captain</h2>
              <p className="text-xs text-indigo-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online • Multimodal v2.5
              </p>
            </div>
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
               {/* Metadata Line */}
               <div className={`flex items-center gap-2 text-xs text-slate-500 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? 'Commander' : 'Captain'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </div>

               {/* Attachments Preview */}
               {msg.attachments && msg.attachments.length > 0 && (
                  <div className={`flex flex-wrap gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     {msg.attachments.map((att, idx) => (
                       <div key={idx} className="relative group">
                          {att.type === 'image' && (
                            <img src={att.url} alt="attachment" className="w-32 h-32 object-cover rounded-lg border border-slate-700" />
                          )}
                          {att.type === 'video' && (
                             <video src={att.url} className="w-48 rounded-lg border border-slate-700" controls />
                          )}
                          {att.type === 'audio' && (
                             <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2 border border-slate-700">
                               <Mic className="w-4 h-4 text-slate-400" />
                               <span className="text-xs text-slate-300">Voice Note</span>
                             </div>
                          )}
                          {(att.type === 'file') && (
                             <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2 border border-slate-700">
                               <FileText className="w-4 h-4 text-slate-400" />
                               <span className="text-xs text-slate-300 truncate max-w-[100px]">{att.file.name}</span>
                             </div>
                          )}
                       </div>
                     ))}
                  </div>
               )}

               {/* Bubble */}
               <div className={`p-4 rounded-2xl shadow-sm ${
                 msg.role === 'user' 
                   ? 'bg-indigo-600 text-white rounded-tr-none' 
                   : 'bg-[#1e293b] text-slate-200 border border-slate-700/50 rounded-tl-none'
               }`}>
                 <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                 
                 {/* Visualizations (AI Only) */}
                 {msg.role === 'model' && msg.visualizations?.map((viz, i) => renderVisualization(viz, i))}

                 {/* Listen Button (AI Only) */}
                 {msg.role === 'model' && (
                    <button 
                      onClick={() => speakText(msg.text, msg.id)}
                      className="mt-3 flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {speakingId === msg.id ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                      {speakingId === msg.id ? 'Stop Speaking' : 'Listen to Answer'}
                    </button>
                 )}
               </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-[#1e293b] p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-3">
               <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
               <span className="text-slate-400 text-sm animate-pulse">Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#1e293b] border-t border-slate-700/50">
        
        {/* Attachment Preview Bar */}
        {attachments.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-3 mb-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative bg-slate-800 p-2 rounded-lg border border-slate-700 min-w-[120px] flex items-center gap-2">
                <span className="text-xs text-slate-300 truncate max-w-[100px]">{att.file.name}</span>
                <button 
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-slate-700 rounded-full p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 md:gap-3 max-w-5xl mx-auto">
           {/* Attachment Actions */}
           <div className="flex gap-1 pb-2">
             <input 
               type="file" 
               multiple 
               ref={fileInputRef} 
               className="hidden" 
               onChange={handleFileSelect}
             />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
                title="Attach file"
             >
               <Paperclip className="w-5 h-5" />
             </button>
           </div>

           {/* Text Input */}
           <div className="flex-1 bg-[#0f172a] border border-slate-700 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
             <textarea 
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => {
                 if(e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSend();
                 }
               }}
               placeholder="Ask anything about ocean and marine life"
               className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none max-h-32"
               rows={1}
             />
           </div>

           {/* Voice & Send */}
           <div className="flex gap-2 pb-1">
             <button 
               onMouseDown={startRecording}
               onMouseUp={stopRecording}
               onTouchStart={startRecording}
               onTouchEnd={stopRecording}
               className={`p-3 rounded-full transition-all ${
                 isRecording 
                   ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                   : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
               }`}
               title="Hold to Record"
             >
               <Mic className="w-5 h-5" />
             </button>
             
             <button 
               onClick={handleSend}
               disabled={!inputText.trim() && attachments.length === 0}
               className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full shadow-lg shadow-indigo-500/20 transition-all"
             >
               <Send className="w-5 h-5" />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;