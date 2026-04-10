import React, { useState, useEffect, useRef } from 'react';
import { Notebook, Section, Page } from '../../types';
import AIPanel from './AIPanel';
import Editor from './Editor';
import { notesService } from '../../services/notes-service';
import { auth } from '../../services/firebase';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Book, ChevronRight, Plus, Trash2, Layers,
  PanelLeftClose, Sparkles, Hash, Layout, ChevronLeft,
  Share2, Edit2, FolderOpen, ArrowLeft, FileText, Loader2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// ─── Tiny inline spinner ───────────────────────────────────────
const Spin: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);

// ─── Notebook color palette ─────────────────────────────────────
const NB_COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6b7280', // Gray
];

// ─── Color Swatches ────────────────────────────────────────────
const ColorPicker: React.FC<{ value: string; onChange: (c: string) => void }> = ({ value, onChange }) => (
  <div className="grid grid-cols-6 gap-2">
    {NB_COLORS.map(c => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(c)}
        className={`w-9 h-9 rounded-xl transition-all ${
          value === c ? 'ring-2 ring-offset-2 ring-slate-600 scale-110' : 'hover:scale-105'
        }`}
        style={{ backgroundColor: c }}
        title={c}
      />
    ))}
  </div>
);


// Derive a light bg from hex for the folder icon circle
const hexToLight = (hex: string) => hex + '22'; // ~13% opacity

// ─── Folder card component ─────────────────────────────────────
const FolderCard: React.FC<{
  notebook: Notebook;
  onClick: () => void;
  onRename: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
}> = ({ notebook, onClick, onRename, onChangeColor, onDelete }) => {
  const totalPages = notebook.sections.reduce((s, sec) => s + sec.pages.length, 0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="relative group"
    >
      <button
        onClick={onClick}
        className="w-full bg-white rounded-2xl border border-slate-200 p-6 flex flex-col
                   items-center text-center hover:shadow-lg hover:border-blue-300
                   transition-all duration-200 focus:outline-none"
      >
        {/* Folder icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: hexToLight(notebook.color) }}
        >
          <FolderOpen size={34} style={{ color: notebook.color }} />
        </div>

        <p className="text-sm font-bold text-slate-900 truncate w-full px-1">{notebook.title}</p>
        <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
          {totalPages} {totalPages === 1 ? 'page' : 'pages'}
        </p>
      </button>

      {/* Context menu trigger */}
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200
                       rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
              <circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl
                             shadow-xl overflow-hidden w-36 py-1"
                >
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onRename(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold
                               text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 size={12} /> Rename
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onChangeColor(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold
                               text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="4" cy="8" r="2.5" fill="#3b82f6"/>
                      <circle cx="8" cy="4" r="2.5" fill="#10b981"/>
                      <circle cx="12" cy="8" r="2.5" fill="#f59e0b"/>
                      <circle cx="8" cy="12" r="2.5" fill="#ec4899"/>
                    </svg> Change Color
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold
                               text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Skeleton loader ───────────────────────────────────────────
const FolderSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 mb-4" />
        <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
        <div className="h-2 w-12 bg-slate-100 rounded" />
      </div>
    ))}
  </div>
);

