import React, { useState, useEffect } from 'react';
import { Wifi, Search, User, Bell, Layout, Power, BarChart2, PieChart, Sun, Moon, LogOut } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  onOpenCommand: () => void;
  isPaper: boolean;
  onToggleMode: () => void;
  activeTab: 'trade' | 'research';
  onTabChange: (tab: 'trade' | 'research') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSignOut: () => void;
  user: FirebaseUser | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenCommand, 
  isPaper, 
  onToggleMode,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  onSignOut,
  user
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getTimeInZone = (zone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(time);
  };

  return (
    <header className="h-12 bg-terminal-bg border-b border-terminal-border flex items-center justify-between px-4 select-none shrink-0 z-50 transition-colors duration-200">
      {/* Left: Branding & Nav */}
      <div className="flex items-center space-x-6 h-full">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="bg-terminal-accent w-2 h-2 rounded-full animate-pulse"></div>
            <span className="font-bold text-terminal-text tracking-widest text-sm">LUMINA<span className="text-terminal-accent font-light">PRO</span></span>
          </div>
          <div className="h-4 w-px bg-terminal-border hidden sm:block"></div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden sm:flex items-center bg-terminal-panel p-0.5 rounded-lg border border-terminal-border">
          <button
            onClick={() => onTabChange('trade')}
            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'trade' 
                ? 'bg-terminal-border text-terminal-text shadow-sm' 
                : 'text-terminal-muted hover:text-terminal-text'
            }`}
          >
            <BarChart2 size={12} />
            <span>TRADE</span>
          </button>
          <button
            onClick={() => onTabChange('research')}
            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === 'research' 
                ? 'bg-terminal-border text-terminal-text shadow-sm' 
                : 'text-terminal-muted hover:text-terminal-text'
            }`}
          >
            <PieChart size={12} />
            <span>RESEARCH</span>
          </button>
        </div>
      </div>

      {/* Center: Market Clocks (Hidden on smaller screens) */}
      <div className="hidden 2xl:flex items-center space-x-6 text-xs font-mono text-gray-400">
        <div className="flex flex-col items-center leading-none">
           <span className="text-[9px] text-terminal-muted mb-0.5 uppercase">New York</span>
           <span className="text-terminal-text font-bold">{getTimeInZone('America/New_York')}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
           <span className="text-[9px] text-terminal-muted mb-0.5 uppercase">London</span>
           <span className="text-terminal-text font-bold">{getTimeInZone('Europe/London')}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
           <span className="text-[9px] text-terminal-muted mb-0.5 uppercase">Delhi</span>
           <span className="text-terminal-text font-bold">{getTimeInZone('Asia/Kolkata')}</span>
        </div>
        <div className="flex flex-col items-center leading-none">
           <span className="text-[9px] text-terminal-muted mb-0.5 uppercase">Tokyo</span>
           <span className="text-terminal-text font-bold">{getTimeInZone('Asia/Tokyo')}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-md text-terminal-muted hover:bg-terminal-panel hover:text-terminal-text transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <div className="h-4 w-px bg-terminal-border mx-1"></div>

        {/* Mode Toggle */}
        <button 
          onClick={onToggleMode}
          className={`hidden sm:flex items-center space-x-2 px-2 py-1 rounded border transition-colors ${
            isPaper 
              ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/20' 
              : 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-500 hover:bg-green-500/20'
          }`}
        >
          <Power size={10} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{isPaper ? 'Paper' : 'Live'}</span>
        </button>

        <button 
          onClick={onOpenCommand}
          className="flex items-center space-x-2 bg-terminal-panel border border-terminal-border hover:border-terminal-accent transition-colors px-3 py-1 rounded text-xs text-terminal-muted group"
        >
          <Search size={12} className="group-hover:text-terminal-accent" />
          <span className="hidden md:inline">Cmd</span>
          <kbd className="hidden md:inline-block bg-terminal-bg px-1 rounded text-[9px] text-terminal-muted border border-terminal-border">⌘K</kbd>
        </button>
        
        <div className="h-4 w-px bg-terminal-border mx-2"></div>

        {user && (
          <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-terminal-panel border border-terminal-border">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full border border-terminal-accent/50" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-terminal-accent flex items-center justify-center text-[10px] text-white font-bold">
                {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden lg:flex flex-col items-start leading-none">
              <span className="text-[10px] font-bold text-terminal-text truncate max-w-[100px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[8px] text-terminal-muted uppercase tracking-tighter">
                {isPaper ? 'Paper Account' : 'Live Account'}
              </span>
            </div>
          </div>
        )}

        <button className="text-terminal-muted hover:text-terminal-text relative p-1">
          <Bell size={16} />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-terminal-down rounded-full border border-terminal-bg"></span>
        </button>
        <button onClick={onSignOut} className="text-terminal-muted hover:text-red-500 p-1 transition-colors" title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};