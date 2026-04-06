import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, Paperclip, FileText, File, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotePicker from './NotePicker';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'note' | 'file' | 'link', extra?: any) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [showNotePicker, setShowNotePicker] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachments(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  const handleLinkSend = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    onSendMessage(url, 'link');
    setLinkUrl('');
    setLinkMode(false);
  };

  const handleSelectNote = (note: { id: string, title: string }) => {
    onSendMessage(note.title, 'note', { noteId: note.id });
    setShowNotePicker(false);
    setShowAttachments(false);
  };

  const handleDocumentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Pass the actual File object in the extra property so ChatWindow can upload it
    onSendMessage(file.name, 'file', { file });
    
    setShowAttachments(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-[#f0f2f5] flex items-center gap-2 px-4 py-2.5 min-h-[62px]">
      {/* Left Icons */}
      <div className="flex items-center gap-1 shrink-0 text-[#54656f]">
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowAttachments(!showAttachments)}
            className={`p-2 hover:bg-[#d1d7db] rounded-full transition-colors ${showAttachments ? 'bg-[#d1d7db]' : ''}`}
          >
            <Plus size={24} className={`transition-transform duration-300 ${showAttachments ? 'rotate-45' : ''}`} />
          </button>

          <AnimatePresence>
            {showAttachments && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-14 left-0 bg-white rounded-2xl shadow-xl w-[200px] z-50 overflow-hidden"
              >
                <div className="flex flex-col">
                  <button 
                    onClick={() => setShowNotePicker(true)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#f5f6f6] transition-colors text-[#111b21]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#bf59cf] flex items-center justify-center text-white shrink-0">
                      <FileText size={16} />
                    </div>
                    <span className="text-[15px] font-normal">Share Note</span>
                  </button>
                  <button 
                    onClick={handleDocumentClick}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#f5f6f6] transition-colors text-[#111b21]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5157ae] flex items-center justify-center text-white shrink-0">
                      <File size={16} />
                    </div>
                    <span className="text-[15px] font-normal">Document</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  <button
                    onClick={() => { setLinkMode(true); setShowAttachments(false); }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#f5f6f6] transition-colors text-[#111b21]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0aa084] flex items-center justify-center text-white shrink-0">
                      <Link size={16} />
                    </div>
                    <span className="text-[15px] font-normal">Share Link</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Pill */}
      <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 border border-transparent shadow-sm mx-2">
        <input 
          type="text" 
          placeholder="Type a message" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="w-full bg-transparent border-none outline-none text-[15px] text-[#111b21] placeholder-[#8696a0]"
        />
      </div>

      {/* Right Icon */}
      <div className="shrink-0 text-[#54656f]">
        <button 
          onClick={handleSend}
          disabled={!text.trim()}
          className={`p-2 rounded-full transition-colors ${text.trim() ? 'hover:bg-[#d1d7db] text-indigo-600' : 'text-gray-400 opacity-50 cursor-not-allowed'}`}
        >
          <Send size={24} />
        </button>
      </div>

      {/* Link input mode */}
      {linkMode && (
        <div className="absolute bottom-full left-0 right-0 bg-white border border-[#d1d7db] rounded-t-xl shadow-xl px-4 py-3 flex gap-2 z-50">
          <input
            autoFocus
            type="url"
            placeholder="Paste a URL and press Enter..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLinkSend(); if (e.key === 'Escape') { setLinkMode(false); setLinkUrl(''); } }}
            className="flex-1 bg-[#f0f2f5] rounded-lg px-3 py-1.5 text-[14px] outline-none placeholder-[#8696a0]"
          />
          <button onClick={handleLinkSend} disabled={!linkUrl.trim()} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium disabled:opacity-50">
            Send
          </button>
          <button onClick={() => { setLinkMode(false); setLinkUrl(''); }} className="px-3 py-1.5 text-[#54656f] text-[13px]">
            Cancel
          </button>
        </div>
      )}

      {/* Note Picker Modal */}
      <AnimatePresence>
        {showNotePicker && (
          <NotePicker 
            onSelect={handleSelectNote} 
            onClose={() => setShowNotePicker(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageInput;
