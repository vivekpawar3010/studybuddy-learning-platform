import React from 'react';
import { FileText, Download, ExternalLink, File, Check, CheckCheck } from 'lucide-react';
import { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  showSenderName: boolean;
  isConsecutive?: boolean;
  onSenderClick?: (senderId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSelf, showSenderName, isConsecutive, onSenderClick }) => {
  const renderContent = () => {
    switch (message.type) {
      case 'note':
        return (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-[#e9edef] mt-1 shadow-sm w-[260px]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#e7f7f0] rounded-xl flex items-center justify-center text-[#00a884]">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-medium text-[#111b21] truncate">Note: {message.content}</h4>
                <p className="text-[11px] text-[#667781] truncate">Shared Study Material</p>
              </div>
            </div>
            <button className="w-full py-1.5 bg-[#f0f2f5] text-[#54656f] text-[12px] font-medium rounded-md hover:bg-[#d1d7db] transition-colors">
              View Note
            </button>
          </div>
        );
      case 'file':
        return (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2.5 border border-[#e9edef] mt-1 flex items-center justify-between gap-3 shadow-sm w-[260px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#ffe8e8] rounded-xl flex items-center justify-center text-[#ea4335]">
                <File size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-medium text-[#111b21] truncate">{message.fileName || 'Document'}</h4>
                <p className="text-[11px] text-[#027eb5] truncate hover:underline">
                  <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">View File</a>
                </p>
              </div>
            </div>
            <a 
              href={message.fileUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-[#f0f2f5] rounded-full text-[#54656f] transition-colors shrink-0 block"
              download
            >
              <Download size={16} />
            </a>
          </div>
        );
      case 'link':
        return (
          <div className="mt-1 flex flex-col">
            <p className="text-[14px] leading-[19px] mb-1 text-[#111b21]">{message.content}</p>
            <div className="bg-[#f0f2f5] rounded-lg p-2 border border-[#d1d7db] flex gap-2 cursor-pointer hover:bg-[#e9edef] transition-colors">
              <div className="w-10 h-10 bg-[#e9edef] rounded flex flex-col items-center justify-center text-[#667781] shrink-0">
                <ExternalLink size={16} />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[13px] text-[#111b21] font-medium truncate block">Study Resource</span>
                <span className="text-[11px] text-[#027eb5] truncate block url-link">https://example.com/study-resource</span>
              </div>
            </div>
          </div>
        );
      default:
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const textParts = message.content.split(urlRegex);
        return (
          <span className="text-[14px] leading-[19px] whitespace-pre-wrap break-words inline-block">
            {textParts.map((part, i) => {
              if (part.match(urlRegex)) {
                return (
                  <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:opacity-80 transition-opacity">
                    {part}
                  </a>
                );
              }
              return part;
            })}
            {/* Invisible spacer to push timestamp correctly if text is short */}
            <span className="inline-block w-[75px] h-3"></span>
          </span>
        );
    }
  };

  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mb-[2px]' : 'mb-2'}`}>
      <div 
        className={`relative px-2.5 py-1.5 max-w-[85%] sm:max-w-[70%] shadow-[0_1px_0.5px_rgba(11,20,26,.13)] ${
          isSelf 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white text-[#111b21]'
        } ${
          isConsecutive 
            ? 'rounded-lg' 
            : isSelf 
              ? 'rounded-lg rounded-tr-[0px]' 
              : 'rounded-lg rounded-tl-[0px]'
        }`}
      >
        {/* User Name Tag for Groups */}
        {showSenderName && (
          <div 
            className="text-[13px] font-medium text-[#c02f74] mb-0.5 cursor-pointer hover:underline"
            onClick={() => onSenderClick?.(message.senderId)}
          >
            {message.senderName}
          </div>
        )}
        
        {/* Message Content */}
        {renderContent()}
        
        {/* Timestamp & Status */}
        <div className={`absolute right-2 bottom-1 flex items-center gap-1 bg-transparent ${isSelf ? 'text-indigo-100' : 'text-[#667781]'}`}>
          <span className="text-[11px] leading-[15px] pt-1">
            {message.timestamp}
          </span>
          {isSelf && (
            message.status === 'sending' ? (
              <span className="text-[10px] ml-0.5 opacity-70">🕐</span>
            ) : message.status === 'error' ? (
              <span className="text-[10px] ml-0.5 text-red-400" title="Failed to send">⚠️</span>
            ) : (
              <CheckCheck size={14} className="text-indigo-200 ml-0.5 mt-[1px]" />
            )
          )}
        </div>

        {/* Reaction Badges */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-3 right-0 flex gap-0.5 bg-white border border-[#e9edef] rounded-full px-1 py-0.5 shadow-sm">
            {message.reactions.map((r, idx) => (
              <div key={idx} className="flex items-center gap-0.5 px-0.5 cursor-pointer text-[11px]">
                <span>{r.emoji}</span>
                <span className="text-[#667781] font-medium">{r.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
