import React, { useEffect, useRef } from 'react';
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
  Table as TableIcon, Undo, Redo, Tag, X,
  Sparkles, Zap, Brain, Lightbulb, ChevronRight,
  AlignLeft, AlignCenter, AlignRight, Type, FileDown, Printer,
  Share2, Copy
} from 'lucide-react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
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

const MenuBar = ({ editor, highlightColor, setHighlightColor, textColor, setTextColor, onExportPDF }: { 
  editor: any, 
  highlightColor: string, 
  setHighlightColor: (c: string) => void,
  textColor: string,
  setTextColor: (c: string) => void,
  onExportPDF: () => void
}) => {
  const [showHighlightMenu, setShowHighlightMenu] = React.useState(false);
  const [showColorMenu, setShowColorMenu] = React.useState(false);
  
  if (!editor) return null;

  const buttons = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: 'bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: 'italic' },
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: { heading: { level: 1 } } },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: { heading: { level: 2 } } },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: 'bulletList' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: 'orderedList' },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: 'codeBlock' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: 'blockquote' },
  ];

  const alignButtons = [
    { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign('left').run(), active: { textAlign: 'left' } },
    { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), active: { textAlign: 'center' } },
    { icon: AlignRight, action: () => editor.chain().focus().setTextAlign('right').run(), active: { textAlign: 'right' } },
  ];

  return (
    <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.action}
          className={`p-1.5 rounded-md transition-all ${
            editor.isActive(btn.active) ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <btn.icon size={15} />
        </button>
      ))}
      <div className="w-px h-4 bg-gray-200 mx-1.5" />
      
      {alignButtons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.action}
          className={`p-1.5 rounded-md transition-all ${
            editor.isActive(btn.active) ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <btn.icon size={15} />
        </button>
      ))}

      <div className="w-px h-4 bg-gray-200 mx-1.5" />
      
      {/* Highlight Menu */}
      <div className="relative">
        <button 
          onClick={() => { setShowHighlightMenu(!showHighlightMenu); setShowColorMenu(false); }}
          className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${editor.isActive('highlight') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          title="Highlight"
        >
          <div className="w-4 h-4 rounded-sm border border-gray-200" style={{ backgroundColor: highlightColor }} />
          <ChevronRight size={12} className="rotate-90" />
        </button>
        
        {showHighlightMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 flex gap-1">
            {['#FEF08A', '#FBCFE8', '#BBF7D0', '#BFDBFE', '#FFEDD5'].map(color => (
              <button 
                key={color}
                onClick={() => { 
                  setHighlightColor(color); 
                  editor.chain().focus().toggleHighlight({ color }).run();
                  setShowHighlightMenu(false); 
                }}
                className="w-6 h-6 rounded-md border border-gray-100 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button 
              onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightMenu(false); }}
              className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600"
            >
              CLEAR
            </button>
          </div>
        )}
      </div>

      {/* Text Color Menu */}
      <div className="relative">
        <button 
          onClick={() => { setShowColorMenu(!showColorMenu); setShowHighlightMenu(false); }}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-all flex items-center gap-1"
          title="Text Color"
        >
          <Type size={15} style={{ color: textColor }} />
          <ChevronRight size={12} className="rotate-90" />
        </button>
        
        {showColorMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 flex flex-wrap gap-1 w-32">
            {['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'].map(color => (
              <button 
                key={color}
                onClick={() => { 
                  setTextColor(color); 
                  editor.chain().focus().setColor(color).run();
                  setShowColorMenu(false); 
                }}
                className="w-6 h-6 rounded-md border border-gray-100 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
            <button 
              onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorMenu(false); }}
              className="w-full text-center py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600"
            >
              RESET
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-200 mx-1.5" />
      <button onClick={() => editor.chain().focus().undo().run()} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-colors"><Undo size={15} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-colors"><Redo size={15} /></button>
      
      <div className="flex-1" />
      
      <button 
        onClick={onExportPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-all border border-gray-100 hover:border-indigo-100"
      >
        <FileDown size={14} />
        <span>Export PDF</span>
      </button>
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ 
  content, onChange, title, onTitleChange, tags, onTagsChange, 
  lastEdited, readOnly, accessType, onShare, onClone 
}) => {
  const [newTag, setNewTag] = React.useState('');
  const [highlightColor, setHighlightColor] = React.useState('#FEF08A');
  const [textColor, setTextColor] = React.useState('#000000');
  const exportRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Start writing your notes...' }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

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
    
    const element = exportRef.current;
    const opt = {
      margin: 10,
      filename: `${title || 'note'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).save();
  };

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      <MenuBar 
        editor={editor} 
        highlightColor={highlightColor} 
        setHighlightColor={setHighlightColor} 
        textColor={textColor}
        setTextColor={setTextColor}
        onExportPDF={exportToPDF}
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div ref={exportRef} className="px-10 py-10 max-w-4xl mx-auto w-full bg-white">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={readOnly}
            placeholder="Untitled Note"
            className={`text-4xl font-bold text-gray-900 border-none focus:ring-0 p-0 w-full bg-transparent mb-2 placeholder:text-gray-200 ${readOnly ? 'cursor-default' : ''}`}
          />
          <div className="h-px bg-gray-300 w-full mb-4" />
          
          <div className="flex items-center gap-8 mb-6 text-sm text-gray-500">
            <div>{lastEdited || '12 March 2026'}</div>
            <div>{currentTime}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6 no-print">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold uppercase tracking-wider mr-4">
              <Tag size={12} />
              <span>Metadata</span>
            </div>
            
            {tags?.map(tag => (
              <span 
                key={tag} 
                className="group flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[11px] font-medium border border-indigo-100/50"
              >
                #{tag}
                {!readOnly && (
                  <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 hover:text-indigo-800 transition-all">
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
            
            {!readOnly && (
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ Add tag..."
                className="text-[11px] text-gray-400 bg-transparent border-none focus:ring-0 p-0 w-20 placeholder:text-gray-300"
              />
            )}
          </div>

          <div className="prose prose-indigo prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none">
            <EditorContent editor={editor} className="min-h-[400px]" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-10 pb-20">
          <div className="mt-10 pt-10 border-t border-gray-100">
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">Need study tools for this note?</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: FileDown, label: 'Export PDF', action: exportToPDF, color: 'text-gray-600', bg: 'bg-gray-50' },
                  { icon: Share2, label: 'Share Note', action: onShare, color: 'text-indigo-600', bg: 'bg-indigo-50', hide: readOnly },
                  { icon: Copy, label: 'Save to My Notes', action: onClone, color: 'text-emerald-600', bg: 'bg-emerald-50', hide: !readOnly },
                  { icon: Zap, label: 'Summarize', action: () => {}, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: Brain, label: 'Flashcards', action: () => {}, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].filter(a => !a.hide).map((action, i) => (
                  <button 
                    key={i}
                    onClick={action.action}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all active:scale-95 text-sm font-medium text-gray-700`}
                  >
                    <action.icon size={14} className={action.color} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none !important;
        }
        .ProseMirror h1 { font-size: 2.25rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #111827; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1f2937; }
        .ProseMirror p { margin-bottom: 1.25rem; line-height: 1.75; color: #374151; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1.25rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1.25rem; }
        .ProseMirror blockquote { border-left: 4px solid #6366f1; padding-left: 1.25rem; font-style: italic; color: #4b5563; margin: 1.5rem 0; }
        .ProseMirror code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.375rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.875em; color: #ef4444; }
        .ProseMirror pre { background: #111827; color: #f9fafb; padding: 1.25rem; border-radius: 0.75rem; margin: 1.5rem 0; overflow-x: auto; }
        .ProseMirror pre code { background: transparent; padding: 0; color: inherit; font-size: inherit; }
        
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Editor;
