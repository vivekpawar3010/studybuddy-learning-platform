import React, { useState } from 'react';
import { X, Search, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotePickerProps {
  onSelect: (note: { id: string, title: string }) => void;
  onClose: () => void;
}

const MOCK_NOTES = [
  { id: 'p1', title: 'DNA Structure', folder: 'Biology' },
  { id: 'p2', title: 'DNA Replication', folder: 'Biology' },
  { id: 'p3', title: 'Mitosis', folder: 'Biology' },
  { id: 'p4', title: 'Derivatives', folder: 'Math' },
];

const NotePicker: React.FC<NotePickerProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const filteredNotes = MOCK_NOTES.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.folder.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="text-sm font-bold text-gray-900">Select a Note to Share</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
          <div className="relative flex items-center bg-gray-100 rounded-lg px-3 py-2 focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-indigo-100 transition-all">
            <Search size={16} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search your notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredNotes.map(note => (
            <button
              key={note.id}
              onClick={() => onSelect(note)}
              className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 rounded-xl transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{note.title}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{note.folder}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
            </button>
          ))}
          {filteredNotes.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No notes found
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NotePicker;
