import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Sparkles, Trash2, RefreshCw, Plus, FileText,
  User, X, MessageSquare, BookOpen, Brain, ListChecks, Zap,
  ChevronDown, ArrowLeft, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../components/CodeBlock';
import { auth } from '../services/firebase';
import { supabase } from '../services/supabase';
import { geminiGenerate, geminiErrorMessage, type GeminiMessage } from '../services/gemini';

// ─── Types ─────────────────────────────────────────────────────
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
  mode: 'general' | 'note';
  noteTitle?: string;
  noteContent?: string;
  messages: Message[];
  lastUpdated: number;
}

interface NoteOption {
  id: string;
  title: string;
  content: string;
  notebookTitle: string;
  notebookColor: string;
}

const SYSTEM_INSTRUCTION =
  'You are StudyBuddy AI, an expert, encouraging, and highly pedagogical tutor. ' +
  'Your goal is to help students truly understand concepts, not just give them the answers. ' +
  'Use the Socratic method when appropriate by asking guiding questions. ' +
  'Break down complex topics into digestible analogies. ' +
  'Always format your responses using rich Markdown (headers, bolding, bullet points) for readability. ' +
  'Be conversational, empathetic, and engaging.';

const NOTE_SYSTEM_INSTRUCTION = (noteContent: string) =>
  `${SYSTEM_INSTRUCTION}\n\nThe student has shared the following note with you. ` +
  `Use it as context and answer questions about it:\n\n---\n${noteContent}\n---`;

// ─── Quick-start prompts ────────────────────────────────────────
const GENERAL_PROMPTS = [
  { text: 'Explain a topic step-by-step',    icon: BookOpen },
  { text: 'Generate a 5-question quiz',       icon: ListChecks },
  { text: 'Help me create a study plan',      icon: Zap },
  { text: 'Give me memory techniques',        icon: Brain },
];

const NOTE_PROMPTS = [
  { text: 'Summarize this note',                    icon: FileText },
  { text: 'Quiz me on this note',                   icon: ListChecks },
  { text: 'Explain the hardest part',               icon: Brain },
  { text: 'What are the key takeaways?',            icon: Zap },
];

// ─── Storage helpers ────────────────────────────────────────────
const STORAGE_KEY = 'studybuddy_ai_sessions_v2';
const loadSessions = (): ChatSession[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
};
const saveSessions = (s: ChatSession[]) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s.slice(0, 30))); // keep last 30

// ─── Sub-components ────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 150, 300].map(d => (
      <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: `${d}ms` }} />
    ))}
  </div>
);

