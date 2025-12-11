
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import { askVetAssistant } from '../services/geminiService';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface AIAssistantProps {
    plan?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ plan }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hello! I am your veterinary clinical assistant. How can I help you today? (Note: My outputs are for decision support only.)' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // FEATURE GATE: No AI for Starter
  if (plan === 'Starter') {
      return null;
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await askVetAssistant(input);
    
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: responseText
    }]);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-secondary-500 to-primary-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50 group print:hidden"
      >
        <Bot className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-slide-up print:hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary-500 to-primary-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-bold">Vet Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
        {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.sender === 'user' 
                    ? 'bg-primary-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                }`}>
                    {msg.text}
                </div>
            </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
        <input 
            type="text" 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ask about doses, differentials..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
