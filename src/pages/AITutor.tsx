import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Zap, Trash2, RefreshCw, Plus, FileText, User, Terminal, X, MessageSquare, BookOpen, Brain, ListChecks, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../components/CodeBlock';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

const SUGGESTED_PROMPTS = [
  { id: 'p1', text: 'Explain this topic', icon: <BookOpen size={14} /> },
  { id: 'p2', text: 'Generate a quiz', icon: <ListChecks size={14} /> },
  { id: 'p3', text: 'Summarize my notes', icon: <FileText size={14} /> },
  { id: 'p4', text: 'Create a study plan', icon: <Zap size={14} /> },
];

const AITutor: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('studybuddy_ai_chats');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setActiveSessionId(parsed[0].id);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('studybuddy_ai_chats', JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const createNewChat = (initialMessage?: string) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: initialMessage ? (initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : '')) : 'New Chat',
      messages: [],
      lastUpdated: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  };

  const generateAIResponse = async (prompt: string, sessionId: string) => {
    setIsTyping(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are StudyBuddy AI, an expert, encouraging, and highly pedagogical tutor. Your goal is to help students truly understand concepts, not just give them the answers. Use the Socratic method when appropriate by asking guiding questions. Break down complex topics into digestible analogies. Always format your responses using rich Markdown (headers, bolding, bullet points) for readability. Be conversational, empathetic, and engaging.",
        }
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: response.text || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, aiMessage], lastUpdated: Date.now() } 
          : s
      ));
    } catch (error) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: "Sorry, I encountered an error. Please check your connection or API key.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, messages: [...s.messages, errorMessage], lastUpdated: Date.now() } 
          : s
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (text: string = inputText) => {
    if (!text.trim()) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = createNewChat(text);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions(prev => prev.map(s => {
      if (s.id === targetSessionId) {
        const isFirstMessage = s.messages.length === 0;
        return { 
          ...s, 
          messages: [...s.messages, userMessage], 
          title: isFirstMessage ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : s.title,
          lastUpdated: Date.now() 
        };
      }
      return s;
    }));

    setInputText('');
    generateAIResponse(text, targetSessionId);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  };

  const handleReset = () => {
    if (activeSessionId) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [] } : s));
    }
  };

  const handleClearAll = () => {
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem('studybuddy_ai_chats');
  };

  const handleUseNote = () => {
    const noteContent = "DNA replication is the process by which a double-stranded DNA molecule is copied to produce two identical DNA molecules.";
    handleSendMessage(`Explain this note in simple terms: "${noteContent}"`);
  };

  const runTest = (type: string) => {
    let prompt = "";
    switch(type) {
      case 'response': prompt = "Tell me a fun fact about science."; break;
      case 'quiz': prompt = "Generate 5 quiz questions about photosynthesis."; break;
      case 'summary': prompt = "Summarize the importance of mitochondria."; break;
      case 'flashcards': prompt = "Create flashcards for periodic table elements."; break;
    }
    handleSendMessage(prompt);
  };

  return (
    <div className="h-[calc(100vh-112px)] flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
      {/* Sidebar: Chat History */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col bg-gray-50 border-r border-gray-200 h-full z-20"
          >
            <div className="p-4">
              <button 
                onClick={() => createNewChat()}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <Plus size={18} className="text-gray-400 group-hover:text-indigo-600" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
              <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Activity</div>
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group cursor-pointer ${
                    activeSessionId === session.id 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <MessageSquare size={16} className={activeSessionId === session.id ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400 italic">
                  No previous chats
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={handleClearAll}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
                Clear All History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 bg-white z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <MessageSquare size={20} />
            </button>
            <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {activeSession ? activeSession.title : 'AI Tutor'}
              </h3>
              <div className="flex items-center gap-1">
                <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTestPanel(!showTestPanel)}
              className={`p-2 rounded-lg transition-colors ${showTestPanel ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
              title="Testing Mode"
            >
              <Terminal size={18} />
            </button>
            <button 
              onClick={handleReset}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
              title="Reset Chat"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-gray-50/30">
          {!activeSessionId || messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
              <div className="size-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-2">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">How can I help you study?</h2>
                <p className="text-sm text-gray-500">I can explain complex topics, generate quizzes, or help you organize your study schedule.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSendMessage(prompt.text)}
                    className="flex flex-col items-start p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all text-left group"
                  >
                    <div className="size-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 mb-2 transition-colors">
                      {prompt.icon}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                    msg.role === 'ai' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
                  }`}>
                    {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'ai' 
                      ? msg.isError 
                        ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    <div className={msg.role === 'ai' ? 'markdown-content' : 'whitespace-pre-wrap'}>
                      {msg.role === 'ai' ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: CodeBlock,
                            a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium" />
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        msg.text
                      )}
                    </div>
                    <div className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${msg.role === 'ai' ? 'text-gray-400' : 'text-indigo-200'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="size-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <Bot size={18} />
                  </div>
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <div className="size-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="size-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="size-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Testing Panel Overlay */}
        <AnimatePresence>
          {showTestPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-20 w-64 bg-gray-900 text-white rounded-xl shadow-2xl p-4 z-50 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Testing Mode</h4>
                <button onClick={() => setShowTestPanel(false)} className="text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2">
                <button onClick={() => runTest('response')} className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-left text-[10px] font-bold transition-colors flex items-center justify-between group">
                  Test AI Response <ChevronRight size={12} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => runTest('quiz')} className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-left text-[10px] font-bold transition-colors flex items-center justify-between group">
                  Test Quiz Generation <ChevronRight size={12} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => runTest('summary')} className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-left text-[10px] font-bold transition-colors flex items-center justify-between group">
                  Test Summary <ChevronRight size={12} className="text-gray-600 group-hover:text-white" />
                </button>
                <button onClick={() => runTest('flashcards')} className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-left text-[10px] font-bold transition-colors flex items-center justify-between group">
                  Test Flashcards <ChevronRight size={12} className="text-gray-600 group-hover:text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Input Box */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:bg-white focus-within:border-indigo-300 focus-within:shadow-md transition-all">
              <button 
                onClick={handleUseNote}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                title="Use Current Note"
              >
                <FileText size={20} />
              </button>
              
              <textarea 
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isTyping) handleSendMessage();
                  }
                }}
                placeholder="Ask StudyBuddy AI anything..." 
                className={`flex-1 bg-transparent border-none outline-none text-sm py-2 px-1 resize-none max-h-32 ${isTyping ? 'placeholder-gray-300 text-gray-400 cursor-not-allowed' : 'placeholder-gray-400'}`}
              />
              
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className={`p-2 rounded-xl transition-all ${
                  inputText.trim() && !isTyping
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95' 
                    : 'text-gray-300'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Powered by Gemini AI</p>
              <div className="h-3 w-px bg-gray-200"></div>
              <button onClick={handleUseNote} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider">
                Use Current Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
