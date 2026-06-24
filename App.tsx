import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuoteGrid } from './components/QuoteGrid';
import { ChartWidget } from './components/ChartWidget';
import { OrderTicket } from './components/OrderTicket';
import { NewsFeed } from './components/NewsFeed';
import { PredictionWidget } from './components/PredictionWidget';
import { CommandPalette } from './components/CommandPalette';
import { PortfolioWidget } from './components/PortfolioWidget';
import { AIAssistant } from './components/AIAssistant';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { marketService } from './services/marketService';
import { portfolioService } from './services/portfolioService';
import { Quote } from './types';
import { auth, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type ViewState = 'LANDING' | 'AUTH' | 'TERMINAL';

function App() {
  const [view, setView] = useState<ViewState>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'research'>('trade');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [selectedQuote, setSelectedQuote] = useState<Quote | undefined>(undefined);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isPaper, setIsPaper] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setView('TERMINAL');
      } else if (view === 'TERMINAL') {
        setView('LANDING');
      }
    });
    return unsubscribe;
  }, [view]);

  // Theme Management
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await logOut();
    setView('LANDING');
  };

  // Sync selected quote with real-time updates
  useEffect(() => {
    if (view !== 'TERMINAL') return;
    const unsubscribe = marketService.subscribe((quotes) => {
      const quote = quotes.find(q => q.symbol === selectedSymbol);
      if (quote) {
        setSelectedQuote(quote);
      }
    });
    return unsubscribe;
  }, [selectedSymbol, view]);

  // Sync portfolio mode
  useEffect(() => {
    const unsubscribe = portfolioService.subscribeMode(setIsPaper);
    return unsubscribe;
  }, []);

  // Global Key Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- VIEW RENDERING ---

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (view === 'LANDING' && !user) {
    return <LandingPage onEnter={() => setView('AUTH')} />;
  }

  if (view === 'AUTH' && !user) {
    return <AuthPage onSuccess={() => setView('TERMINAL')} onBack={() => setView('LANDING')} />;
  }

  // TERMINAL VIEW
  return (
    <div className="flex flex-col h-screen bg-terminal-bg text-terminal-text font-sans selection:bg-terminal-accent selection:text-black transition-colors duration-200">
      
      <Header 
        onOpenCommand={() => setIsCommandOpen(true)} 
        isPaper={isPaper}
        onToggleMode={() => portfolioService.toggleMode()}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignOut={handleSignOut}
        user={user}
      />

      {/* Main Page Layout - Responsive (Scrollable on mobile, Hidden on desktop) */}
      <main className="flex-1 relative p-1 overflow-y-auto lg:overflow-hidden">
        
        {/* ================= TRADE VIEW ================= */}
        {activeTab === 'trade' && (
          <div className="flex flex-col lg:flex-row h-full w-full gap-1 animate-in fade-in duration-300 min-h-[800px] lg:min-h-0">
            
            {/* LEFT COLUMN: Execution & Market Data (25%) */}
            <div className="w-full lg:w-[25%] flex flex-col gap-1 h-[400px] lg:h-full lg:min-w-[300px]">
              
              {/* Order Ticket (Fixed Height) */}
              <div className="h-auto min-h-[320px] shrink-0 z-20">
                <OrderTicket quote={selectedQuote} onSymbolChange={setSelectedSymbol} />
              </div>
              
              {/* Quote Grid (Fills remaining) */}
              <div className="flex-1 min-h-0 z-10">
                <QuoteGrid 
                  onSelectSymbol={setSelectedSymbol} 
                  selectedSymbol={selectedSymbol} 
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Charting (75%) */}
            <div className="flex-1 h-[500px] lg:h-full min-w-0 z-0">
              <ChartWidget symbol={selectedSymbol} theme={theme} />
            </div>
            
          </div>
        )}

        {/* ================= RESEARCH VIEW ================= */}
        {activeTab === 'research' && (
          <div className="flex flex-col lg:flex-row h-full w-full gap-1 animate-in fade-in duration-300 min-h-[900px] lg:min-h-0">
            
            {/* LEFT COLUMN: Portfolio & Holdings (30%) */}
            <div className="w-full lg:w-[30%] h-[300px] lg:h-full min-h-0 order-3 lg:order-1">
               <PortfolioWidget />
            </div>

            {/* CENTER COLUMN: AI Assistant (40%) */}
            <div className="w-full lg:w-[40%] h-[500px] lg:h-full min-h-0 order-1 lg:order-2">
              <AIAssistant theme={theme} />
            </div>

            {/* RIGHT COLUMN: Analysis Tools (30%) */}
            <div className="w-full lg:w-[30%] h-[400px] lg:h-full flex flex-col gap-1 min-h-0 order-2 lg:order-3">
              
              {/* Top: AI Prediction */}
              <div className="flex-1 min-h-0">
                <PredictionWidget symbol={selectedSymbol} theme={theme} />
              </div>

              {/* Bottom: News Feed */}
              <div className="flex-1 min-h-0">
                <NewsFeed />
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Command Palette Modal */}
      <CommandPalette 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)}
        onSelect={setSelectedSymbol}
      />
    </div>
  );
}

export default App;