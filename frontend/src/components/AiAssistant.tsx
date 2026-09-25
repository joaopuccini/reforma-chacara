import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatApi } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { Paperclip, X, Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mediaUrl?: string;
}

// Comprime e redimensiona a imagem para no máximo 1200px e qualidade 0.7
// Garante que fotos do iPhone (15MB+) fiquem abaixo de ~500KB
async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<{ base64: string; mimeType: string }> {
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollLockRef = useRef<{ scrollY: number } | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Lock/unlock body scroll when chat opens/closes
  useEffect(() => {
    if (isOpen) {
      // Save scroll position and lock
      scrollLockRef.current = { scrollY: window.scrollY };
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollLockRef.current.scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollLockRef.current) {
        window.scrollTo(0, scrollLockRef.current.scrollY);
        scrollLockRef.current = null;
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollLockRef.current) {
        window.scrollTo(0, scrollLockRef.current.scrollY);
        scrollLockRef.current = null;
      }
    };
  }, [isOpen]);

  // iOS visualViewport keyboard detection
  useEffect(() => {
    if (!isOpen) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // On iOS, when the keyboard opens, visualViewport.height shrinks
      const fullHeight = window.innerHeight;
      const viewportHeight = vv.height;
      const kbHeight = Math.max(0, fullHeight - viewportHeight);
      setKeyboardHeight(kbHeight);
      scrollToBottom();
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, [isOpen, scrollToBottom]);

  // Prevent background scroll on touch
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Allow scrolling within the messages area only
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('[data-scrollable]');
    if (!scrollableParent) {
      e.preventDefault();
    }
  }, []);

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
    // Blur input on submit to close keyboard on mobile
    inputRef.current?.blur();

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

  // Derive isMobile from window width  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <>
      {/* Floating Button — hidden when chat is open on mobile */}
      {!(isOpen && isMobile) && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-4 sm:right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_0_20px_rgba(30,64,175,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50"
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
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          onTouchMove={handleTouchMove}
          className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] bg-background sm:border sm:border-border sm:rounded-2xl sm:shadow-2xl flex flex-col z-[60]"
          style={{
            // On mobile, shrink the container when keyboard is visible so input stays above keyboard
            height: isMobile && keyboardHeight > 0 ? `calc(100% - ${keyboardHeight}px)` : undefined,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur-md shrink-0"
               style={{ paddingTop: isMobile ? 'max(12px, env(safe-area-inset-top))' : undefined }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-[15px] leading-tight">IA Assistente</h3>
                <p className="text-xs text-muted-foreground">Sempre online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 active:bg-muted transition-colors"
              aria-label="Fechar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages — scrollable area */}
          <div
            data-scrollable="true"
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 bg-muted/5"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border/50 rounded-bl-md text-foreground prose prose-sm dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1'
                }`}>
                  {msg.mediaUrl && (
                    <img src={msg.mediaUrl} alt="Anexo" className="w-full max-h-48 object-cover rounded-lg mb-2" />
                  )}
                  {msg.role === 'user' ? (
                    <span>{msg.content}</span>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                  <div className="flex space-x-1.5 items-center h-5">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preview Area */}
          {previewUrl && (
            <div className="px-4 pt-2 pb-1 bg-background border-t border-border/50 shrink-0">
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-border" />
                <button
                  onClick={removeFile}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/90 shadow-md"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Input Area — always visible above keyboard */}
          <div className="shrink-0 px-3 py-2.5 bg-background border-t border-border/50"
               style={{ paddingBottom: isMobile ? 'max(10px, env(safe-area-inset-bottom))' : undefined }}
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 active:bg-muted/80 transition-colors"
                title="Anexar imagem"
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
                onFocus={scrollToBottom}
                placeholder="Ex: comprei tinta por R$ 300..."
                className="flex-1 min-w-0 bg-muted/30 border border-border rounded-full px-4 py-2.5 text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all"
                disabled={isLoading}
                autoComplete="off"
                autoCorrect="on"
                enterKeyHint="send"
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedFile) || isLoading}
                className="w-10 h-10 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                <Send size={18} className="translate-x-[1px]" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