// ─── Main Component ────────────────────────────────────────────
const MyNotes: React.FC = () => {
  // 'folders' = landing grid; 'editor' = 3-panel workspace
  const [view, setView] = useState<'folders' | 'editor'>('folders');

  const [notebooks, setNotebooks]     = useState<Notebook[]>([]);
  const [sharedPages, setSharedPages] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expandedNbIds, setExpandedNbIds] = useState<string[]>([]);
  const [selectedNbId, setSelectedNbId]   = useState<string>('');
  const [selectedSecId, setSelectedSecId] = useState<string>('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editValue, setEditValue]     = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePageId, setSharePageId] = useState<string | null>(null);
  const [shareTargetEmail, setShareTargetEmail] = useState('');
  const [shareAccess, setShareAccess] = useState<'viewer' | 'editor'>('viewer');

  // Create notebook modal
  const [showCreateNbModal, setShowCreateNbModal] = useState(false);
  const [newNbName, setNewNbName]       = useState('');
  const [newNbColor, setNewNbColor]     = useState(NB_COLORS[0]);

  // Change-color modal for existing notebooks
  const [colorNbId, setColorNbId]       = useState<string | null>(null);
  const [colorPickValue, setColorPickValue] = useState('');

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Panel collapse states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPagesOpen, setIsPagesOpen]     = useState(true);
  const [isAiOpen, setIsAiOpen]           = useState(false);

  // ── Per-operation loading flags ──────────────────────────────
  const [creatingNb, setCreatingNb]       = useState(false);
  const [creatingSec, setCreatingSec]     = useState(false);
  const [creatingPage, setCreatingPage]   = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [savingShare, setSavingShare]     = useState(false);
  const [savingRename, setSavingRename]   = useState(false);

  const sidebarPanelRef = useRef<any>(null);
  const pagesPanelRef   = useRef<any>(null);
  const aiPanelRef      = useRef<any>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    const [nbs, shared] = await Promise.all([
      notesService.getMyNotebooks(),
      notesService.getSharedPages(),
    ]);
    setNotebooks(nbs);
    setSharedPages(shared);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ── Helpers ────────────────────────────────────────────────────
  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };
  const cancelEditing = () => { setEditingId(null); setEditValue(''); };
  const saveEditing = (type: 'nb' | 'sec' | 'page', id: string) => {
    const v = editValue.trim();
    if (!v) { cancelEditing(); return; }
    if (type === 'nb')   handleRenameNb(id, v);
    if (type === 'sec')  handleRenameSec(id, v);
    if (type === 'page') handleRenamePage(id, v);
    setEditingId(null);
    setEditValue('');
  };

  // ── Notebook CRUD ─────────────────────────────────────────────
  // Open the create modal instead of instantly creating
  const openCreateNbModal = () => {
    setNewNbName('');
    setNewNbColor(NB_COLORS[0]);
    setShowCreateNbModal(true);
  };

  const handleCreateNb = async () => {
    if (creatingNb || !newNbName.trim()) return;
    setCreatingNb(true);
    try {
      const nbId  = await notesService.createNotebook(newNbName.trim(), newNbColor);
      const secId = await notesService.createSection(nbId, 'Section 1');
      await notesService.createPage(secId, 'Page 1');
      await fetchData();
      setSelectedNbId(nbId);
      setSelectedSecId(secId);
      setExpandedNbIds(prev => [...prev, nbId]);
      setShowCreateNbModal(false);
    } finally {
      setCreatingNb(false);
    }
  };

  const handleRenameNb = async (id: string, title: string) => {
    setSavingRename(true);
    try {
      await notesService.renameItem('notebooks', id, title);
      setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, title } : nb));
    } finally {
      setSavingRename(false);
    }
  };

  const handleChangeNbColor = async (id: string, color: string) => {
    await notesService.updateNotebookColor(id, color);
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, color } : nb));
    setColorNbId(null);
  };

  const handleDeleteNb = async (id: string) => {
    setConfirm({
      open: true,
      title: 'Delete Notebook?',
      message: 'This will permanently delete the notebook and all its sections and pages. This cannot be undone.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await notesService.deleteItem('notebooks', id);
          if (selectedNbId === id) {
            setSelectedNbId(''); setSelectedSecId(''); setSelectedPageId('');
            setView('folders');
          }
          await fetchData();
        } finally {
          setDeletingId(null);
          setConfirm(c => ({ ...c, open: false }));
        }
      },
    });
  };

  // ── Section CRUD ──────────────────────────────────────────────
  const handleCreateSec = async (nbId: string) => {
    if (creatingSec) return;
    setCreatingSec(true);
    try {
      const secId  = await notesService.createSection(nbId, 'New Section');
      const pageId = await notesService.createPage(secId, 'Page 1');
      await fetchData();
      setSelectedNbId(nbId);
      setSelectedSecId(secId);
      setSelectedPageId(pageId);
    } finally {
      setCreatingSec(false);
    }
  };

  const handleRenameSec = async (id: string, title: string) => {
    await notesService.renameItem('sections', id, title);
    setNotebooks(prev => prev.map(nb => ({
      ...nb,
      sections: nb.sections.map(sec => sec.id === id ? { ...sec, title } : sec),
    })));
  };

  const handleDeleteSec = async (id: string) => {
    setConfirm({
      open: true,
      title: 'Delete Section?',
      message: 'All pages inside this section will be permanently deleted.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await notesService.deleteItem('sections', id);
          await fetchData();
        } finally {
          setDeletingId(null);
          setConfirm(c => ({ ...c, open: false }));
        }
      },
    });
  };

  // ── Page CRUD ─────────────────────────────────────────────────
  const handleCreatePage = async () => {
    if (!selectedSecId || creatingPage) return;
    setCreatingPage(true);
    try {
      const id = await notesService.createPage(selectedSecId, 'Untitled');
      await fetchData();
      setSelectedPageId(id);
    } finally {
      setCreatingPage(false);
    }
  };

  const handleRenamePage = async (id: string, title: string) => {
    await notesService.renameItem('pages', id, title);
    setNotebooks(prev => prev.map(nb => ({
      ...nb,
      sections: nb.sections.map(sec => ({
        ...sec, pages: sec.pages.map(p => p.id === id ? { ...p, title } : p),
      })),
    })));
    setSharedPages(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  };

  const handleDeletePage = async (id: string) => {
    setConfirm({
      open: true,
      title: 'Delete Page?',
      message: 'This page and all its content will be permanently deleted.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await notesService.deleteItem('pages', id);
          if (selectedPageId === id) setSelectedPageId('');
          await fetchData();
        } finally {
          setDeletingId(null);
          setConfirm(c => ({ ...c, open: false }));
        }
      },
    });
  };

  const handlePageSave = async (content: string) => {
    if (!selectedPageId) return;
    await notesService.updatePageContent(selectedPageId, content);
    if (selectedPage?.accessType) {
      setSharedPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, content } : p));
    } else {
      setNotebooks(prev => prev.map(nb => ({
        ...nb,
        sections: nb.sections.map(sec => ({
          ...sec, pages: sec.pages.map(p => p.id === selectedPageId ? { ...p, content } : p),
        })),
      })));
    }
  };

  const handleShare = async () => {
    if (!sharePageId || !shareTargetEmail.trim() || savingShare) return;
    setSavingShare(true);
    try {
      await notesService.sharePage(sharePageId, shareTargetEmail.trim(), shareAccess);
      alert('Shared successfully!');
      setShowShareModal(false);
      setShareTargetEmail('');
    } catch (err: any) { alert(err.message); }
    finally { setSavingShare(false); }
  };

  const toggleNbExpanded = (id: string) => {
    setExpandedNbIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // ── Derived ────────────────────────────────────────────────────
  const selectedNb   = notebooks.find(nb => nb.id === selectedNbId);
  const selectedSec  = selectedNb?.sections.find(sec => sec.id === selectedSecId);
  const selectedPage = selectedSec?.pages.find(p => p.id === selectedPageId)
    ?? sharedPages.find(p => p.id === selectedPageId);

  // ── Open a notebook from the folder view ───────────────────────
  const openNotebook = (nb: Notebook) => {
    setSelectedNbId(nb.id);
    setExpandedNbIds([nb.id]);
    // Auto-select first section + first page
    const firstSec  = nb.sections[0];
    const firstPage = firstSec?.pages[0];
    if (firstSec)  setSelectedSecId(firstSec.id);
    if (firstPage) setSelectedPageId(firstPage.id);
    setView('editor');
  };

  // ═══════════════════════════════════════════════════════════════
  // FOLDER VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'folders') {
    return (
      <div className="min-h-[calc(100vh-112px)] bg-slate-50/50 p-6">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Notes</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Notebook Library
            </p>
          </div>
          <button
            onClick={openCreateNbModal}
            disabled={creatingNb}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold
                       text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200
                       active:scale-95 disabled:opacity-70 disabled:cursor-wait"
          >
            {creatingNb ? <Spin size={15} /> : <Plus size={16} />}
            {creatingNb ? 'Creating…' : 'Create Notebook'}
          </button>
        </div>

        {/* ── Create Notebook Modal ────────────────────────────── */}
        <AnimatePresence>
          {showCreateNbModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setShowCreateNbModal(false); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl"
              >
                {/* Preview */}
                <div className="flex justify-center mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: newNbColor + '22' }}
                  >
                    <FolderOpen size={34} style={{ color: newNbColor }} />
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 mb-1 text-center">New Notebook</h3>
                <p className="text-xs text-slate-400 text-center mb-5">Name it and pick a color.</p>

                {/* Name */}
                <input
                  autoFocus
                  value={newNbName}
                  onChange={e => setNewNbName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newNbName.trim()) handleCreateNb(); if (e.key === 'Escape') setShowCreateNbModal(false); }}
                  placeholder="e.g. Physics, Math, History…"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                             focus:ring-2 focus:ring-blue-500 outline-none mb-5"
                />

                {/* Color swatches */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Color</p>
                <ColorPicker value={newNbColor} onChange={setNewNbColor} />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateNbModal(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100
                               rounded-xl hover:bg-slate-200 transition-colors"
                  >Cancel</button>
                  <button
                    disabled={!newNbName.trim() || creatingNb}
                    onClick={handleCreateNb}
                    className="flex-1 py-3 text-sm font-bold text-white bg-blue-600
                               rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50
                               flex items-center justify-center gap-2"
                  >
                    {creatingNb ? <><Spin size={13} className="text-white" /> Creating…</> : 'Create'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Change Color Modal ───────────────────────────────── */}
        <AnimatePresence>
          {colorNbId && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setColorNbId(null); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-7 w-full max-w-xs shadow-2xl"
              >
                {/* Live preview */}
                <div className="flex justify-center mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: colorPickValue + '22' }}
                  >
                    <FolderOpen size={28} style={{ color: colorPickValue }} />
                  </div>
                </div>
                <h3 className="text-base font-black text-slate-900 mb-4 text-center">Change Color</h3>
                <ColorPicker value={colorPickValue} onChange={setColorPickValue} />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setColorNbId(null)}
                    className="flex-1 py-2.5 text-sm font-bold text-slate-500 bg-slate-100
                               rounded-xl hover:bg-slate-200 transition-colors"
                  >Cancel</button>
                  <button
                    onClick={() => handleChangeNbColor(colorNbId, colorPickValue)}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600
                               rounded-xl hover:bg-blue-700 transition-colors"
                  >Apply</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Global Confirm Dialog ─────────────────────────────── */}
        <ConfirmDialog
          open={confirm.open}
          variant="danger"
          title={confirm.title}
          message={confirm.message}
          confirmLabel="Delete"
          loading={!!deletingId}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(c => ({ ...c, open: false }))}
        />

        {/* Content */}
        {loading ? (
          <FolderSkeleton />
        ) : notebooks.length === 0 && sharedPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
              <BookOpen size={36} className="text-blue-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No notebooks yet</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-xs">
              Create your first notebook to start organizing your notes.
            </p>
            <button
              onClick={handleCreateNb}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold
                         text-sm rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} /> Create First Notebook
            </button>
          </div>
        ) : (
          <>
            {/* Notebooks grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {notebooks.map(nb => (
                <FolderCard
                  key={nb.id}
                  notebook={nb}
                  onClick={() => openNotebook(nb)}
                  onRename={() => { setEditingId(nb.id); setEditValue(nb.title); }}
                  onChangeColor={() => { setColorNbId(nb.id); setColorPickValue(nb.color); }}
                  onDelete={() => handleDeleteNb(nb.id)}
                />
              ))}

              {/* Add folder card */}
              <motion.button
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                onClick={openCreateNbModal}
                disabled={creatingNb}
                className="w-full bg-white rounded-2xl border-2 border-dashed border-slate-200
                           p-6 flex flex-col items-center text-center hover:border-blue-400
                           hover:bg-blue-50/30 transition-all duration-200 group
                           disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-100 group-hover:bg-blue-100
                                flex items-center justify-center mb-4 transition-colors">
                  {creatingNb
                    ? <Spin size={28} className="text-blue-500" />
                    : <Plus size={28} className="text-slate-400 group-hover:text-blue-500 transition-colors" />}
                </div>
                <p className="text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                  {creatingNb ? 'Creating…' : 'New Notebook'}
                </p>
              </motion.button>
            </div>

            {/* Shared pages section */}
            {sharedPages.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 size={14} className="text-slate-400" />
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shared with me</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sharedPages.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPageId(p.id);
                        setSelectedNbId('');
                        setSelectedSecId('');
                        setView('editor');
                      }}
                      className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3
                                 hover:shadow-md hover:border-blue-300 transition-all text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                          {p.accessType === 'viewer' ? 'View only' : 'Editable'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // EDITOR VIEW (existing 3-panel layout)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Back bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200 flex-shrink-0">
        <button
          onClick={() => setView('folders')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600
                     hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft size={14} /> All Notebooks
        </button>
        {selectedNb && (
          <>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedNb.color }} />
              <span className="text-sm font-bold text-slate-900">{selectedNb.title}</span>
            </div>
          </>
        )}
      </div>

      {/* 3-panel workspace */}
      <div className="flex flex-1 bg-white border border-gray-200 rounded-b-xl overflow-hidden shadow-sm relative min-h-0">
        <PanelGroup direction="horizontal">

          {/* 1. Notebooks Panel */}
          <Panel
            ref={sidebarPanelRef}
            defaultSize={15} minSize={12} maxSize={30}
            collapsible collapsedSize={4}
            onCollapse={() => setIsSidebarOpen(false)}
            onExpand={() => setIsSidebarOpen(true)}
            className="h-full bg-[#333333] flex flex-col overflow-hidden whitespace-nowrap z-20 border-r border-white/5 relative"
          >
            {isSidebarOpen ? (
              <>
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notebooks</h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCreateNb}
                      disabled={creatingNb}
                      className="p-1 hover:bg-white/10 rounded text-gray-400 disabled:opacity-50"
                      title="New Notebook"
                    >
                      {creatingNb ? <Spin size={13} className="text-gray-300" /> : <Plus size={14} />}
                    </button>
                    <button onClick={() => sidebarPanelRef.current?.collapse()} className="p-1 hover:bg-white/10 rounded text-gray-400">
                      <PanelLeftClose size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar-dark">
                  {notebooks.map(nb => (
                    <div key={nb.id} className="space-y-0.5">
                      <div
                        onDoubleClick={() => startEditing(nb.id, nb.title)}
                        onClick={() => { setSelectedNbId(nb.id); toggleNbExpanded(nb.id); }}
                        className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedNbId === nb.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                        }`}
                      >
                        <ChevronRight size={14} className={`shrink-0 transition-transform duration-200 ${expandedNbIds.includes(nb.id) ? 'rotate-90' : ''}`} />
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: nb.color }}>
                          <Book size={10} className="text-white" />
                        </div>
                        {editingId === nb.id ? (
                          <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                            onBlur={() => saveEditing('nb', nb.id)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEditing('nb', nb.id); if (e.key === 'Escape') cancelEditing(); }}
                            className="bg-white/20 text-white text-sm px-1 rounded outline-none w-full" />
                        ) : (
                          <span className="text-sm font-medium truncate flex-1">{nb.title}</span>
                        )}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); startEditing(nb.id, nb.title); }} className="p-1 hover:text-indigo-400"><Edit2 size={12} /></button>
                          <button
                            onClick={e => { e.stopPropagation(); handleCreateSec(nb.id); }}
                            disabled={creatingSec}
                            className="p-1 hover:text-emerald-400 disabled:opacity-50"
                          >
                            {creatingSec ? <Spin size={12} className="text-emerald-400" /> : <Plus size={12} />}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteNb(nb.id); }}
                            disabled={deletingId === nb.id}
                            className="p-1 hover:text-red-400 disabled:opacity-50"
                          >
                            {deletingId === nb.id ? <Spin size={12} className="text-red-400" /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedNbIds.includes(nb.id) && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden ml-4 space-y-0.5">
                            {nb.sections.map(sec => (
                              <div
                                key={sec.id}
                                onDoubleClick={e => { e.stopPropagation(); startEditing(sec.id, sec.title); }}
                                onClick={e => { e.stopPropagation(); setSelectedNbId(nb.id); setSelectedSecId(sec.id); setSelectedPageId(sec.pages[0]?.id || ''); }}
                                className={`group flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  selectedSecId === sec.id ? 'bg-white/5 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                }`}
                              >
                                <Layers size={12} className="shrink-0" />
                                {editingId === sec.id ? (
                                  <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                    onBlur={() => saveEditing('sec', sec.id)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveEditing('sec', sec.id); if (e.key === 'Escape') cancelEditing(); }}
                                    className="bg-white/20 text-white text-xs px-1 rounded outline-none w-full" />
                                ) : (
                                  <span className="text-xs font-medium truncate flex-1">{sec.title}</span>
                                )}
                                <button onClick={e => { e.stopPropagation(); startEditing(sec.id, sec.title); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400"><Edit2 size={10} /></button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDeleteSec(sec.id); }}
                                  disabled={deletingId === sec.id}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 disabled:opacity-50"
                                >
                                  {deletingId === sec.id ? <Spin size={10} className="text-red-400" /> : <Trash2 size={10} />}
                                </button>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* Shared */}
                  {sharedPages.length > 0 && (
                    <div className="pt-4 border-t border-white/5 mt-4">
                      <h2 className="px-3 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Share2 size={10} /> Shared with Me
                      </h2>
                      {sharedPages.map(page => (
                        <div
                          key={page.id}
                          onClick={() => { setSelectedNbId(''); setSelectedSecId(''); setSelectedPageId(page.id); }}
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
                <button onClick={() => sidebarPanelRef.current?.expand()} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-all hover:text-white">
                  <ChevronRight size={20} />
                </button>
                <div className="w-6 h-[1px] bg-white/10" />
                <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar py-2 items-center">
                  {notebooks.map(nb => (
                    <button key={nb.id} onClick={() => { setSelectedNbId(nb.id); sidebarPanelRef.current?.expand(); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 shrink-0 ${selectedNbId === nb.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#333333]' : 'opacity-50 hover:opacity-100'}`}
                      style={{ backgroundColor: nb.color }} title={nb.title}>
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
            defaultSize={15} minSize={12} maxSize={30}
            collapsible collapsedSize={4}
            onCollapse={() => setIsPagesOpen(false)}
            onExpand={() => setIsPagesOpen(true)}
            className="h-full bg-[#F5F5F5] border-r border-gray-200 flex flex-col overflow-hidden whitespace-nowrap"
          >
            {isPagesOpen ? (
              <>
                <div className="p-4 flex items-center justify-between border-b border-gray-200">
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pages</h2>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={handleCreatePage}
                      disabled={creatingPage || !selectedSecId}
                      className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-50 disabled:cursor-wait"
                      title="New Page"
                    >
                      {creatingPage ? <Loader2 size={14} className="text-blue-500 animate-spin" /> : <Plus size={14} />}
                    </button>
                    <button onClick={() => pagesPanelRef.current?.collapse()} className="p-1 hover:bg-gray-200 rounded text-gray-500">
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
                      <div className={`w-1 h-4 rounded-full ${selectedPageId === page.id ? 'bg-indigo-600' : 'bg-transparent'}`} />
                      {editingId === page.id ? (
                        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                          onBlur={() => saveEditing('page', page.id)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditing('page', page.id); if (e.key === 'Escape') cancelEditing(); }}
                          className="bg-white border border-indigo-300 text-sm px-1 rounded outline-none w-full" />
                      ) : (
                        <span className="text-sm font-medium truncate flex-1">{page.title}</span>
                      )}
                      <button onClick={e => { e.stopPropagation(); startEditing(page.id, page.title); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-indigo-400"><Edit2 size={12} /></button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeletePage(page.id); }}
                        disabled={deletingId === page.id}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 disabled:opacity-50"
                      >
                        {deletingId === page.id ? <Spin size={12} className="text-red-400" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center py-4 gap-2 w-full h-full overflow-y-auto no-scrollbar bg-gray-100">
                <button onClick={() => pagesPanelRef.current?.expand()} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 mb-2">
                  <Layout size={20} />
                </button>
                {selectedSec?.pages.map((page, idx) => (
                  <button key={page.id} onClick={() => setSelectedPageId(page.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 shrink-0 ${
                      selectedPageId === page.id ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:text-gray-600'
                    }`} title={page.title}>
                    {page.title.charAt(0).toUpperCase() || idx + 1}
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
                onSave={handlePageSave}
                title={selectedPage.title}
                onTitleChange={title => handleRenamePage(selectedPage.id, title)}
                tags={selectedPage.tags || []}
                lastEdited={selectedPage.lastEdited}
                readOnly={selectedPage.accessType === 'viewer'}
                accessType={selectedPage.accessType}
                onShare={() => { setSharePageId(selectedPage.id); setShowShareModal(true); }}
                onClone={async () => {
                  const targetNb  = notebooks[0];
                  const targetSec = targetNb?.sections?.[0]?.id;
                  if (!targetSec) { alert('Please create a notebook and section first.'); return; }
                  try {
                    const newId = await notesService.clonePage(selectedPage.id, targetSec);
                    await fetchData();
                    setSelectedNbId(targetNb.id);
                    setSelectedSecId(targetSec);
                    setSelectedPageId(newId);
                    alert('Saved as a copy!');
                  } catch (err: any) { alert('Error: ' + err.message); }
                }}
                onTagsChange={async tags => {
                  if (!selectedPageId) return;
                  try {
                    await notesService.updatePageTags(selectedPageId, tags);
                    if (selectedPage?.accessType) {
                      setSharedPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, tags } : p));
                    } else {
                      setNotebooks(notebooks.map(nb => ({
                        ...nb,
                        sections: nb.sections.map(sec => ({
                          ...sec, pages: sec.pages.map(p => p.id === selectedPageId ? { ...p, tags } : p),
                        })),
                      })));
                    }
                  } catch (err: any) { console.error(err); }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hash size={32} className="text-gray-200" />
                  </div>
                  <p className="text-sm font-medium">Select a page to start writing</p>
                  <p className="text-xs text-gray-300 mt-1">or create a new one from the panel</p>
                </div>
              </div>
            )}
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-100 hover:bg-indigo-400 transition-colors cursor-col-resize z-30" />

          {/* 4. AI Panel */}
          <Panel
            ref={aiPanelRef}
            defaultSize={20} minSize={15} maxSize={40}
            collapsible collapsedSize={4}
            onCollapse={() => setIsAiOpen(false)}
            onExpand={() => setIsAiOpen(true)}
            className="h-full bg-white border-l border-gray-100 flex flex-col overflow-hidden whitespace-nowrap"
          >
            {isAiOpen ? (
              <>
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-900">AI Assistant</h2>
                  <button onClick={() => aiPanelRef.current?.collapse()} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600">
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AIPanel isOpen={true} onClose={() => aiPanelRef.current?.collapse()} noteContent={selectedPage?.content || ''} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center py-4 gap-4 w-full h-full bg-gray-50">
                <button onClick={() => aiPanelRef.current?.expand()}
                  className="p-2 hover:bg-indigo-50 rounded-full text-indigo-600 transition-all hover:scale-110 shadow-sm border border-indigo-50">
                  <Sparkles size={20} />
                </button>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-3">
                <Share2 className="text-indigo-600" /> Share Note
              </h3>
              <p className="text-sm text-gray-500 mb-6">Enter the user ID of the person you want to collaborate with.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">User ID / Email</label>
                  <input type="text" value={shareTargetEmail} onChange={e => setShareTargetEmail(e.target.value)}
                    placeholder="Enter User ID..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Access Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShareAccess('viewer')} className={`p-3 rounded-2xl border-2 transition-all ${shareAccess === 'viewer' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400'}`}>
                      <span className="font-bold block">Viewer</span><span className="text-[10px]">Read only</span>
                    </button>
                    <button onClick={() => setShareAccess('editor')} className={`p-3 rounded-2xl border-2 transition-all ${shareAccess === 'editor' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400'}`}>
                      <span className="font-bold block">Editor</span><span className="text-[10px]">Can edit note</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-8">
                <button onClick={() => setShowShareModal(false)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                <button
                  onClick={handleShare}
                  disabled={savingShare}
                  className="flex-1 py-4 text-sm font-bold bg-indigo-600 text-white rounded-2xl
                             shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95
                             transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {savingShare ? <><Spin size={15} className="text-white" /> Sharing…</> : 'Share Now'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm dialog — also used from editor view sidebar actions */}
      <ConfirmDialog
        open={confirm.open}
        variant="danger"
        title={confirm.title}
        message={confirm.message}
        confirmLabel="Delete"
        loading={!!deletingId}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />

      <style>{`
        .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default MyNotes;
