import React, { useState } from 'react';
import { LucideIcon, Plus, MoreVertical, X, Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarItem {
  id: string;
  title: string;
  color?: string;
  lastEdited?: string;
}

interface SidebarColumnProps {
  title: string;
  items: SidebarItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  icon: LucideIcon;
  colorAttr?: string;
  showMetadata?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width?: string;
}

const SidebarColumn: React.FC<SidebarColumnProps> = ({
  title,
  items,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  icon: Icon,
  colorAttr,
  showMetadata,
  isCollapsed,
  onToggleCollapse,
  width = '220px'
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStartEdit = (item: SidebarItem) => {
    setEditingId(item.id);
    setEditValue(item.title);
  };

  const handleFinishEdit = () => {
    if (editingId && editValue.trim()) {
      onRename?.(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-gray-100 flex flex-col items-center py-4 bg-gray-50/50 transition-all duration-200">
        <button 
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-gray-200 rounded-md text-gray-400 transition-all active:scale-95 mb-4"
          title={`Expand ${title}`}
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 flex flex-col items-center gap-4">
          <Icon size={16} className="text-gray-300" />
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ width }} 
      className="border-r border-gray-100 flex flex-col bg-gray-50/50 transition-all duration-200 shrink-0"
    >
      <div className="p-3 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mr-2">{title}</h2>
          <div className="flex items-center gap-1">
            {onCreate && (
              <button 
                onClick={onCreate}
                className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-gray-500 transition-all active:scale-95"
                title={`Create ${title.slice(0, -1)}`}
              >
                <Plus size={14} />
              </button>
            )}
            <button 
              onClick={onToggleCollapse}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-all active:scale-95"
              title={`Collapse ${title}`}
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[11px] pl-7 pr-2 py-1.5 bg-gray-100/50 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {filteredItems.map((item) => (
          <div key={item.id} className="relative group">
            {editingId === item.id ? (
              <div className="p-1">
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleFinishEdit}
                  onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit()}
                  className="w-full text-sm px-2 py-1 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                />
              </div>
            ) : (
              <div
                onClick={() => onSelect(item.id)}
                className={`w-full flex flex-col p-2 rounded-lg transition-all duration-200 relative cursor-pointer ${
                  selectedId === item.id
                    ? 'bg-white shadow-sm ring-1 ring-black/5'
                    : 'hover:bg-gray-100/80 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2.5 w-full">
                  <div className="relative shrink-0">
                    <Icon 
                      size={14} 
                      className={selectedId === item.id ? 'text-indigo-600' : 'text-gray-400'} 
                    />
                    {colorAttr && item.color && (
                      <div 
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                  </div>
                  <span className={`text-sm truncate flex-1 text-left ${
                    selectedId === item.id ? 'font-semibold text-gray-900' : 'font-medium'
                  }`}>
                    {item.title}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={12} />
                    </button>
                    {onDelete && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {showMetadata && item.lastEdited && (
                  <div className="mt-0.5 pl-6.5 flex items-center justify-between w-full">
                    <span className="text-[10px] text-gray-400">{item.lastEdited}</span>
                  </div>
                )}
                
                {selectedId === item.id && (
                  <motion.div 
                    layoutId={`active-bar-${title}`}
                    className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-600 rounded-full"
                  />
                )}
              </div>
            )}
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Plus size={14} className="text-gray-400" />
            </div>
            <p className="text-[11px] text-gray-400 font-medium">No {title.toLowerCase()} yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarColumn;
