import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children: any;
  className?: string;
  [key: string]: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="relative group/code my-4">
        <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
          <button 
            onClick={handleCopy}
            className="p-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-md border border-white/10 backdrop-blur-sm transition-all"
            title="Copy code"
          >
            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <SyntaxHighlighter
          {...props}
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0.75rem',
            fontSize: '0.75rem',
            backgroundColor: '#0f172a',
            padding: '1rem'
          }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default CodeBlock;
