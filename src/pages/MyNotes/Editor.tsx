import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import html2pdf from 'html2pdf.js';
import {
  Bold, Italic, List, ListOrdered, Code, Quote,
  Heading1, Heading2, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Tag, X,
  Sparkles, Zap, Brain, FileDown,
  AlignLeft, AlignCenter, AlignRight, Type,
  Share2, Copy, Save, ChevronRight,
  CheckCircle2, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
interface EditorProps {
  content: string;
  /** Called only when user explicitly saves (Ctrl+S or Save button) */
  onSave: (content: string) => Promise<void>;
  title: string;
  onTitleChange: (title: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  lastEdited?: string;
  readOnly?: boolean;
  accessType?: 'viewer' | 'editor';
  onShare?: () => void;
  onClone?: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ─── Toolbar ─────────────────────────────────────────────────
const MenuBar: React.FC<{
  editor: any;
  onExportPDF: () => void;
  onSave: () => void;
  saveState: SaveState;
  isDirty: boolean;
}> = ({ editor, onExportPDF, onSave, saveState, isDirty }) => {
  const [showHL, setShowHL] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [hlColor, setHlColor] = useState('#FEF08A');
  const [txtColor, setTxtColor] = useState('#000000');

  if (!editor) return null;

  const fmtBtns = [
    { icon: Bold,        action: () => editor.chain().focus().toggleBold().run(),                    active: 'bold' },
    { icon: Italic,      action: () => editor.chain().focus().toggleItalic().run(),                  active: 'italic' },
    { icon: Heading1,    action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),     active: { heading: { level: 1 } } },
    { icon: Heading2,    action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),     active: { heading: { level: 2 } } },
    { icon: List,        action: () => editor.chain().focus().toggleBulletList().run(),              active: 'bulletList' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(),             active: 'orderedList' },
    { icon: Code,        action: () => editor.chain().focus().toggleCodeBlock().run(),               active: 'codeBlock' },
    { icon: Quote,       action: () => editor.chain().focus().toggleBlockquote().run(),              active: 'blockquote' },
  ];

  const alignBtns = [
    { icon: AlignLeft,   action: () => editor.chain().focus().setTextAlign('left').run(),   active: { textAlign: 'left' } },
    { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), active: { textAlign: 'center' } },
    { icon: AlignRight,  action: () => editor.chain().focus().setTextAlign('right').run(),  active: { textAlign: 'right' } },
  ];

  const Sep = () => <div className="w-px h-4 bg-slate-200 mx-1" />;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-white sticky top-0 z-20 shadow-sm flex-wrap">
      {/* Format buttons */}
      {fmtBtns.map((btn, i) => (
        <button
          key={i}
          onMouseDown={e => { e.preventDefault(); btn.action(); }}
          className={`p-1.5 rounded-md transition-all ${
            editor.isActive(btn.active)
              ? 'bg-blue-50 text-blue-600 shadow-sm'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <btn.icon size={15} />
        </button>
      ))}

      <Sep />

      {/* Align */}
      {alignBtns.map((btn, i) => (
        <button
          key={i}
          onMouseDown={e => { e.preventDefault(); btn.action(); }}
          className={`p-1.5 rounded-md transition-all ${
            editor.isActive(btn.active) ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <btn.icon size={15} />
        </button>
      ))}

      <Sep />

      {/* Highlight picker */}
      <div className="relative">
        <button
          onMouseDown={e => { e.preventDefault(); setShowHL(v => !v); setShowColor(false); }}
          className={`p-1.5 rounded-md flex items-center gap-1 transition-all ${
            editor.isActive('highlight') ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: hlColor }} />
          <ChevronRight size={11} className="rotate-90" />
        </button>
        {showHL && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 flex gap-1.5">
            {['#FEF08A', '#FBCFE8', '#BBF7D0', '#BFDBFE', '#FFEDD5'].map(c => (
              <button
                key={c}
                onMouseDown={e => { e.preventDefault(); setHlColor(c); editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHL(false); }}
                className="w-6 h-6 rounded-md border border-slate-100 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHL(false); }}
              className="px-2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
            >CLEAR</button>
          </div>
        )}
      </div>

      {/* Text color picker */}
      <div className="relative">
        <button
          onMouseDown={e => { e.preventDefault(); setShowColor(v => !v); setShowHL(false); }}
          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md flex items-center gap-1"
        >
          <Type size={15} style={{ color: txtColor }} />
          <ChevronRight size={11} className="rotate-90" />
        </button>
        {showColor && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 flex flex-wrap gap-1.5 w-32">
            {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'].map(c => (
              <button
                key={c}
                onMouseDown={e => { e.preventDefault(); setTxtColor(c); editor.chain().focus().setColor(c).run(); setShowColor(false); }}
                className="w-6 h-6 rounded-md border border-slate-100 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColor(false); }}
              className="w-full text-center py-0.5 text-[10px] font-bold text-slate-400 hover:text-slate-600"
            >RESET</button>
          </div>
        )}
      </div>

      <Sep />

      <button
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().undo().run(); }}
        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"
      ><Undo size={15} /></button>
      <button
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().redo().run(); }}
        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"
      ><Redo size={15} /></button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export PDF */}
      <button
        onMouseDown={e => { e.preventDefault(); onExportPDF(); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition-all"
      >
        <FileDown size={14} /> PDF
      </button>

      {/* ── SAVE BUTTON ── */}
      <button
        onClick={onSave}
        disabled={!isDirty || saveState === 'saving'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
          ${saveState === 'saved'
            ? 'bg-green-50 text-green-600 border-green-200'
            : saveState === 'error'
              ? 'bg-red-50 text-red-600 border-red-200'
              : isDirty
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
          }`}
        title="Save (Ctrl+S)"
      >
        {saveState === 'saving' && <Loader2 size={14} className="animate-spin" />}
        {saveState === 'saved'   && <CheckCircle2 size={14} />}
        {(saveState === 'idle' || saveState === 'error') && <Save size={14} />}
        {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save'}
      </button>
    </div>
  );
};

// ─── Main Editor ──────────────────────────────────────────────
const Editor: React.FC<EditorProps> = ({
  content,
  onSave,
  title,
  onTitleChange,
  tags,
  onTagsChange,
  lastEdited,
  readOnly,
  accessType,
  onShare,
  onClone,
}) => {
  const [newTag, setNewTag] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  // isDirty = content has changed since last save
  const [isDirty, setIsDirty] = useState(false);
  // Local draft held in ref; not causing re-render on every keystroke
  const draftRef = useRef<string>(content);
  const exportRef = useRef<HTMLDivElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Placeholder.configure({ placeholder: 'Start writing your notes...' }),
      TextStyle, Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      draftRef.current = html;
      setIsDirty(true);
      setSaveState('idle');
    },
  });

  // When a different page is selected, reset editor content and dirty state
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content ?? '');
      draftRef.current = content ?? '';
      setIsDirty(false);
      setSaveState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // ── Explicit save ──────────────────────────────────────────
  const triggerSave = useCallback(async () => {
    if (!isDirty || saveState === 'saving' || readOnly) return;
    setSaveState('saving');
    try {
      await onSave(draftRef.current);
      setIsDirty(false);
      setSaveState('saved');
      // Reset status after 2s
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  }, [isDirty, saveState, readOnly, onSave]);

  // Ctrl+S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        triggerSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, [triggerSave]);

  // ── Helpers ────────────────────────────────────────────────
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        onTagsChange([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  const exportToPDF = () => {
    if (!exportRef.current) return;
    html2pdf()
      .from(exportRef.current)
      .set({
        margin: 10,
        filename: `${title || 'note'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      })
      .save();
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {!readOnly && (
        <MenuBar
          editor={editor}
          onExportPDF={exportToPDF}
          onSave={triggerSave}
          saveState={saveState}
          isDirty={isDirty}
        />
      )}

      {/* Unsaved changes banner */}
      {isDirty && !readOnly && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
          <span className="text-amber-500">Press <kbd className="px-1.5 py-0.5 bg-amber-100 rounded text-[10px] font-mono font-bold">Ctrl+S</kbd> or click Save</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div ref={exportRef} className="px-10 py-10 max-w-4xl mx-auto w-full bg-white">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            disabled={readOnly}
            placeholder="Untitled Note"
            className={`text-4xl font-bold text-slate-900 border-none focus:ring-0 p-0 w-full
                        bg-transparent mb-2 placeholder:text-slate-200 leading-tight
                        ${readOnly ? 'cursor-default' : ''}`}
          />
          <div className="h-px bg-slate-200 mb-4" />

          {/* Meta row */}
          <div className="flex items-center gap-6 mb-5 text-xs text-slate-400">
            <span>{lastEdited ?? 'Never saved'}</span>
            <span>{currentTime}</span>
            {readOnly && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium uppercase tracking-wide">
                {accessType === 'viewer' ? 'View only' : 'Shared'}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-6 no-print">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-2">
              <Tag size={11} />
              <span>Tags</span>
            </div>
            {tags?.map(tag => (
              <span
                key={tag}
                className="group flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600
                           rounded-full text-[11px] font-medium border border-blue-100"
              >
                #{tag}
                {!readOnly && (
                  <button
                    onClick={() => removeTag(tag)}
                    className="opacity-0 group-hover:opacity-100 hover:text-blue-800 transition-all"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
            {!readOnly && (
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ tag"
                className="text-[11px] text-slate-400 bg-transparent border-none focus:ring-0 p-0 w-16
                           placeholder:text-slate-300"
              />
            )}
          </div>

          {/* TipTap editor content */}
          <div className="prose prose-blue prose-sm sm:prose-base max-w-none focus:outline-none">
            <EditorContent editor={editor} className="min-h-[400px]" />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="max-w-4xl mx-auto px-10 pb-16">
          <div className="border-t border-slate-100 pt-8">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-800">Page tools</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: FileDown, label: 'Export PDF', action: exportToPDF,    color: 'text-slate-600' },
                  { icon: Share2,   label: 'Share',      action: onShare,         color: 'text-blue-600',    hide: readOnly },
                  { icon: Copy,     label: 'Save copy',  action: onClone,         color: 'text-emerald-600', hide: !readOnly },
                  { icon: Zap,      label: 'Summarize',  action: () => {},        color: 'text-blue-600' },
                  { icon: Brain,    label: 'Flashcards', action: () => {},        color: 'text-violet-600' },
                ].filter(a => !a.hide).map((a, i) => (
                  <button
                    key={i}
                    onClick={a.action}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200
                               bg-white hover:border-blue-200 hover:shadow-sm transition-all text-sm
                               font-medium text-slate-700 active:scale-95"
                  >
                    <a.icon size={14} className={a.color} />
                    {a.label}
                  </button>
                ))}

                {/* Big save button in tools bar too */}
                {!readOnly && (
                  <button
                    onClick={triggerSave}
                    disabled={!isDirty || saveState === 'saving'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all active:scale-95
                      ${isDirty
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                  >
                    <Save size={14} />
                    {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save note'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #cbd5e1;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror { outline: none !important; }
        .ProseMirror h1 { font-size: 2rem; font-weight: 800; margin-top: 1.75rem; margin-bottom: 0.75rem; color: #0f172a; }
        .ProseMirror h2 { font-size: 1.4rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #1e293b; }
        .ProseMirror p  { margin-bottom: 1rem; line-height: 1.8; color: #334155; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1rem; }
        .ProseMirror blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; font-style: italic; color: #475569; margin: 1.25rem 0; }
        .ProseMirror code { background: #f1f5f9; padding: 0.15rem 0.35rem; border-radius: 0.25rem; font-family: ui-monospace,monospace; font-size: 0.85em; color: #dc2626; }
        .ProseMirror pre { background: #0f172a; color: #f8fafc; padding: 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; overflow-x: auto; }
        .ProseMirror pre code { background: transparent; padding: 0; color: inherit; }
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  );
};

export default Editor;
