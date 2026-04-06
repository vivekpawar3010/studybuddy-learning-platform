import React, { useState, useEffect, useRef } from 'react';
import { Notebook, Section, Page } from '../../types';
import AIPanel from './AIPanel';
import Editor from './Editor';
import { notesService } from '../../services/notes-service';
import { auth } from '../../services/firebase';
import {
  Book, ChevronRight, Plus, Trash2, Layers, PanelLeft,
  PanelLeftClose, Sparkles, Hash, Layout, ChevronLeft, PanelRight, PanelRightClose,
  Share2, Copy, MoreVertical, Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Remove MOCK_NOTEBOOKS

const MyNotes: React.FC = () => {
  // State management
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sharedPages, setSharedPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNbIds, setExpandedNbIds] = useState<string[]>([]);
  const [selectedNbId, setSelectedNbId] = useState<string>('');
  const [selectedSecId, setSelectedSecId] = useState<string>('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [shareTargetEmail, setShareTargetEmail] = useState('');
  const [shareAccess, setShareAccess] = useState<'viewer' | 'editor'>('viewer');

  // Panel collapse states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPagesOpen, setIsPagesOpen] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Panel refs for manual control
  const sidebarPanelRef = useRef<any>(null);
  const pagesPanelRef = useRef<any>(null);
  const aiPanelRef = useRef<any>(null);

  // Fetch from DB
  const fetchData = async () => {
    setLoading(true);
    const nbs = await notesService.getMyNotebooks();
    const shared = await notesService.getSharedPages();
    setNotebooks(nbs);
    setSharedPages(shared);
    
    if (nbs.length > 0 && !selectedNbId && !selectedPageId) {
      setSelectedNbId(nbs[0].id);
      setExpandedNbIds([nbs[0].id]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShare = async () => {
    if (!sharePageId || !shareTargetEmail.trim()) return;
    try {
      await notesService.sharePage(sharePageId, shareTargetEmail.trim(), shareAccess);
      alert('Shared successfully!');
      setShowShareModal(false);
      setShareTargetEmail('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const selectedNb = notebooks.find(nb => nb.id === selectedNbId);
  const selectedSec = selectedNb?.sections.find(sec => sec.id === selectedSecId);
  const selectedPage = 
    selectedSec?.pages.find(p => p.id === selectedPageId) || 
    sharedPages.find(p => p.id === selectedPageId);

  // Helper to toggle panels via ref
  // Unused: replaced by direct ref access in JSX

  // --- Renaming Logic ---
  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEditing = (type: 'nb' | 'sec' | 'page', id: string) => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      cancelEditing();
      return;
    }

    if (type === 'nb') {
      handleRenameNb(id, trimmedValue);
    } else if (type === 'sec') {
      handleRenameSec(id, trimmedValue);
    } else if (type === 'page') {
      handleRenamePage(id, trimmedValue);
    }
    setEditingId(null);
    setEditValue('');
  };

  // --- Notebook CRUD ---
  const handleCreateNb = async () => {
    const id = await notesService.createNotebook('New Notebook', '#' + Math.floor(Math.random()*16777215).toString(16));
    await fetchData();
    setSelectedNbId(id);
    setExpandedNbIds(prev => [...prev, id]);
  };

  const handleRenameNb = async (id: string, title: string) => {
    await notesService.renameItem('notebooks', id, title);
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, title } : nb));
  };

  const handleDeleteNb = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notebook?')) return;
    await notesService.deleteItem('notebooks', id);
    await fetchData();
  };

  // --- Section CRUD ---
  const handleCreateSec = async (nbId: string) => {
    const id = await notesService.createSection(nbId, 'New Section');
    await fetchData();
    setSelectedNbId(nbId);
    setSelectedSecId(id);
  };

  const handleRenameSec = async (id: string, title: string) => {
    await notesService.renameItem('sections', id, title);
    setNotebooks(prev => prev.map(nb => ({
      ...nb,
      sections: nb.sections.map(sec => sec.id === id ? { ...sec, title } : sec)
    })));
  };

  const handleDeleteSec = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    await notesService.deleteItem('sections', id);
    await fetchData();
  };

  // --- Page CRUD ---
  const handleCreatePage = async () => {
    if (!selectedSecId) return;
    const id = await notesService.createPage(selectedSecId, 'Untitled');
    await fetchData();
    setSelectedPageId(id);
  };

  const handleRenamePage = async (id: string, title: string) => {
    await notesService.renameItem('pages', id, title);
    setNotebooks(prev => prev.map(nb => ({
      ...nb,
      sections: nb.sections.map(sec => ({
        ...sec,
        pages: sec.pages.map(p => p.id === id ? { ...p, title } : p)
      }))
    })));
    setSharedPages(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  };

  const handleDeletePage = async (id: string) => {
    if (!window.confirm('Delete this page?')) return;
    await notesService.deleteItem('pages', id);
    await fetchData();
  };

  const handlePageChange = async (content: string) => {
    if (!selectedPageId) return;
    await notesService.updatePageContent(selectedPageId, content);
    // Optimistic local update
    if (selectedPage?.accessType) {
      setSharedPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, content } : p));
    } else {
      setNotebooks(prev => prev.map(nb => ({
        ...nb,
        sections: nb.sections.map(sec => ({
          ...sec,
          pages: sec.pages.map(p => p.id === selectedPageId ? { ...p, content } : p)
        }))
      })));
    }
  };

  const toggleNbExpanded = (id: string) => {
    setExpandedNbIds(prev => 
      prev.includes(id) ? prev.filter(nbId => nbId !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-[calc(100vh-112px)] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm relative">
      <PanelGroup direction="horizontal">
        
        {/* 1. Notebooks Panel */}
        <Panel
          ref={sidebarPanelRef}
          defaultSize={15}
          minSize={12}
          maxSize={30}
          collapsible
          collapsedSize={4}
          onCollapse={() => setIsSidebarOpen(false)}
          onExpand={() => setIsSidebarOpen(true)}
          className="h-full bg-[#333333] flex flex-col overflow-hidden whitespace-nowrap z-20 border-r border-white/5 relative"
        >
          {isSidebarOpen ? (
            <>
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notebooks</h2>
                <div className="flex items-center gap-1">
                  <button onClick={handleCreateNb} className="p-1 hover:bg-white/10 rounded text-gray-400" title="New Notebook">
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => sidebarPanelRef.current?.collapse()}
                    className="p-1 hover:bg-white/10 rounded text-gray-400"
                    title="Close sidebar"
                  >
                    <PanelLeftClose size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar-dark">
                {notebooks.map(nb => (
                  <div key={nb.id} className="space-y-0.5">
                    <div
                      onDoubleClick={() => startEditing(nb.id, nb.title)}
                      onClick={() => {
                        setSelectedNbId(nb.id);
                        toggleNbExpanded(nb.id);
                      }}
                      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedNbId === nb.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                      }`}
                    >
                      <ChevronRight
                        size={14}
                        className={`shrink-0 transition-transform duration-200 ${
                          expandedNbIds.includes(nb.id) ? 'rotate-90' : ''
                        }`}
                      />
                      <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: nb.color }}>
                        <Book size={10} className="text-white" />
                      </div>
                      {editingId === nb.id ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEditing('nb', nb.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing('nb', nb.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          className="bg-white/20 text-white text-sm px-1 rounded outline-none w-full"
                        />
                      ) : (
                        <span className="text-sm font-medium truncate flex-1">{nb.title}</span>
                      )}
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(nb.id, nb.title); }}
                          className="p-1 hover:text-indigo-400"
                          title="Rename Notebook"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCreateSec(nb.id); }}
                          className="p-1 hover:text-emerald-400"
                          title="Add Section"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteNb(nb.id); }}
                          className="p-1 hover:text-red-400"
                          title="Delete Notebook"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedNbIds.includes(nb.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-4 space-y-0.5"
                        >
                          {nb.sections.map(sec => (
                            <div
                              key={sec.id}
                              onDoubleClick={(e) => { e.stopPropagation(); startEditing(sec.id, sec.title); }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNbId(nb.id);
                                setSelectedSecId(sec.id);
                                setSelectedPageId(sec.pages[0]?.id || '');
                              }}
                              className={`group flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                                selectedSecId === sec.id ? 'bg-white/5 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                              }`}
                            >
                              <Layers size={12} className="shrink-0" />
                              {editingId === sec.id ? (
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => saveEditing('sec', sec.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditing('sec', sec.id);
                                    if (e.key === 'Escape') cancelEditing();
                                  }}
                                  className="bg-white/20 text-white text-xs px-1 rounded outline-none w-full"
                                />
                              ) : (
                                <span className="text-xs font-medium truncate flex-1">{sec.title}</span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); startEditing(sec.id, sec.title); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400"
                                title="Rename Section"
                              >
                                <Edit2 size={10} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSec(sec.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                                title="Delete Section"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* ══ SHARED WITH ME ══ */}
                {sharedPages.length > 0 && (
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <h2 className="px-3 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Share2 size={10}/> Shared with Me
                    </h2>
                    {sharedPages.map(page => (
                      <div
                        key={page.id}
                        onClick={() => {
                          setSelectedNbId('');
                          setSelectedSecId('');
                          setSelectedPageId(page.id);
                        }}
                        className={`mx-2 flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedPageId === page.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                      >
                        <Hash size={14} className="shrink-0 opacity-40" />
                        <span className="text-sm font-medium truncate flex-1">{page.title}</span>
                        {page.accessType === 'viewer' && (
                          <div className="text-[8px] bg-white/10 px-1 py-0.5 rounded uppercase font-black text-gray-500">View</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 gap-4 w-full h-full bg-[#2a2a2a]">
              <button
                onClick={() => sidebarPanelRef.current?.expand()}
                className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-all hover:text-white"
                title="Open sidebar"
              >
                <PanelLeft size={20} />
              </button>
              <div className="w-6 h-[1px] bg-white/10" />
              <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar py-2 items-center">
                {notebooks.map(nb => (
                  <button 
                    key={nb.id} 
                    onClick={() => { setSelectedNbId(nb.id); sidebarPanelRef.current?.expand(); }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 shrink-0 ${selectedNbId === nb.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#333333]' : 'opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: nb.color }}
                    title={nb.title}
                  >
                    <Book size={14} className="text-white" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-100 hover:bg-indigo-400 transition-colors cursor-col-resize z-30" />

        {/* 2. Pages Panel */}
        <Panel
          ref={pagesPanelRef}
          defaultSize={15}
          minSize={12}
          maxSize={30}
          collapsible
          collapsedSize={4}
          onCollapse={() => setIsPagesOpen(false)}
          onExpand={() => setIsPagesOpen(true)}
          className="h-full bg-[#F5F5F5] border-r border-gray-200 flex flex-col overflow-hidden whitespace-nowrap"
        >
          {isPagesOpen ? (
            <>
              <div className="p-4 flex items-center justify-between border-b border-gray-200">
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pages</h2>
                <div className="flex items-center gap-1 ml-auto">
                  <button onClick={handleCreatePage} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="New Page">
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => pagesPanelRef.current?.collapse()}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500"
                    title="Collapse Pages"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {selectedSec?.pages.map(page => (
                  <div
                    key={page.id}
                    onDoubleClick={() => startEditing(page.id, page.title)}
                    onClick={() => setSelectedPageId(page.id)}
                    className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPageId === page.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className={`w-1 h-4 rounded-full ${
                      selectedPageId === page.id ? 'bg-indigo-600' : 'bg-transparent'
                    }`} />
                    {editingId === page.id ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEditing('page', page.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing('page', page.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="bg-white border border-indigo-300 text-sm px-1 rounded outline-none w-full"
                      />
                    ) : (
                      <span className="text-sm font-medium truncate flex-1">{page.title}</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditing(page.id, page.title); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }} 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center py-4 gap-2 w-full h-full overflow-y-auto no-scrollbar bg-gray-100">
              <button
                onClick={() => pagesPanelRef.current?.expand()}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 mb-2"
                title="Expand Pages"
              >
                <Layout size={20} />
              </button>
              {selectedSec?.pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPageId(page.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 shrink-0 ${
                    selectedPageId === page.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-600'
                  }`}
                  title={page.title}
                >
                  {page.title.charAt(0).toUpperCase() || (idx + 1)}
                </button>
              ))}
            </div>
          )}
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-100 hover:bg-indigo-400 transition-colors cursor-col-resize z-30" />

        {/* 3. Editor Panel */}
        <Panel defaultSize={50} minSize={30} className="h-full bg-white flex flex-col overflow-hidden">
          {selectedPage ? (
            <Editor 
              content={selectedPage.content} 
              onChange={handlePageChange}
              title={selectedPage.title}
              onTitleChange={(title) => handleRenamePage(selectedPage.id, title)}
              tags={selectedPage.tags || []}
              lastEdited={selectedPage.lastEdited}
              readOnly={selectedPage.accessType === 'viewer'}
              accessType={selectedPage.accessType}
              onShare={() => { setSharePageId(selectedPage.id); setShowShareModal(true); }}
              onClone={async () => {
                const targetNb = notebooks[0];
                const targetSec = targetNb?.sections?.[0]?.id;
                if (!targetSec) {
                  alert('Please create a notebook and at least one section first to save shared notes.');
                  return;
                }
                try {
                  const newId = await notesService.clonePage(selectedPage.id, targetSec);
                  await fetchData();
                  setSelectedNbId(targetNb.id);
                  setSelectedSecId(targetSec);
                  setSelectedPageId(newId);
                  alert('Saved as a copy in your notebook!');
                } catch (err: any) {
                  alert('Error cloning note: ' + err.message);
                }
              }}
              onTagsChange={async (tags) => {
                if (!selectedPageId) return;
                try {
                  await notesService.updatePageTags(selectedPageId, tags);
                  if (selectedPage?.accessType) {
                    setSharedPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, tags } : p));
                  } else {
                    setNotebooks(notebooks.map(nb => ({
                      ...nb,
                      sections: nb.sections.map(sec => ({
                        ...sec,
                        pages: sec.pages.map(p => p.id === selectedPageId ? { ...p, tags } : p)
                      }))
                    })));
                  }
                } catch (err: any) {
                  console.error('Error updating tags:', err);
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash size={32} className="text-gray-200" />
                </div>
                <p className="text-sm font-medium">Select a page to start writing</p>
              </div>
            </div>
          )}
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-100 hover:bg-indigo-400 transition-colors cursor-col-resize z-30" />

        {/* 4. AI Panel */}
        <Panel
          ref={aiPanelRef}
          defaultSize={20}
          minSize={15}
          maxSize={40}
          collapsible
          collapsedSize={4}
          onCollapse={() => setIsAiOpen(false)}
          onExpand={() => setIsAiOpen(true)}
          className="h-full bg-white border-l border-gray-100 flex flex-col overflow-hidden whitespace-nowrap"
        >
          {isAiOpen ? (
            <>
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">AI Assistant</h2>
                <button
                  onClick={() => aiPanelRef.current?.collapse()}
                  className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600"
                  title="Collapse AI Assistant"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIPanel 
                  isOpen={true} 
                  onClose={() => aiPanelRef.current?.collapse()} 
                  noteContent={selectedPage?.content || ''} 
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center py-4 gap-4 w-full h-full bg-gray-50">
               <button
                onClick={() => aiPanelRef.current?.expand()}
                className="p-2 hover:bg-indigo-50 rounded-full text-indigo-600 transition-all hover:scale-110 shadow-sm border border-indigo-50"
                title="Expand AI Assistant"
              >
                <Sparkles size={20} />
              </button>
            </div>
          )}
        </Panel>
      </PanelGroup>

      {/* ══ SHARE MODAL ══ */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-3">
                <Share2 className="text-indigo-600" /> Share Note
              </h3>
              <p className="text-sm text-gray-500 mb-6">Enter the user ID of the person you want to collaborate with.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">User ID / Email</label>
                  <input 
                    type="text"
                    value={shareTargetEmail}
                    onChange={(e) => setShareTargetEmail(e.target.value)}
                    placeholder="Enter User ID..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Access Level</label>
                   <div className="grid grid-cols-2 gap-2">
                     <button
                       onClick={() => setShareAccess('viewer')}
                       className={`p-3 rounded-2xl border-2 transition-all ${shareAccess === 'viewer' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400'}`}
                     >
                       <span className="font-bold block">Viewer</span>
                       <span className="text-[10px]">Read only</span>
                     </button>
                     <button
                       onClick={() => setShareAccess('editor')}
                       className={`p-3 rounded-2xl border-2 transition-all ${shareAccess === 'editor' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400'}`}
                     >
                       <span className="font-bold block">Editor</span>
                       <span className="text-[10px]">Can edit note</span>
                     </button>
                   </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-8">
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 py-4 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Share Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MyNotes;
