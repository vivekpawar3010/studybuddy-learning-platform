import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FlaskConical, Calendar, Clock, Plus, Sparkles, FileText, 
  ChevronRight, GraduationCap, Zap, Save, ListTodo, X, 
  Trash2, Edit2, Play, CheckCircle2, AlertCircle, BarChart3,
  ChevronLeft, Timer, Send, Info, Search, Filter, MoreVertical,
  Layout, PanelLeftClose, PanelLeft, Users, Link2, Copy, Check,
  ShieldAlert, Maximize, Eye, EyeOff, RotateCcw, AlertTriangle,
  KeyRound, Lock, Globe, Tag, BookOpen
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { testsService, Test, Question, TestAttempt } from '../services/tests-service';
import { supabase } from '../services/supabase';
import { auth } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../components/CodeBlock';

interface TestsQuizzesProps {
  role: 'student' | 'teacher';
}

type ViewState = 'list' | 'builder' | 'attempt' | 'results' | 'analytics' | 'grading' | 'resume';

const TestsQuizzes: React.FC<TestsQuizzesProps> = ({ role }) => {
  const [view, setView] = useState<ViewState>('list');
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [resumeInfo, setResumeInfo] = useState<{ timeRemaining: number; attempt: any } | null>(null);
  const [copiedTestId, setCopiedTestId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  // Student code-entry modal
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const sidebarPanelRef = useRef<any>(null);

  useEffect(() => {
    fetchTests();
  }, [role]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleCopyLink = (testId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?join=${testId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedTestId(testId);
      setTimeout(() => setCopiedTestId(null), 2000);
    });
  };

  /** Student enters 6-char code to access a private or public test */
  const handleJoinByCode = async () => {
    if (codeInput.trim().length < 6) {
      setCodeError('Please enter a valid 6-character test code.');
      return;
    }
    setCodeLoading(true);
    setCodeError('');
    try {
      const testData = await testsService.getTestByCode(codeInput);
      if (!testData) {
        setCodeError('No published test found with that code. Check the code and try again.');
        setCodeLoading(false);
        return;
      }
      setShowCodeModal(false);
      setCodeInput('');
      // Now start or resume the test
      await handleStartTest(testData.id);
    } catch (e) {
      setCodeError('Something went wrong. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const data = await testsService.getTests(role, userId);
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = () => {
    setActiveTest({
      title: '',
      description: '',
      subject: '',
      topic: '',
      duration: 60,
      total_marks: 0,
      negative_marks: 0,
      randomize_questions: false,
      visibility: 'public',
      status: 'draft',
      questions: []
    });
    setView('builder');
  };

  const handleEditTest = async (testId: string) => {
    try {
      const data = await testsService.getTestWithQuestions(testId);
      setActiveTest(data);
      setView('builder');
    } catch (error) {
      console.error('Error fetching test details:', error);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const studentId = auth.currentUser?.uid;
      if (!studentId) return;

      const testData = await testsService.getTestWithQuestions(testId);

      // Check for an existing in-progress attempt (session persistence)
      const existing = await testsService.checkExistingAttempt(testId, studentId);
      if (existing) {
        // Fetch saved answers so we can pre-populate them
        const { data: savedAnswers } = await supabase
          .from('answers')
          .select('question_id, answer')
          .eq('attempt_id', existing.attempt.id);
        const answersMap: Record<string, any> = {};
        (savedAnswers || []).forEach((a: any) => { answersMap[a.question_id] = a.answer; });
        setActiveTest(testData);
        setResumeInfo({ timeRemaining: existing.timeRemaining, attempt: { ...existing.attempt, answers: answersMap } });
        setView('resume');
        return;
      }

      const attempt = await testsService.startAttempt(testId, studentId);
      setActiveTest(testData);
      setActiveAttempt({ ...attempt, answers: {} });
      setView('attempt');
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const handleViewResults = async (attemptId: string) => {
    try {
      const data = await testsService.getAttemptResults(attemptId);
      setActiveAttempt(data);
      setView('results');
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleViewAnalytics = async (testId: string) => {
    try {
      const analytics = await testsService.getTestAnalytics(testId);
      const testData = await testsService.getTestWithQuestions(testId);
      setActiveTest({ ...testData, analytics });
      setView('analytics');
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleGradeAttempt = async (attemptId: string) => {
    try {
      const data = await testsService.getAttemptResults(attemptId);
      setActiveAttempt(data);
      setView('grading');
    } catch (error) {
      console.error('Error fetching attempt for grading:', error);
    }
  };

  const toggleSidebar = () => {
    if (sidebarPanelRef.current) {
      if (isSidebarOpen) {
        sidebarPanelRef.current.collapse();
      } else {
        sidebarPanelRef.current.expand();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-12 border-4 border-indigo-100 rounded-full"></div>
            <div className="size-12 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Loading assessments...</p>
        </div>
      </div>
    );
  }

  const filteredTests = tests.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.topic || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchTopic = !topicFilter || (t.topic || '').toLowerCase() === topicFilter.toLowerCase();
    return matchSearch && matchTopic;
  });

  // Unique topics from current tests list for filter dropdown
  const allTopics = Array.from(new Set(tests.map(t => t.topic).filter(Boolean))) as string[];

  return (
    <div className="h-[calc(100vh-120px)] -m-6 overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* Resume Modal */}
        {view === 'resume' && resumeInfo && activeTest && (
          <motion.div
            key="resume"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl text-center"
            >
              <div className="size-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <RotateCcw size={36} className="text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Resume Your Test</h2>
              <p className="text-gray-500 font-medium mb-2">
                You have an unfinished attempt for <span className="font-bold text-indigo-600">{activeTest.title}</span>.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl text-red-600 font-black text-sm mb-8">
                <Timer size={16} />
                {Math.floor(resumeInfo.timeRemaining / 60)}m {resumeInfo.timeRemaining % 60}s remaining
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActiveAttempt({ ...resumeInfo.attempt, answers: resumeInfo.attempt.answers || {} });
                    setView('attempt');
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Resume Test
                </button>
                <button
                  onClick={() => { setView('list'); setResumeInfo(null); }}
                  className="px-5 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {view === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <PanelGroup direction="horizontal" className="h-full">
              <Panel 
                defaultSize={75} 
                minSize={30}
                className="flex flex-col bg-white"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={toggleSidebar}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                      {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
                    </button>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 tracking-tight">Assessments</h1>
                      <p className="text-xs text-gray-500 font-medium">
                        {tests.length} test{tests.length !== 1 ? 's' : ''} · 
                        {role === 'teacher' ? 'Manage your created assessments' : 'Your community tests and assigned quizzes'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Topic filter */}
                    {allTopics.length > 0 && (
                      <select
                        value={topicFilter}
                        onChange={(e) => setTopicFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="">All Topics</option>
                        {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    )}
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search tests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all w-56"
                      />
                    </div>
                    {role === 'student' && (
                      <button
                        onClick={() => { setShowCodeModal(true); setCodeError(''); setCodeInput(''); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl text-sm font-black hover:bg-indigo-50 transition-all active:scale-95 shadow-sm"
                      >
                        <KeyRound size={16} />
                        Join with Code
                      </button>
                    )}
                    {role === 'teacher' && (
                      <button 
                        onClick={handleCreateTest} 
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                      >
                        <Plus size={18} />
                        Create Test
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(role === 'teacher' 
                      ? [
                          { title: 'My Tests', items: filteredTests.filter(t => t.teacher_id === auth.currentUser?.uid) },
                          { title: 'Global Public Tests', items: filteredTests.filter(t => t.teacher_id !== auth.currentUser?.uid) }
                        ]
                      : [{ title: null, items: filteredTests }]
                    ).map((group, gIdx) => (
                      <React.Fragment key={gIdx}>
                        {group.title && group.items.length > 0 && (
                          <div className="col-span-full mt-2 mb-0">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{group.title}</h2>
                          </div>
                        )}
                        {group.items.map((test) => (
                          <motion.div 
                            key={test.id}
                            id={`test-card-${test.id}`}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden flex flex-col"
                      >
                        {/* Status + visibility badges */}
                        <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            test.visibility === 'private' ? 'bg-purple-50 text-purple-600' : 'bg-sky-50 text-sky-600'
                          }`}>
                            {test.visibility === 'private' ? '🔒 Private' : '🌐 Global'}
                          </span>
                          {(test.test_distributions?.length ?? 0) > 0 && (
                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              👥 Community
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            test.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {test.status}
                          </span>
                        </div>

                        <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>

                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors pr-16">{test.title}</h3>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 font-medium">{test.description || 'No description provided.'}</p>

                        {/* Topic + Subject badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {test.topic && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                              <Tag size={10} /> {test.topic}
                            </span>
                          )}
                          {test.subject && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold">
                              <BookOpen size={10} /> {test.subject}
                            </span>
                          )}
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold">
                            <Clock size={10} /> {test.duration}m
                          </span>
                          {test.end_time && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 rounded-lg text-[10px] font-bold">
                              <Calendar size={10} /> Due {new Date(test.end_time).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Teacher: show test code + action buttons */}
                        {role === 'teacher' ? (
                          <div className="mt-auto pt-3 border-t border-gray-50 space-y-3">
                            {/* Test Code — only visible to teacher */}
                            {test.test_code && (
                              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <KeyRound size={14} className="text-indigo-500 shrink-0" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Code</span>
                                <span className="font-black text-lg tracking-[0.25em] text-indigo-600 font-mono flex-1 text-center">{test.test_code}</span>
                                <button
                                  onClick={() => handleCopyCode(test.test_code!)}
                                  className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-500"
                                  title="Copy code"
                                >
                                  {copiedCode === test.test_code ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                            )}
                            {/* Action buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewAnalytics(test.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-600 text-xs font-bold transition-colors"
                              >
                                <BarChart3 size={14} /> Analytics
                              </button>
                              <button
                                onClick={() => handleEditTest(test.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 text-xs font-bold transition-colors"
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Student: show Take Test (only for public tests visible in list) */
                          <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-bold">{test.total_marks} marks</span>
                            <button 
                              onClick={() => handleStartTest(test.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                            >
                              <Play size={12} /> Take Test
                            </button>
                          </div>
                        )}
                          </motion.div>
                        ))}
                      </React.Fragment>
                    ))}
                    {filteredTests.length === 0 && (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                          <Search size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No assessments found</h3>
                        <p className="text-sm text-gray-500 max-w-xs mb-6">
                          {searchQuery ? `We couldn't find any results for "${searchQuery}"` : 
                           role === 'teacher' ? 'Get started by creating your first assessment.' : 
                           'You don\'t have any active assessments in your communities.'}
                        </p>
                        {role === 'student' && !searchQuery && (
                          <button 
                            onClick={() => setShowCodeModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
                          >
                            <KeyRound size={18} /> Join Assessment with Code
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="w-1 hover:bg-indigo-500/20 transition-colors" />

              <Panel 
                ref={sidebarPanelRef}
                defaultSize={25} 
                minSize={20}
                collapsible
                onCollapse={() => setIsSidebarOpen(false)}
                onExpand={() => setIsSidebarOpen(true)}
                className="bg-gray-50/50 border-l border-gray-100 flex flex-col"
              >
                <div className="p-6 space-y-6 overflow-y-auto h-full">
                  <div className="p-5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 size-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <Zap size={24} className="mb-4 text-indigo-200" />
                    <h3 className="font-bold mb-2">Quick Review</h3>
                    <p className="text-xs text-indigo-100 leading-relaxed mb-6">
                      Flashcards for your next Physics test are ready for review.
                    </p>
                    <button className="w-full py-2.5 bg-white text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-all active:scale-95">
                      Start Session
                    </button>
                  </div>
                  
                  <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <BarChart3 size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Performance Stats</h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. Accuracy</span>
                          <span className="text-sm font-bold text-green-600">92%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '92%' }}
                            className="h-full bg-green-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Global Rank</span>
                        <span className="text-sm font-bold text-indigo-600">#124</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="size-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                            <CheckCircle2 size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Physics Quiz 1</p>
                            <p className="text-[10px] text-gray-500">Completed 2h ago</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </motion.div>
        )}

        {view === 'builder' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto p-8"
          >
            <TestBuilder 
              test={activeTest} 
              onBack={() => { setView('list'); fetchTests(); }}
              onPublish={() => { setView('list'); fetchTests(); }}
            />
          </motion.div>
        )}

        {/* Student Code Entry Modal */}
        <AnimatePresence>
          {showCodeModal && (
            <motion.div
              key="code-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={(e) => e.target === e.currentTarget && setShowCodeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl"
              >
                <div className="size-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <KeyRound size={32} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 text-center mb-2">Enter Test Code</h2>
                <p className="text-sm text-gray-500 text-center mb-6">Ask your teacher for the 6-character test code.</p>
                <input
                  type="text"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                  placeholder="ABC123"
                  className="w-full text-center text-3xl font-black tracking-[0.4em] py-4 px-6 border-2 border-gray-200 rounded-2xl outline-none focus:border-indigo-600 transition-all font-mono uppercase mb-3"
                  autoFocus
                />
                {codeError && (
                  <p className="text-xs text-red-500 font-bold text-center mb-3">{codeError}</p>
                )}
                <button
                  onClick={handleJoinByCode}
                  disabled={codeLoading || codeInput.trim().length < 6}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {codeLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : 'Join Test'}
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="w-full py-3 mt-2 text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {view === 'attempt' && activeTest && activeAttempt && (
          <SecureTestAttemptView
            key={activeAttempt.id}
            test={activeTest}
            attempt={activeAttempt}
            onFinish={(id) => handleViewResults(id)}
          />
        )}

        {view === 'results' && activeAttempt && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <TestResultsView attempt={activeAttempt} onBack={() => setView('list')} />
          </motion.div>
        )}

        {view === 'analytics' && activeTest && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <TestAnalyticsView
              test={activeTest}
              onBack={() => setView('list')}
              onGrade={(id) => handleGradeAttempt(id)}
            />
          </motion.div>
        )}

        {view === 'grading' && activeAttempt && (
          <motion.div
            key="grading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <TestGradingView
              attempt={activeAttempt}
              onBack={() => setView('analytics')}
              onFinish={() => handleViewAnalytics(activeAttempt.test_id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-components ---

const TestBuilder: React.FC<{ test: any; onBack: () => void; onPublish?: () => void }> = ({ test, onBack, onPublish }) => {
  const [formData, setFormData] = useState({
    ...test,
    questions: test.questions || [],
    test_distributions: test.test_distributions || [],
    start_time: test.start_time ? new Date(test.start_time).toISOString().slice(0, 16) : '',
    end_time: test.end_time ? new Date(test.end_time).toISOString().slice(0, 16) : ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  useEffect(() => {
    const fetchMyCommunities = async () => {
      setLoadingCommunities(true);
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const data = await testsService.getMyCommunities(userId);
          setMyCommunities(data);
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoadingCommunities(false);
      }
    };
    fetchMyCommunities();
  }, []);

  const handleSave = async (status: 'draft' | 'published') => {
    setIsSaving(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const testPayload = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        topic: formData.topic || null,
        duration: formData.duration,
        total_marks: (formData.questions || []).reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0),
        negative_marks: formData.negative_marks || 0,
        randomize_questions: formData.randomize_questions || false,
        visibility: formData.visibility || 'public',
        status: status,
        teacher_id: userId,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : undefined,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined
      };

      let savedTest;
      if (formData.id) {
        savedTest = await testsService.updateTest(formData.id, testPayload);
      } else {
        savedTest = await testsService.createTest(testPayload);
      }

      // Save questions
      await testsService.saveQuestions(savedTest.id, formData.questions || []);

      // Distribute to communities
      const communityIds = formData.test_distributions.map((d: any) => d.community_id);
      await testsService.distributeTest(savedTest.id, communityIds);

      // If publishing, close the editor (go back to list)
      if (status === 'published' && onPublish) {
        onPublish();
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Error saving test:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      test_id: formData.id || '',
      question_text: '',
      question_type: 'mcq',
      options: [
        { id: '1', text: '' },
        { id: '2', text: '' }
      ],
      correct_answer: '1',
      marks: 1,
      order_index: formData.questions.length
    };
    setFormData((prev: any) => ({ ...prev, questions: [...prev.questions, newQ] }));
  };

  const removeQuestion = (id: string) => {
    setFormData((prev: any) => ({ ...prev, questions: prev.questions.filter((q: any) => q.id !== id) }));
  };

  const updateQuestion = (id: string, updates: any) => {
    setFormData((prev: any) => ({
      ...prev,
      questions: prev.questions.map((q: any) => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const addOption = (questionId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      questions: prev.questions.map((q: any) => {
        if (q.id === questionId) {
          const newId = (q.options.length + 1).toString();
          return { ...q, options: [...q.options, { id: newId, text: '' }] };
        }
        return q;
      })
    }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      questions: prev.questions.map((q: any) => {
        if (q.id === questionId) {
          const newOptions = q.options.filter((o: any) => o.id !== optionId);
          // If the removed option was the correct answer, reset it
          let newCorrect = q.correct_answer;
          if (q.question_type === 'mcq' && q.correct_answer === optionId) {
            newCorrect = newOptions.length > 0 ? newOptions[0].id : '';
          } else if (q.question_type === 'multi_select') {
            newCorrect = (q.correct_answer as string[]).filter(id => id !== optionId);
          }
          return { ...q, options: newOptions, correct_answer: newCorrect };
        }
        return q;
      })
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 border border-gray-200">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-xl font-semibold">{formData.id ? 'Edit Assessment' : 'Create New Assessment'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave('draft')} disabled={isSaving} className="btn-secondary">
            Save Draft
          </button>
          <button onClick={() => handleSave('published')} disabled={isSaving} className="btn-primary">
            <Save size={14} />
            Publish Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-white shadow-sm border-gray-100">
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Test Title (e.g., Organic Chemistry Quiz 1)" 
              className="w-full text-3xl font-black placeholder-gray-200 border-none focus:ring-0 mb-4 p-0 bg-transparent text-gray-900 tracking-tight" 
            />
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add a description for your students..."
              className="w-full text-sm text-gray-500 border-none focus:ring-0 p-0 resize-none mb-8 bg-transparent font-medium"
              rows={2}
            />

            <div className="space-y-8">
              {formData.questions.map((q: any, idx: number) => (
                <motion.div 
                  key={q.id} 
                  layout
                  className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 relative group hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                >
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="flex gap-6 mb-8">
                    <span className="size-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-200 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <textarea 
                        value={q.question_text}
                        onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                        placeholder="Enter your question here..."
                        className="w-full bg-transparent border-none focus:ring-0 font-bold p-0 text-lg text-gray-900 placeholder-gray-300 resize-none"
                        rows={1}
                        onInput={(e: any) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Question Type</label>
                      <div className="relative">
                        <select 
                          value={q.question_type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            // When switching types, reset options and correct_answer appropriately
                            let newOptions = q.options;
                            let newCorrectAnswer = q.correct_answer;
                            if (newType === 'true_false') {
                              newOptions = [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }];
                              newCorrectAnswer = 'true';
                            } else if (newType === 'mcq') {
                              if (!newOptions || newOptions.length < 2 || q.question_type === 'true_false') {
                                newOptions = [{ id: '1', text: 'Option 1' }, { id: '2', text: 'Option 2' }];
                              }
                              newCorrectAnswer = newOptions[0]?.id || '1';
                            } else if (newType === 'multi_select') {
                              if (!newOptions || newOptions.length < 2 || q.question_type === 'true_false') {
                                newOptions = [{ id: '1', text: 'Option 1' }, { id: '2', text: 'Option 2' }];
                              }
                              newCorrectAnswer = [];
                            } else {
                              // short_answer or long_answer
                              newOptions = [];
                              newCorrectAnswer = '';
                            }
                            updateQuestion(q.id, { question_type: newType, options: newOptions, correct_answer: newCorrectAnswer });
                          }}
                          className="w-full h-11 pl-4 pr-10 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                        >
                          <option value="mcq">Multiple Choice (MCQ)</option>
                          <option value="multi_select">Multiple Select</option>
                          <option value="true_false">True / False</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="long_answer">Long Answer</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" size={16} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Marks</label>
                      <input 
                        type="number"
                        value={q.marks}
                        onChange={(e) => updateQuestion(q.id, { marks: Number(e.target.value) })}
                        className="w-full h-11 px-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>

                  {(q.question_type === 'mcq' || q.question_type === 'multi_select') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Options</label>
                        <button 
                          onClick={() => addOption(q.id)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <Plus size={10} /> Add Option
                        </button>
                      </div>
                      {q.options.map((opt: any) => (
                        <div key={opt.id} className="flex items-center gap-3 group/opt">
                          <div className="relative size-5 shrink-0">
                            <input 
                              type={q.question_type === 'mcq' ? 'radio' : 'checkbox'}
                              checked={q.question_type === 'mcq' ? q.correct_answer === opt.id : Array.isArray(q.correct_answer) && q.correct_answer.includes(opt.id)}
                              onChange={() => {
                                if (q.question_type === 'mcq') {
                                  updateQuestion(q.id, { correct_answer: opt.id });
                                } else {
                                  const current = Array.isArray(q.correct_answer) ? q.correct_answer as string[] : [];
                                  const next = current.includes(opt.id) 
                                    ? current.filter(id => id !== opt.id)
                                    : [...current, opt.id];
                                  updateQuestion(q.id, { correct_answer: next });
                                }
                              }}
                              className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className={`absolute inset-0 border-2 rounded-lg transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 ${
                              q.question_type === 'mcq' ? 'rounded-full' : 'rounded-md'
                            } border-gray-300 group-hover/opt:border-indigo-300`}></div>
                            {q.question_type === 'mcq' ? (
                              <div className="absolute inset-1 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                            ) : (
                              <CheckCircle2 className="absolute inset-0.5 text-white scale-0 peer-checked:scale-100 transition-transform" size={14} />
                            )}
                          </div>
                          <input 
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = q.options.map((o: any) => o.id === opt.id ? { ...o, text: e.target.value } : o);
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            placeholder="Option text..."
                            className="flex-1 h-11 px-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                          {q.options.length > 2 && (
                            <button 
                              onClick={() => removeOption(q.id, opt.id)}
                              className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* True / False — fixed options, just pick correct */}
                  {q.question_type === 'true_false' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Correct Answer</label>
                      {[{ id: 'true', label: '✅ True' }, { id: 'false', label: '❌ False' }].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateQuestion(q.id, { correct_answer: opt.id, options: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }] })}
                          className={`w-full h-11 px-4 rounded-2xl text-sm font-bold border-2 transition-all text-left ${
                            q.correct_answer === opt.id
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {(q.question_type === 'short_answer' || q.question_type === 'long_answer') && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Correct Answer / Sample</label>
                      <textarea 
                        value={q.correct_answer || ''}
                        onChange={(e) => updateQuestion(q.id, { correct_answer: e.target.value })}
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                        rows={3}
                        placeholder="Provide a reference answer for grading..."
                      />
                    </div>
                  )}
                </motion.div>
              ))}

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={addQuestion}
                className="w-full p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
              >
                <div className="size-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 mx-auto mb-3 group-hover:text-indigo-600 group-hover:scale-110 transition-all shadow-sm">
                  <Plus size={24} />
                </div>
                <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Add New Question</span>
              </motion.button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Configuration</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Subject</label>
                <input 
                  type="text" 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Topic</label>
                <input 
                  type="text"
                  value={formData.topic || ''}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Algebra, Thermodynamics"
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'public' })}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all border ${
                      (formData.visibility || 'public') === 'public'
                        ? 'bg-sky-600 text-white border-sky-600 shadow'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-sky-400'
                    }`}
                  >
                    <Globe size={12} /> Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: 'private' })}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all border ${
                      formData.visibility === 'private'
                        ? 'bg-purple-600 text-white border-purple-600 shadow'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-400'
                    }`}
                  >
                    <Lock size={12} /> Private
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {formData.visibility === 'private' ? 'Students join via code only.' : 'Visible to all students in list.'}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Duration (min)</label>
                <input 
                  type="number" 
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Negative Marks</label>
                <input 
                  type="number" 
                  step="0.25"
                  value={formData.negative_marks}
                  onChange={(e) => setFormData({ ...formData, negative_marks: Number(e.target.value) })}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200">
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Randomize Order</label>
                <input 
                  type="checkbox" 
                  checked={formData.randomize_questions || false}
                  onChange={(e) => setFormData({ ...formData, randomize_questions: e.target.checked })}
                  className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {/* End Time Picker */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Deadline (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={formData.end_time || ''}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                />
                <p className="text-[10px] text-gray-400 mt-1">Test will be automatically removed after this time.</p>
              </div>

              {/* Community Distribution */}
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Distribute to Communities</label>
                {loadingCommunities ? (
                   <p className="text-[10px] text-gray-400">Loading your communities...</p>
                ) : myCommunities.length === 0 ? (
                   <p className="text-[10px] text-amber-500 font-medium italic">You haven't joined any communities.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto p-1 border border-gray-100 rounded-lg">
                    {myCommunities.map(c => {
                      const isSelected = formData.test_distributions.some((d: any) => d.community_id === c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const current = formData.test_distributions;
                            const next = isSelected 
                              ? current.filter((d: any) => d.community_id !== c.id)
                              : [...current, { community_id: c.id }];
                            setFormData({ ...formData, test_distributions: next });
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                            isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="size-6 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden">
                            {c.avatar_url ? <img src={c.avatar_url} className="size-full object-cover" /> : <Users size={12} className="m-1.5 text-gray-400" />}
                          </div>
                          <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>{c.name}</span>
                          {isSelected && <Check size={12} className="ml-auto text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Assigned community members can take the test without a code.
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Total Marks</span>
                <span className="text-sm font-bold text-indigo-700">
                  {formData.questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Questions</span>
                <span className="text-sm font-bold text-indigo-700">{formData.questions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// â”€â”€â”€ Secure Test Attempt View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SecureTestAttemptView: React.FC<{ test: any; attempt: any; onFinish: (id: string) => void }> = ({ test, attempt, onFinish }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(attempt.answers || {});
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    // Resume: use saved time_remaining if available, else calculate from start
    if (attempt.time_remaining != null && attempt.time_remaining > 0) {
      return attempt.time_remaining;
    }
    const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    return Math.max(0, test.duration * 60 - elapsed);
  });
  const [violations, setViolations] = useState(attempt.tab_violations || 0);
  const [violationWarning, setViolationWarning] = useState<string | null>(null);
  const [autoSubmitReason, setAutoSubmitReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions] = useState<any[]>(() => {
    const qs = test.questions || [];
    return test.randomize_questions ? [...qs].sort(() => Math.random() - 0.5) : qs;
  });

  const violationsRef = useRef(violations);
  const timeLeftRef = useRef(timeLeft);
  const answersRef = useRef(answers);
  const autoSubmittedRef = useRef(false);

  violationsRef.current = violations;
  timeLeftRef.current = timeLeft;
  answersRef.current = answers;

  // â”€â”€ Enter fullscreen on mount â”€â”€
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !autoSubmittedRef.current) {
        triggerViolation('Fullscreen exited');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  // â”€â”€ Tab-switch / visibility detection â”€â”€
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !autoSubmittedRef.current) {
        triggerViolation('Tab switched');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // â”€â”€ Countdown Timer â”€â”€
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && !autoSubmittedRef.current) {
          clearInterval(interval);
          handleAutoSubmit('Time expired');
          return 0;
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // â”€â”€ Heartbeat: save progress every 30s â”€â”€
  useEffect(() => {
    const interval = setInterval(() => {
      if (!autoSubmittedRef.current) {
        const ans = Object.entries(answersRef.current).map(([questionId, answer]) => ({ questionId, answer }));
        testsService.saveProgress(attempt.id, timeLeftRef.current, ans).catch(console.error);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [attempt.id]);

  const triggerViolation = useCallback(async (reason: string) => {
    if (autoSubmittedRef.current) return;
    const newCount = violationsRef.current + 1;
    setViolations(newCount);
    violationsRef.current = newCount;
    await testsService.recordViolation(attempt.id, newCount).catch(console.error);

    if (newCount >= 3) {
      handleAutoSubmit(`3 violations (${reason})`);
    } else {
      setViolationWarning(`Warning ${newCount}/3: ${reason}. Your test will be submitted after 3 violations.`);
      // Re-enter fullscreen after a short delay
      setTimeout(() => {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }, 1500);
    }
  }, [attempt.id]);

  const handleAutoSubmit = useCallback(async (reason: string) => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    setAutoSubmitReason(reason);
    // Save final progress first
    const ans = Object.entries(answersRef.current).map(([questionId, answer]) => ({ questionId, answer }));
    await testsService.saveProgress(attempt.id, 0, ans).catch(console.error);
    await submit();
  }, [attempt.id]);

  const submit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      const result = await testsService.finishAttempt(attempt.id);
      onFinish(result.id);
    } catch (error) {
      console.error('Error finishing test:', error);
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    // Save progress before submitting
    const ans = Object.entries(answersRef.current).map(([questionId, answer]) => ({ questionId, answer }));
    await testsService.saveProgress(attempt.id, 0, ans).catch(console.error);
    await submit();
  };

  const handleAnswer = useCallback((val: any) => {
    const q = questions[currentIdx];
    if (!q) return;
    setAnswers((prev) => {
      const next = { ...prev, [q.id]: val };
      answersRef.current = next;
      return next;
    });
    testsService.submitAnswer(attempt.id, q.id, val).catch(console.error);
  }, [attempt.id, currentIdx, questions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isWarning = timeLeft < 300; // under 5 minutes

  if (autoSubmitReason) {
    return (
      <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="size-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={48} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Test Auto-Submitted</h2>
          <p className="text-gray-500 mb-2">Reason: <span className="font-bold text-red-600">{autoSubmitReason}</span></p>
          {isSubmitting && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="size-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Processing...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden select-none">
      {/* Violation Warning Banner */}
      <AnimatePresence>
        {violationWarning && (
          <motion.div
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            exit={{ y: -80 }}
            className="absolute top-0 left-0 right-0 z-[300] bg-red-600 text-white px-8 py-4 flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span className="font-bold text-sm">{violationWarning}</span>
            </div>
            <button
              onClick={() => setViolationWarning(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">{test.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-indigo-600 uppercase font-black tracking-widest">{test.subject}</span>
              <span className="size-1 bg-gray-300 rounded-full" />
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{questions.length} Questions</span>
              {violations > 0 && (
                <>
                  <span className="size-1 bg-gray-300 rounded-full" />
                  <span className="text-[10px] text-red-500 uppercase font-black tracking-widest">{violations}/3 Violations</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Violation badge */}
          {violations > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-2xl">
              <ShieldAlert size={16} className="text-red-500" />
              <span className="text-sm font-black text-red-600">{violations}/3</span>
            </div>
          )}
          {/* Timer */}
          <div className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border-2 transition-all ${
            isWarning ? 'bg-red-50 border-red-100 text-red-600 animate-pulse' : 'bg-gray-50 border-gray-100 text-gray-900'
          }`}>
            <Timer size={18} />
            <span className="text-lg font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span>
          </div>
          {/* Submit */}
          <button
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
            Submit Test
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-12 bg-gray-50/30">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentQuestion?.marks} Marks</span>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as any }}>
                  {currentQuestion?.question_text}
                </ReactMarkdown>
              </h2>

              <div className="space-y-4">
                {currentQuestion?.question_type === 'mcq' && currentQuestion.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt.id)}
                    className={`w-full p-6 text-left rounded-3xl border-2 transition-all flex items-center gap-6 group ${
                      answers[currentQuestion.id] === opt.id
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-lg shadow-indigo-500/5'
                        : 'border-white bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5'
                    }`}
                  >
                    <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[currentQuestion.id] === opt.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-200 group-hover:border-indigo-300'
                    }`}>
                      {answers[currentQuestion.id] === opt.id && <div className="size-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-base font-bold markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as any }}>{opt.text}</ReactMarkdown>
                    </span>
                  </button>
                ))}

                {currentQuestion?.question_type === 'multi_select' && currentQuestion.options.map((opt: any) => {
                  const current = (answers[currentQuestion.id] || []) as string[];
                  const isSelected = current.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const next = isSelected ? current.filter(id => id !== opt.id) : [...current, opt.id];
                        handleAnswer(next);
                      }}
                      className={`w-full p-6 text-left rounded-3xl border-2 transition-all flex items-center gap-6 group ${
                        isSelected ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-lg shadow-indigo-500/5' : 'border-white bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5'
                      }`}
                    >
                      <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-200 group-hover:border-indigo-300'
                      }`}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span className="text-base font-bold markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as any }}>{opt.text}</ReactMarkdown>
                      </span>
                    </button>
                  );
                })}

                {currentQuestion?.question_type === 'short_answer' && (
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-6 bg-white border-2 border-white rounded-3xl outline-none focus:border-indigo-600 focus:shadow-2xl focus:shadow-indigo-500/10 transition-all text-lg font-bold text-gray-900 placeholder-gray-200"
                  />
                )}

                {currentQuestion?.question_type === 'long_answer' && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Type your detailed answer here..."
                    className="w-full p-8 bg-white border-2 border-white rounded-[2rem] outline-none focus:border-indigo-600 focus:shadow-2xl focus:shadow-indigo-500/10 transition-all text-lg font-bold text-gray-900 placeholder-gray-200 min-h-[300px] resize-none"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-12 border-t border-gray-100">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl text-base font-black text-gray-500 hover:text-gray-900 hover:border-gray-300 disabled:opacity-30 transition-all shadow-sm hover:shadow-md"
              >
                <ChevronLeft size={24} /> Previous
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Progress</span>
                <div className="flex items-center gap-1">
                  {questions.map((_: any, i: number) => (
                    <div 
                      key={i} 
                      className={`size-1.5 rounded-full transition-all ${i === currentIdx ? 'bg-indigo-600 w-4' : i < currentIdx ? 'bg-indigo-200' : 'bg-gray-200'}`} 
                    />
                  ))}
                </div>
              </div>

              <button
                disabled={currentIdx === questions.length - 1}
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-base font-black hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-xl shadow-indigo-200 active:scale-95"
              >
                Next Question <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <aside className="w-96 bg-white border-l border-gray-100 p-8 flex flex-col shadow-2xl shadow-black/5">
          <div className="flex-1 overflow-y-auto space-y-10">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Question Palette</h3>
                <span className="text-[10px] font-black text-indigo-600">{answeredCount}/{questions.length} Answered</span>
              </div>
              <div className="grid grid-cols-4 gap-3 content-start">
                {questions.map((q: any, idx: number) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`size-14 rounded-2xl text-sm font-black flex items-center justify-center transition-all relative ${
                      currentIdx === idx
                        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 scale-110 z-10'
                        : answers[q.id]
                          ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-100'
                          : 'bg-gray-50 text-gray-400 border-2 border-transparent hover:border-gray-200'
                    }`}
                  >
                    {idx + 1}
                    {answers[q.id] && currentIdx !== idx && (
                      <div className="absolute -top-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Security Status */}
            <div className="p-5 rounded-2xl border-2 border-red-100 bg-red-50/50 space-y-3">
              <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Security Monitor</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Tab Violations</span>
                  <span className={`text-xs font-black ${violations > 0 ? 'text-red-600' : 'text-green-600'}`}>{violations}/3</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      violations === 0 ? 'bg-green-500' : violations === 1 ? 'bg-amber-500' : 'bg-red-600'
                    }`}
                    style={{ width: `${(violations / 3) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">Test auto-submits after 3 violations.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-3 bg-indigo-600 rounded-full" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 bg-indigo-50 border-2 border-indigo-100 rounded-full" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 bg-gray-50 rounded-full" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

const TestResultsView: React.FC<{ attempt: any, onBack: () => void }> = ({ attempt, onBack }) => {
  const test = attempt.tests;
  const questions = test.questions;
  const answers = attempt.answers;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <div className="text-center space-y-6 pt-12">
        <div className="size-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/10 rotate-3">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Test Submitted!</h1>
        <p className="text-gray-500 font-medium text-lg">Great job completing the <span className="text-indigo-600 font-bold">{test.title}</span> assessment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 text-center group hover:scale-105 transition-all">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Your Score</span>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-black text-indigo-600 tracking-tighter">{attempt.score}</span>
            <span className="text-lg text-gray-300 font-bold">/ {test.total_marks}</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 text-center group hover:scale-105 transition-all">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Accuracy</span>
          <span className="text-5xl font-black text-green-600 tracking-tighter">
            {Math.round((attempt.score / test.total_marks) * 100)}%
          </span>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 text-center group hover:scale-105 transition-all">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Questions</span>
          <span className="text-5xl font-black text-gray-900 tracking-tighter">{questions.length}</span>
        </div>
      </div>

      {test.test_resources?.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Study Resources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {test.test_resources.map((res: any, idx: number) => (
              <a 
                key={idx} 
                href={res.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
              >
                <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate capitalize tracking-tight">{res.type}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reference</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Detailed Review</h3>
        {questions.map((q: any, idx: number) => {
          const ans = answers.find((a: any) => a.question_id === q.id);
          return (
            <div key={q.id} className={`p-8 rounded-[2rem] border-2 transition-all ${ans?.is_correct ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-6">
                  <span className={`size-8 rounded-xl flex items-center justify-center text-sm font-black shadow-lg ${ans?.is_correct ? 'bg-green-600 text-white shadow-green-200' : 'bg-red-600 text-white shadow-red-200'}`}>
                    {idx + 1}
                  </span>
                  <h4 className="text-lg font-bold text-gray-900 leading-tight">{q.question_text}</h4>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ans?.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {ans?.marks_awarded || 0} / {q.marks} Marks
                </span>
              </div>

              <div className="ml-14 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-white rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Your Answer</span>
                    <p className={`text-sm font-bold ${ans?.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                      {Array.isArray(ans?.answer) ? ans.answer.join(', ') : ans?.answer || 'No answer'}
                    </p>
                  </div>
                  {!ans?.is_correct && (
                    <div className="p-5 bg-white rounded-2xl border border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Correct Answer</span>
                      <p className="text-sm font-bold text-gray-900">
                        {Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}
                      </p>
                    </div>
                  )}
                </div>
                {q.explanation && (
                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-sm text-indigo-900 font-medium italic relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex gap-3">
                      <Info size={18} className="shrink-0 text-indigo-500" />
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as any }}>
                          {q.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={onBack} 
        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
      >
        Back to Assessments
      </button>
    </motion.div>
  );
};

const TestAnalyticsView: React.FC<{ test: any, onBack: () => void, onGrade: (id: string) => void }> = ({ test, onBack, onGrade }) => {
  const analytics = test.analytics?.attempts || [];
  const questionStats = test.analytics?.questionStats || {};
  const avgScore = analytics.length > 0 
    ? analytics.reduce((sum: number, a: any) => sum + a.score, 0) / analytics.length 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="size-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{test.title} Analytics</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Performance Insights & Statistics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 group hover:scale-105 transition-all">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Total Attempts</span>
          <span className="text-4xl font-black text-gray-900 tracking-tighter">{analytics.length}</span>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 group hover:scale-105 transition-all">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Average Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-indigo-600 tracking-tighter">{avgScore.toFixed(1)}</span>
            <span className="text-sm text-gray-300 font-bold">/ {test.total_marks}</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 group hover:scale-105 transition-all">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Pass Rate</span>
          <span className="text-4xl font-black text-green-600 tracking-tighter">
            {analytics.length > 0 ? Math.round((analytics.filter((a: any) => a.score >= test.total_marks * 0.4).length / analytics.length) * 100) : 0}%
          </span>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 group hover:scale-105 transition-all">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Max Score</span>
          <span className="text-4xl font-black text-amber-600 tracking-tighter">
            {analytics.length > 0 ? Math.max(...analytics.map((a: any) => a.score)) : 0}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Student Submissions</h3>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black">{analytics.length} submitted</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Student</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Score</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Accuracy</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Submitted At</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">Violations</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.map((attempt: any) => (
                  <tr key={attempt.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {attempt.profiles?.avatar_url ? (
                          <img
                            src={attempt.profiles.avatar_url}
                            className="size-10 rounded-2xl border-2 border-white shadow-sm group-hover:scale-110 transition-transform object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="size-10 rounded-2xl border-2 border-white shadow-sm bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase group-hover:scale-110 transition-transform">
                            {(attempt.profiles?.full_name || 'S').slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-gray-900 tracking-tight block">{attempt.profiles?.full_name || 'Unknown Student'}</span>
                          <span className="text-[10px] text-gray-400">{attempt.profiles?.email || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-indigo-600">{attempt.score ?? 'â€“'} <span className="text-gray-300">/ {test.total_marks}</span></span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-[100px] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((attempt.score ?? 0) / test.total_marks) * 100}%` }}
                            className={`h-full ${(attempt.score ?? 0) / test.total_marks >= 0.8 ? 'bg-green-500' : (attempt.score ?? 0) / test.total_marks >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-500">{Math.round(((attempt.score ?? 0) / test.total_marks) * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-gray-500 font-bold">
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'â€“'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {(attempt.tab_violations ?? 0) > 0 ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600">
                          <ShieldAlert size={12} /> {attempt.tab_violations}/3
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-green-600">Clean</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {attempt.is_graded ? (
                        <span className="px-4 py-1.5 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">Graded</span>
                      ) : (
                        <button
                          onClick={() => onGrade(attempt.id)}
                          className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                        >
                          Grade Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {analytics.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                          <Users size={32} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No submissions yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/5 space-y-8">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Question Breakdown</h3>
          <div className="space-y-8">
            {test.questions.map((q: any, idx: number) => {
              const stats = questionStats[q.id] || { correct: 0, total: 0 };
              const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
              return (
                <div key={q.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="size-6 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">Q{idx + 1}</span>
                      <span className="text-xs font-bold text-gray-900 truncate markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as any }}>
                          {q.question_text}
                        </ReactMarkdown>
                      </span>
                    </div>
                    <span className={`text-[10px] font-black shrink-0 ml-4 ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${accuracy}%` }}
                      className={`h-full ${accuracy >= 70 ? 'bg-green-500' : accuracy >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TestGradingView: React.FC<{ attempt: any, onBack: () => void, onFinish: () => void }> = ({ attempt, onBack, onFinish }) => {
  const test = attempt.tests;
  const questions = test.questions;
  const [grades, setGrades] = useState<Record<string, { marks: number, is_correct: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialGrades: any = {};
    attempt.answers.forEach((ans: any) => {
      initialGrades[ans.question_id] = {
        marks: ans.marks_awarded || 0,
        is_correct: ans.is_correct || false
      };
    });
    setGrades(initialGrades);
  }, [attempt]);

  const handleSaveGrades = async () => {
    setIsSaving(true);
    try {
      const payload = Object.entries(grades).map(([qId, data]) => ({
        question_id: qId,
        marks: data.marks,
        is_correct: data.is_correct
      }));
      await testsService.gradeAttempt(attempt.id, payload);
      onFinish();
    } catch (error) {
      console.error('Error saving grades:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto space-y-10 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="size-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Grading: {attempt.profiles?.full_name}</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Manual Assessment Review</p>
          </div>
        </div>
        <button 
          onClick={handleSaveGrades} 
          disabled={isSaving} 
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'Saving...' : 'Submit Grades'}
        </button>
      </div>

      <div className="space-y-8">
        {questions.map((q: any, idx: number) => {
          const ans = attempt.answers.find((a: any) => a.question_id === q.id);
          const isManual = q.question_type === 'short_answer' || q.question_type === 'long_answer';
          
          return (
            <div key={q.id} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-black/5 space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex gap-6">
                  <span className="size-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 leading-tight markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock as any }}>
                        {q.question_text}
                      </ReactMarkdown>
                    </h4>
                    <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {q.question_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Award Marks</label>
                    <div className="relative">
                      <input 
                        type="number"
                        max={q.marks}
                        min={0}
                        value={grades[q.id]?.marks || 0}
                        onChange={(e) => setGrades({
                          ...grades,
                          [q.id]: { ...grades[q.id], marks: Number(e.target.value), is_correct: Number(e.target.value) > 0 }
                        })}
                        className="w-20 h-10 px-3 bg-white border-2 border-gray-100 rounded-xl text-sm font-black text-indigo-600 outline-none focus:border-indigo-600 transition-all text-center"
                      />
                    </div>
                    <span className="text-sm font-black text-gray-300">/ {q.marks}</span>
                  </div>
                </div>
              </div>

              <div className="ml-16 space-y-6">
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gray-300"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Student's Answer</span>
                  <p className="text-base text-gray-900 font-bold whitespace-pre-wrap leading-relaxed">
                    {Array.isArray(ans?.answer) ? ans.answer.join(', ') : ans?.answer || 'No answer provided'}
                  </p>
                </div>

                {isManual && (
                  <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">Reference Answer</span>
                    <p className="text-base text-indigo-900 font-bold whitespace-pre-wrap leading-relaxed">{q.correct_answer}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TestsQuizzes;
