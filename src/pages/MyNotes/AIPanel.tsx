import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, User, Bot, X, AlignLeft, Layers, Wand2, HelpCircle, Plus, Mic, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../../components/CodeBlock';
import { geminiGenerate, geminiErrorMessage, type GeminiMessage } from '../../services/gemini';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  noteContent: string;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, noteContent }) => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your AI Study Assistant. How can I help you with your notes today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSendMessage = async (customPrompt?: string) => {
    const input = customPrompt || chatInput;
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const systemInstruction = `You are StudyBuddy AI, a precise and educational study assistant.
Directly base your answers on the user's provided note context:
---
${noteContent}
---
If the answer isn't in the notes, use your general knowledge but clarify it's outside the notes.
Keep responses concise, structured, and readable in a narrow side-panel. Use bullet points and bold text.`;

      // Build GeminiMessage[] — skip the initial greeting (model-first causes errors)
      // Only include real back-and-forth messages (after first user msg)
      const chatHistory: GeminiMessage[] = messages
        .filter(m => !(m.role === 'assistant' && messages.indexOf(m) === 0)) // skip greeting
        .map(m => ({
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.content,
        }));

      const geminiMessages: GeminiMessage[] = [
        ...chatHistory,
        { role: 'user', text: input },
      ];

      const { text } = await geminiGenerate({ messages: geminiMessages, systemInstruction });
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error: unknown) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: geminiErrorMessage(error) }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToolAction = (label: string) => {
    let prompt = "";
    switch (label) {
      case 'Summarize':
        prompt = "Can you summarize this note for me?";
        break;
      case 'Flashcards':
        prompt = "Can you create some flashcards based on this note?";
        break;
      case 'Simplify':
        prompt = "Can you simplify the complex concepts in this note?";
        break;
      case 'Quiz':
        prompt = "Can you create a quick quiz based on this note?";
        break;
      default:
        prompt = label;
    }
    handleSendMessage(prompt);
  };

  const aiTools = [
    { icon: AlignLeft, label: 'Summarize', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Layers, label: 'Flashcards', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Wand2, label: 'Simplify', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: HelpCircle, label: 'Quiz', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">StudyBuddy AI</h2>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          title="Collapse Assistant"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {/* Quick Actions - Compact Grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {aiTools.map((tool, i) => (
            <button 
              key={i}
              onClick={() => {
                handleToolAction(tool.label);
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all active:scale-95 group text-left"
            >
              <div className={`p-1.5 rounded-lg ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform`}>
                <tool.icon size={14} />
              </div>
              <span className="text-xs font-semibold text-gray-700">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                }`}>
                  <div className={msg.role === 'assistant' ? 'markdown-content' : 'whitespace-pre-wrap'}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: CodeBlock as any,
                          a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium" />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative w-full" ref={menuRef}>
          
          {/* The Popup Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute bottom-[calc(100%+12px)] left-0 bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 py-2 w-full z-10 origin-bottom-left"
              >
                <div className="flex flex-col px-1.5 space-y-0.5">
                  {aiTools.map((tool, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        handleToolAction(tool.label);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-3.5 py-2.5 hover:bg-gray-100 rounded-xl text-[15px] font-medium text-gray-700 transition-colors focus:outline-none focus:bg-gray-100 group text-left"
                    >
                      <tool.icon className={`w-[18px] h-[18px] ${tool.color} group-hover:scale-110 transition-transform`} />
                      {tool.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Input Area */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[28px] px-2 py-2 shadow-sm hover:shadow-md transition-shadow focus-within:shadow-md focus-within:border-gray-300 w-full relative z-20">
            
            {/* Trigger Button (+) */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors focus:outline-none shrink-0 ${
                isMenuOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
              aria-label="Open actions menu"
            >
              <Plus className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Text Input */}
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatInput.trim() && !isTyping) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything" 
              className={`flex-1 bg-transparent border-none outline-none text-[13px] text-gray-800 py-1 font-medium h-8 min-w-0 ${isTyping ? 'placeholder-gray-300 text-gray-400' : 'placeholder-gray-400'}`}
            />
            
            {/* Right Button (Mic or Send) */}
            {chatInput.trim() ? (
              <button 
                onClick={() => handleSendMessage()}
                disabled={isTyping}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors focus:outline-none shrink-0 mr-0.5 ${
                  isTyping ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Send size={14} />
              </button>
            ) : (
              <button disabled={isTyping} className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none shrink-0 mr-0.5">
                <Mic className="w-[16px] h-[16px]" />
              </button>
            )}
          </div>
          
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default AIPanel;
