import React, { ReactNode, useState } from 'react';
import { Settings, MoreHorizontal, Maximize2, Minimize2 } from 'lucide-react';

interface CardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, actions, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`
      flex flex-col bg-terminal-panel border border-terminal-border shadow-lg transition-all duration-300
      ${isExpanded ? 'fixed inset-0 z-50 rounded-none border-0 m-0 w-screen h-screen' : `rounded-sm ${className}`}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-terminal-header border-b border-terminal-border h-8 shrink-0 select-none transition-colors duration-200">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-4 bg-terminal-accent rounded-[1px]"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-terminal-muted hover:text-terminal-text transition-colors cursor-pointer">
            {title}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {actions}
          <button className="p-1 hover:bg-terminal-bg rounded text-terminal-muted hover:text-terminal-text transition-colors">
            <Settings size={12} />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 hover:bg-terminal-bg rounded transition-colors ${isExpanded ? 'text-terminal-accent' : 'text-terminal-muted hover:text-terminal-text'}`}
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button className="p-1 hover:bg-terminal-bg rounded text-terminal-muted hover:text-terminal-text transition-colors">
            <MoreHorizontal size={12} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-terminal-bg transition-colors duration-200">
        {children}
      </div>
    </div>
  );
};