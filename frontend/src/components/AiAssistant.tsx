import React, { useState, useRef, useEffect } from 'react';
import { chatApi } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Paperclip, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mediaUrl?: string;
}

// Comprime e redimensiona a imagem para no máximo 1200px e qualidade 0.75
// Isso garante que fotos do iPhone (15MB+) fiquem abaixo de 1MB antes de enviar
async function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context error'));
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType });
    };
    img.onerror = reject;
    img.src = url;
  });
}

export const AiAssistant: React.FC<{ onActionComplete?: () => void }> = ({ onActionComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou o Assistente da Chácara. Digite os gastos que você quer cadastrar, mande uma foto da nota, ou planeje algo.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Scroll input into view when keyboard opens on iOS
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userText = input.trim();
    const fileToUpload = selectedFile;
    const fileUrl = previewUrl;

    setInput('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText || '🖼️ [Imagem enviada]',
      mediaUrl: fileUrl || undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let mediaData: { mimeType: string; base64: string } | undefined;

      if (fileToUpload) {
        // Comprimir imagem antes de enviar (garante compatibilidade com Gemini e evita 503/413)
        mediaData = await compressImage(fileToUpload);
      }

      const res = await chatApi.sendMessage(userText, mediaData);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply || 'Processado.'
      };
      setMessages(prev => [...prev, botMsg]);
      if (onActionComplete) onActionComplete();
    } catch (error: any) {
      const detail = error?.response?.data?.message || error?.message || 'Tente novamente.';
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Erro ao enviar mensagem. Detalhe: ${detail}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_0_20px_rgba(30,64,175,0.4)] flex items-center justify-center hover:scale-105 transition-transform z-50 animate-in zoom-in"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Window — full screen on mobile, fixed panel on desktop */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[580px] sm:max-h-[85vh] bg-background border border-border sm:rounded-2xl shadow-2xl flex flex-col z-50 sm:overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

          {/* Header */}
          <div className="glass px-4 py-3 flex items-center justify-between border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">IA Assistente</h3>
                <p className="text-xs text-muted-foreground">Sempre online</p>
              </div>
            </div>
            {/* Close button always visible on mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10 overscroll-contain">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'glass-card border border-border/50 rounded-tl-sm prose prose-sm dark:prose-invert'
                }`}>
                  {msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="Anexo" className="w-full max-h-48 object-cover rounded-md mb-2" />
                  )}
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="glass-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex space-x-1.5 items-center h-4">
                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preview Area */}
          {previewUrl && (
            <div className="px-3 pt-2 pb-1 bg-background border-t border-border flex items-center shrink-0">
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-border" />
                <button
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-background border-t border-border shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                title="Anexar imagem (nota, recibo)"
              >
                <Paperclip size={20} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: comprei tinta por R$ 300..."
                className="flex-1 bg-muted/30 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground transition-all"
                disabled={isLoading}
                // Prevent iOS zoom on focus (font-size must be >= 16px equivalent)
                style={{ fontSize: '16px' }}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className="w-10 h-10 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 translate-x-[1px] translate-y-[-1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
