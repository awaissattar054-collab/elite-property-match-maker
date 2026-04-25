import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Building, User, Info, Settings, X, Key } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { initChat, sendMessage, ChatMessage } from './gemini';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('groq_api_key', key);
  };

  useEffect(() => {
    const startChat = async () => {
      try {
        const greeting = await initChat();
        setMessages([{ role: 'model', text: greeting }]);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    startChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isInitializing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await sendMessage(userMessage, messages, apiKey);
      setMessages((prev) => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: "I apologize, but I am having trouble connecting to my systems right now. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-600/30 selection:text-amber-100">
      {/* Header */}
      <header className="flex-none bg-zinc-900 border-b border-zinc-800 p-4 shadow-sm z-10 relative">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-600/10 p-2 rounded-lg border border-amber-500/20">
              <Building className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-amber-50 leading-none">Elite Property Advisory</h1>
              <p className="text-[10px] text-amber-500/80 uppercase tracking-[0.2em] mt-1 relative left-0.5">UAE & UK Real Estate Matchmaker</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-medium text-zinc-100">API Settings</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Groq API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Your key is stored locally in your browser to process requests.
                  </p>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-medium rounded-xl transition-colors"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-repeat relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 to-zinc-950/90 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto space-y-6 relative z-10 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'model' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mt-1">
                    <Building className="w-4 h-4 text-amber-500" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 leading-relaxed shadow-sm flex flex-col gap-2
                    ${message.role === 'user' 
                      ? 'bg-amber-600/10 border border-amber-500/30 text-amber-50 rounded-tr-sm whitespace-pre-wrap' 
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm prose prose-invert prose-amber max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800'
                    }`}
                >
                  {message.role === 'model' ? (
                    <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
                  ) : (
                    message.text
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center mt-1">
                    <User className="w-4 h-4 text-amber-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 justify-start"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mt-1">
                <Building className="w-4 h-4 text-amber-500/50" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-bounce"></div>
              </div>
            </motion.div>
          )}

          {isInitializing && messages.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4">
               <Building className="w-12 h-12 text-zinc-800 animate-pulse" />
               <p className="text-sm tracking-widest uppercase">Connecting to Advisory Network...</p>
             </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-zinc-950 border-t border-zinc-900 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              disabled={isLoading || isInitializing}
              rows={1}
              className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl pl-4 pr-14 py-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none shadow-inner disabled:opacity-50"
              style={{ overflow: 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isInitializing}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-amber-600 text-zinc-950 hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:shadow-[0_0_15px_rgba(217,119,6,0.3)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center space-x-2 text-[10px] text-zinc-600 uppercase tracking-widest">
            <Info className="w-3 h-3" />
            <span>Confidential Advisory System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