// ─── Main Component ────────────────────────────────────────────
const AITutor: React.FC = () => {
  const [sessions, setSessions]             = useState<ChatSession[]>(loadSessions);
  const [activeId, setActiveId]             = useState<string | null>(
    () => loadSessions()[0]?.id ?? null
  );
  const [inputText, setInputText]           = useState('');
  const [isTyping, setIsTyping]             = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(true);

  // Mode picker state (shown when creating a new session)
  const [pickingMode, setPickingMode]       = useState(false);

  // Note picker state
  const [notePickerOpen, setNotePickerOpen] = useState(false);
  const [notes, setNotes]                   = useState<NoteOption[]>([]);
  const [notesLoading, setNotesLoading]     = useState(false);
  const [selectedNote, setSelectedNote]     = useState<NoteOption | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeId) ?? null;
  const messages      = activeSession?.messages ?? [];

  // ── Persist whenever sessions change ──────────────────────────
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // ── Scroll on new messages / typing ───────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Auto-resize textarea ──────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [inputText]);

  // ── Note loader ───────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    const user = auth.currentUser;
    if (!user) { setNotesLoading(false); return; }

    const { data: nbs } = await supabase
      .from('notebooks')
      .select('id, title, color')
      .eq('user_id', user.uid);

    if (!nbs?.length) { setNotesLoading(false); return; }

    const { data: secs } = await supabase
      .from('sections')
      .select('id, notebook_id')
      .in('notebook_id', nbs.map(n => n.id));

    if (!secs?.length) { setNotesLoading(false); return; }

    const { data: pages } = await supabase
      .from('pages')
      .select('id, title, section_id, notes_content(content)')
      .in('section_id', secs.map(s => s.id))
      .order('created_at', { ascending: false })
      .limit(40);

    const nbMap = Object.fromEntries(nbs.map(n => [n.id, n]));
    const secMap = Object.fromEntries(secs.map(s => [s.id, s.notebook_id]));

    const opts: NoteOption[] = (pages ?? [])
      .filter((p: any) => {
        const c = Array.isArray(p.notes_content) ? p.notes_content[0] : p.notes_content;
        return c?.content && c.content.trim().length > 10;
      })
      .map((p: any) => {
        const c = Array.isArray(p.notes_content) ? p.notes_content[0] : p.notes_content;
        const nb = nbMap[secMap[p.section_id]];
        return {
          id: p.id,
          title: p.title,
          content: c?.content ?? '',
          notebookTitle: nb?.title ?? 'Notebook',
          notebookColor: nb?.color ?? '#3b82f6',
        };
      });

    setNotes(opts);
    setNotesLoading(false);
  }, []);

  // ── Create a new session ──────────────────────────────────────
  const createSession = (mode: 'general' | 'note', note?: NoteOption): string => {
    const id = Date.now().toString();
    const session: ChatSession = {
      id,
      title:        mode === 'note' ? `Note: ${note?.title ?? 'Untitled'}` : 'General Chat',
      mode,
      noteTitle:    note?.title,
      noteContent:  note?.content,
      messages:     [],
      lastUpdated:  Date.now(),
    };
    setSessions(prev => [session, ...prev]);
    setActiveId(id);
    return id;
  };

  // ── Generate AI response ──────────────────────────────────────
  const generateResponse = async (prompt: string, sessionId: string, noteContent?: string) => {
    setIsTyping(true);
    try {
      const sysInstr = noteContent
        ? NOTE_SYSTEM_INSTRUCTION(noteContent)
        : SYSTEM_INSTRUCTION;

      // Build typed GeminiMessage[] — history + new user message
      const session = sessions.find(s => s.id === sessionId);
      const history = (session?.messages ?? []).slice(-10);

      const messages: GeminiMessage[] = [
        ...history.map(m => ({
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        })),
        { role: 'user' as const, text: prompt },
      ];

      const { text } = await geminiGenerate({ messages, systemInstruction: sysInstr });

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, aiMsg], lastUpdated: Date.now() }
          : s
      ));
    } catch (err: unknown) {
      console.error('Gemini error:', err);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'ai',
        text: geminiErrorMessage(err),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setSessions(prev => prev.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, errMsg], lastUpdated: Date.now() }
          : s
      ));
    } finally {
      setIsTyping(false);
    }
  };


  // ── Send message ──────────────────────────────────────────────
  const handleSend = (text: string = inputText.trim()) => {
    if (!text || isTyping) return;

    let sid  = activeId;
    let note = activeSession?.noteContent;

    if (!sid) {
      sid  = createSession('general');
      note = undefined;
    }

    const userMsg: Message = {
      id:        `u-${Date.now()}`,
      role:      'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions(prev => prev.map(s => {
      if (s.id !== sid) return s;
      return {
        ...s,
        messages: [...s.messages, userMsg],
        title: s.messages.length === 0
          ? text.slice(0, 35) + (text.length > 35 ? '…' : '')
          : s.title,
        lastUpdated: Date.now(),
      };
    }));

    setInputText('');
    generateResponse(text, sid!, note);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) setActiveId(sessions.find(s => s.id !== id)?.id ?? null);
  };

  const handleClearChat = () => {
    if (!activeId) return;
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: [] } : s));
  };

  const handleStartNoteChat = (note: NoteOption) => {
    setSelectedNote(note);
    setNotePickerOpen(false);
    setPickingMode(false);
    createSession('note', note);
  };

  // ── Mode picker screen ────────────────────────────────────────
  if (pickingMode) {
    return (
      <div className="h-[calc(100vh-112px)] flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="max-w-lg w-full px-6 text-center space-y-8">
          <button
            onClick={() => setPickingMode(false)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2"
          >
            <ArrowLeft size={13} /> Back
          </button>

          <div>
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bot size={24} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Start a new chat</h2>
            <p className="text-sm text-slate-500 mt-1">Choose how you want to study today</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* General */}
            <button
              onClick={() => { createSession('general'); setPickingMode(false); }}
              className="group flex flex-col items-center gap-3 p-6 bg-slate-50 hover:bg-blue-50
                         border-2 border-slate-200 hover:border-blue-400 rounded-2xl transition-all text-left"
            >
              <div className="w-12 h-12 bg-white group-hover:bg-blue-100 rounded-xl flex items-center
                              justify-center border border-slate-200 group-hover:border-blue-200 transition-colors">
                <Sparkles size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">General Chat</p>
                <p className="text-xs text-slate-500 mt-0.5">Ask anything, get explanations, quizzes &amp; study plans</p>
              </div>
            </button>

            {/* Note-based */}
            <button
              onClick={() => { loadNotes(); setNotePickerOpen(true); }}
              className="group flex flex-col items-center gap-3 p-6 bg-slate-50 hover:bg-indigo-50
                         border-2 border-slate-200 hover:border-indigo-400 rounded-2xl transition-all text-left"
            >
              <div className="w-12 h-12 bg-white group-hover:bg-indigo-100 rounded-xl flex items-center
                              justify-center border border-slate-200 group-hover:border-indigo-200 transition-colors">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Chat with Note</p>
                <p className="text-xs text-slate-500 mt-0.5">Pick a note and get AI help specific to its content</p>
              </div>
            </button>
          </div>
        </div>

        {/* Note Picker Modal */}
        <AnimatePresence>
          {notePickerOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">Select a Note</h3>
                  <button onClick={() => setNotePickerOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {notesLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 size={20} className="animate-spin text-blue-500" />
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      No notes found. Create some notes first in My Notes.
                    </div>
                  ) : notes.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleStartNoteChat(n)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50
                                 border border-transparent hover:border-blue-200 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                           style={{ backgroundColor: n.notebookColor + '20', color: n.notebookColor }}>
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                        <p className="text-xs text-slate-400 truncate">{n.notebookTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {n.content.replace(/<[^>]+>/g, '').slice(0, 60)}…
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Main chat layout ──────────────────────────────────────────
  const prompts = activeSession?.mode === 'note' ? NOTE_PROMPTS : GENERAL_PROMPTS;

  return (
    <div className="h-[calc(100vh-112px)] flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col border-r border-slate-100 bg-slate-50 h-full overflow-hidden flex-shrink-0"
          >
            {/* New chat */}
            <div className="p-3">
              <button
                onClick={() => setPickingMode(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-600 text-white
                           rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={15} /> New Chat
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6 italic">No chats yet</p>
              ) : sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl
                              cursor-pointer transition-all text-sm
                              ${activeId === s.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {s.mode === 'note'
                      ? <FileText size={13} className={activeId === s.id ? 'text-blue-200' : 'text-indigo-400'} />
                      : <MessageSquare size={13} className={activeId === s.id ? 'text-blue-200' : 'text-slate-400'} />
                    }
                    <span className="truncate font-medium">{s.title}</span>
                  </div>
                  <button
                    onClick={e => handleDeleteSession(e, s.id)}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all
                                ${activeId === s.id ? 'hover:bg-blue-700 text-blue-200' : 'hover:text-red-500'}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Clear all */}
            <div className="p-3 border-t border-slate-200">
              <button
                onClick={() => { setSessions([]); setActiveId(null); localStorage.removeItem(STORAGE_KEY); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold
                           text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} /> Clear all history
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="h-13 border-b border-slate-100 flex items-center justify-between px-4 py-2.5 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MessageSquare size={17} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Bot size={17} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {activeSession
                  ? activeSession.mode === 'note'
                    ? `📄 ${activeSession.noteTitle ?? 'Note Chat'}`
                    : activeSession.title
                  : 'StudyBuddy AI'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gemini 1.5</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Mode badge */}
            {activeSession?.mode === 'note' && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100
                               px-2 py-0.5 rounded-full uppercase tracking-wider mr-1">
                Note Context
              </span>
            )}
            <button
              onClick={handleClearChat}
              disabled={!messages.length}
              className="p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30
                         rounded-lg transition-colors"
              title="Clear chat"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 bg-slate-50/30 space-y-5">
          {!activeSession || messages.length === 0 ? (
            // Empty state
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-7">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Sparkles size={26} className="text-blue-600" />
              </div>
              <div>
                {activeSession?.mode === 'note' ? (
                  <>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">
                      Chatting about: <span className="text-blue-600">{activeSession.noteTitle}</span>
                    </h2>
                    <p className="text-sm text-slate-500">
                      I've loaded your note. Ask me anything about it!
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">How can I help you study?</h2>
                    <p className="text-sm text-slate-500">
                      I can explain complex topics, generate quizzes, or build a study plan for you.
                    </p>
                  </>
                )}
              </div>

              {/* Quick prompts */}
              <div className="grid grid-cols-2 gap-3 w-full">
                {prompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p.text)}
                    className="flex items-center gap-2.5 p-3 bg-white border border-slate-200
                               rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="w-8 h-8 bg-slate-50 group-hover:bg-blue-50 rounded-lg flex items-center
                                    justify-center text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0">
                      <p.icon size={14} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 leading-tight">{p.text}</span>
                  </button>
                ))}
              </div>

              {/* Start new chat button (when no active session) */}
              {!activeSession && (
                <button
                  onClick={() => setPickingMode(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm
                             font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={15} /> Start a Chat
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-5">
              {messages.map(msg => {
                const isSelf = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-3 ${isSelf ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm
                                     ${isSelf
                                       ? 'bg-white border border-slate-200 text-slate-600'
                                       : 'bg-blue-600 text-white'}`}>
                      {isSelf ? <User size={15} /> : <Bot size={15} />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[84%] px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed
                                     ${isSelf
                                       ? 'bg-blue-600 text-white rounded-tr-none'
                                       : msg.isError
                                         ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-none'
                                         : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                      {isSelf ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-blue">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code: CodeBlock as any,
                              a: ({ node, ...p }) => (
                                <a {...p} target="_blank" rel="noopener noreferrer"
                                   className="text-blue-600 hover:underline font-medium" />
                              ),
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                      <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider
                                     ${isSelf ? 'text-blue-200' : 'text-slate-400'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                    <Bot size={15} />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto">
            {/* Note context indicator */}
            {activeSession?.mode === 'note' && (
              <div className="flex items-center gap-2 mb-2 text-xs text-indigo-600 bg-indigo-50
                              border border-indigo-100 rounded-lg px-3 py-1.5">
                <FileText size={12} />
                <span className="font-medium truncate">Context: {activeSession.noteTitle}</span>
                <button
                  onClick={() => setPickingMode(true)}
                  className="ml-auto text-indigo-400 hover:text-indigo-600 font-bold"
                >Change</button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2
                            focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-md transition-all">

              {/* Note chat button */}
              {!activeSession && (
                <button
                  onClick={() => { loadNotes(); setNotePickerOpen(true); setPickingMode(true); }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                  title="Chat about a note"
                >
                  <FileText size={17} />
                </button>
              )}

              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder={
                  activeSession?.mode === 'note'
                    ? `Ask about "${activeSession.noteTitle}"…`
                    : 'Ask StudyBuddy AI anything…'
                }
                className="flex-1 bg-transparent border-none outline-none text-sm py-1 resize-none
                           placeholder-slate-400 text-slate-900 disabled:opacity-50"
                style={{ maxHeight: '120px' }}
              />

              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isTyping}
                className={`p-2 rounded-xl transition-all flex-shrink-0
                  ${inputText.trim() && !isTyping
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95'
                    : 'text-slate-300 cursor-not-allowed'}`}
              >
                {isTyping ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-widest">
              Powered by Google Gemini 1.5 Flash
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
