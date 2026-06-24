import React, { useState, useEffect } from 'react';
import { Search, Command, X } from 'lucide-react';
import { INITIAL_QUOTES } from '../constants';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = INITIAL_QUOTES.filter(q => 
    q.symbol.toLowerCase().includes(query.toLowerCase()) || 
    q.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % filtered.length); } 
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length); } 
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIndex]) { onSelect(filtered[selectedIndex].symbol); onClose(); } } 
      else if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onSelect, onClose]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      <div className="w-[600px] bg-terminal-panel border border-terminal-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center p-3 border-b border-terminal-border">
          <Command className="text-terminal-muted mr-2" size={18} />
          <input 
            autoFocus
            type="text"
            placeholder="Search commands, symbols, or news (e.g. 'AAPL', 'Buy ES', 'Macro')..."
            className="flex-1 bg-transparent border-none outline-none text-terminal-text placeholder-terminal-muted font-mono text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-terminal-muted hover:text-terminal-text">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[300px] overflow-y-auto bg-terminal-bg">
          {filtered.length === 0 ? (
             <div className="p-8 text-center text-terminal-muted text-sm">No results found.</div>
          ) : (
            <ul>
              {filtered.map((item, index) => (
                <li 
                  key={item.symbol}
                  className={`flex items-center justify-between p-3 cursor-pointer ${index === selectedIndex ? 'bg-terminal-accent/10 border-l-2 border-terminal-accent' : 'hover:bg-black/5 dark:hover:bg-white/5 border-l-2 border-transparent'}`}
                  onClick={() => { onSelect(item.symbol); onClose(); }}
                >
                  <div>
                    <span className="font-bold text-terminal-text font-mono mr-2">{item.symbol}</span>
                    <span className="text-terminal-muted text-sm">{item.name}</span>
                  </div>
                  <div className="text-xs font-mono text-terminal-muted">{item.sector}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-terminal-panel p-2 border-t border-terminal-border flex justify-between text-[10px] text-terminal-muted">
           <span>Navigate <b className="text-terminal-text">↑↓</b></span>
           <span>Select <b className="text-terminal-text">↵</b></span>
           <span>Close <b className="text-terminal-text">ESC</b></span>
        </div>
      </div>
    </div>
  );
};