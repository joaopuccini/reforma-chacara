import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useFloorPlanStore } from '../useFloorPlanStore';
import { planningApi } from '../../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export function FloorplanChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Olá! Sou o assistente de arquitetura. O que deseja alterar na planta?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { plan, updateWall, removeWall } = useFloorPlanStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const actions = await planningApi.chatFloorplan({
        text: userMsg,
        currentPlan: plan
      });

      let botReply = '';
      
      for (const action of actions) {
        if (action.action === 'REPLY' && action.text) {
          botReply += action.text + '\n';
        } else if (action.action === 'UPDATE_WALL' && action.id && action.data) {
          updateWall(action.id, action.data);
          if (!botReply) botReply = `Parede atualizada.`;
        } else if (action.action === 'REMOVE_WALL' && action.id) {
          removeWall(action.id);
          if (!botReply) botReply = `Parede removida.`;
        }
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: botReply.trim() || 'Comando executado.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: '❌ Erro de conexão com a IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden text-sm shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
        <Bot size={18} className="text-emerald-400" />
        <h3 className="font-medium text-white/90">IA Arquiteto</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Bot size={16} /></div>}
            <div className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${msg.sender === 'user' ? 'bg-emerald-600/80 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'}`}>
              {msg.text}
            </div>
            {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><User size={16} /></div>}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Bot size={16} /></div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs italic animate-pulse">Pensando...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ex: Troque a parede da cozinha por vidro..."
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 transition-colors"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
