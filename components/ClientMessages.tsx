import React, { useEffect, useState, useRef } from 'react';
import { ClientPortalService } from '../services/api';
import { Send, MessageCircle, User, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

const ClientMessages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 30 seconds
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data } = await ClientPortalService.getMessages();
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      // Optimistic UI update
      const tempMsg = {
        id: Date.now().toString(),
        content: inputText,
        senderType: 'Client',
        createdAt: new Date().toISOString()
      };
      setMessages([...messages, tempMsg]);
      setInputText('');
      
      await ClientPortalService.sendMessage(tempMsg.content);
      loadMessages(); // Sync with server
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading conversations...</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center shrink-0">
        <MessageCircle className="mr-3 text-indigo-600" /> Message Clinic
      </h1>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>No messages yet.</p>
              <p className="text-sm">Ask a question about your pet's health or appointments.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderType === 'Client';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end max-w-[80%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-2`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                    ${isMe ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                    {isMe ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-3 rounded-2xl text-sm shadow-sm
                    ${isMe 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="flex space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ClientMessages;
