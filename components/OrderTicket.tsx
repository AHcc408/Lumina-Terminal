import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import { Quote } from '../types';
import { portfolioService } from '../services/portfolioService';
import { INITIAL_QUOTES } from '../constants';
import { DollarSign, Hash, CheckCircle2, XCircle, ShieldCheck, Zap, ChevronDown, Search } from 'lucide-react';

interface OrderTicketProps {
  quote: Quote | undefined;
  onSymbolChange?: (symbol: string) => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({ quote, onSymbolChange }) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('LIMIT');
  const [quantity, setQuantity] = useState<number>(100);
  const [price, setPrice] = useState<string>('');
  const [isPaper, setIsPaper] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = portfolioService.subscribeMode(setIsPaper);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (quote && price === '' && orderType === 'LIMIT') {
      setPrice(quote.price.toFixed(2));
    }
  }, [quote, orderType]);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) { setStatusMsg({ type: 'error', text: 'No Symbol' }); return; }
    const executionPrice = orderType === 'MARKET' ? quote.price : parseFloat(price);
    if (isNaN(executionPrice) || executionPrice <= 0) { setStatusMsg({ type: 'error', text: 'Invalid Price' }); return; }
    if (quantity <= 0) { setStatusMsg({ type: 'error', text: 'Invalid Qty' }); return; }
    
    try {
      const result = await portfolioService.executeTrade(quote.symbol, side, quantity, executionPrice);
      if (result.success) { setStatusMsg({ type: 'success', text: result.message }); } 
      else { setStatusMsg({ type: 'error', text: result.message }); }
    } catch (err: any) {
      console.error('Trade Execution Error:', err);
      setStatusMsg({ type: 'error', text: 'Execution Failed' });
    }
  };

  const filteredQuotes = INITIAL_QUOTES.filter(q => 
    q.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = quote ? (quantity * (orderType === 'MARKET' ? quote.price : parseFloat(price) || 0)).toFixed(2) : '0.00';

  return (
    <Card title="Order Entry" className="h-full flex flex-col overflow-visible">
      <div className="p-2 space-y-2 font-mono text-sm flex-1 relative">
        
        {/* Symbol Selection Header */}
        <div className="relative border-b border-terminal-border pb-2 z-20" ref={searchRef}>
           <div className="flex justify-between items-start">
              <div 
                className="flex flex-col cursor-pointer group select-none"
                onClick={() => {
                  setSearchTerm('');
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-terminal-accent group-hover:text-white transition-colors">
                     {quote?.symbol || 'SELECT'}
                  </span>
                  <ChevronDown size={14} className={`text-terminal-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                <span className="text-[10px] text-terminal-muted">{quote?.name || 'Choose a ticker'}</span>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-terminal-text">{quote?.price.toFixed(2) || '0.00'}</div>
                <div className="text-[9px] flex gap-2 justify-end">
                   <span className="text-terminal-muted">Bid <span className="text-terminal-up">{quote?.bid.toFixed(2) || '--'}</span></span>
                   <span className="text-terminal-muted">Ask <span className="text-terminal-down">{quote?.ask.toFixed(2) || '--'}</span></span>
                </div>
              </div>
           </div>
           
           {/* Dropdown Menu */}
           {isDropdownOpen && (
             <div className="absolute top-full left-0 w-full mt-1 bg-terminal-panel border border-terminal-border shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-64 animate-in fade-in zoom-in-95 duration-100 origin-top-left z-50">
               <div className="p-2 border-b border-terminal-border flex items-center gap-2 bg-terminal-bg">
                 <Search size={12} className="text-terminal-muted" />
                 <input 
                   autoFocus
                   type="text" 
                   className="w-full bg-transparent text-xs text-terminal-text focus:outline-none placeholder-terminal-muted font-mono uppercase"
                   placeholder="SEARCH SYMBOL..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
                 />
               </div>
               <div className="overflow-y-auto flex-1 scrollbar-thin">
                 {filteredQuotes.map(q => (
                   <button 
                     key={q.symbol}
                     className="w-full px-3 py-2 hover:bg-terminal-accent/10 hover:text-terminal-accent flex justify-between items-center text-xs border-b border-terminal-border/30 last:border-0 transition-colors text-left"
                     onClick={() => {
                       if (onSymbolChange) {
                          onSymbolChange(q.symbol);
                          // Reset price if in Limit mode to new price
                          if (orderType === 'LIMIT') setPrice(q.price.toFixed(2));
                       }
                       setIsDropdownOpen(false);
                     }}
                   >
                     <div className="flex flex-col">
                        <span className="font-bold font-mono">{q.symbol}</span>
                        <span className="text-[9px] text-terminal-muted uppercase truncate max-w-[120px]">{q.name}</span>
                     </div>
                     <span className={`font-mono ${q.change >= 0 ? 'text-terminal-up' : 'text-terminal-down'}`}>{q.price.toFixed(2)}</span>
                   </button>
                 ))}
                 {filteredQuotes.length === 0 && (
                   <div className="p-4 text-center text-[10px] text-terminal-muted">No symbols found.</div>
                 )}
               </div>
             </div>
           )}
        </div>

        {/* Side Selection */}
        <div className="flex rounded bg-terminal-bg border border-terminal-border p-0.5">
          <button onClick={() => setSide('BUY')} className={`flex-1 py-1 text-center font-bold rounded text-[10px] uppercase transition-all ${side === 'BUY' ? 'bg-terminal-up text-black' : 'text-terminal-muted hover:text-terminal-text'}`}>Buy</button>
          <button onClick={() => setSide('SELL')} className={`flex-1 py-1 text-center font-bold rounded text-[10px] uppercase transition-all ${side === 'SELL' ? 'bg-terminal-down text-white' : 'text-terminal-muted hover:text-terminal-text'}`}>Sell</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2 mt-2">
          {/* Order Type */}
          <div className="grid grid-cols-3 gap-1">
             {['MARKET', 'LIMIT', 'STOP'].map((t) => (
               <button key={t} type="button" onClick={() => setOrderType(t as any)} className={`py-1 text-[9px] border border-terminal-border rounded uppercase transition-colors ${orderType === t ? 'bg-terminal-accent/10 text-terminal-accent border-terminal-accent font-bold' : 'text-terminal-muted hover:border-terminal-muted hover:text-terminal-text'}`}>{t}</button>
             ))}
          </div>

          <div className="flex gap-2">
            {/* Quantity */}
            <div className="flex-1 space-y-0.5">
              <label className="text-[9px] text-terminal-muted uppercase flex items-center gap-1"><Hash size={8} /> Qty</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full bg-terminal-bg border border-terminal-border p-1.5 text-right text-terminal-text text-xs focus:border-terminal-accent focus:outline-none font-mono rounded-sm transition-colors" />
            </div>

            {/* Price (Conditional) */}
            <div className="flex-1 space-y-0.5">
               {orderType !== 'MARKET' ? (
                <>
                  <label className="text-[9px] text-terminal-muted uppercase flex items-center gap-1"><DollarSign size={8} /> Price</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-terminal-bg border border-terminal-border p-1.5 text-right text-terminal-text text-xs focus:border-terminal-accent focus:outline-none font-mono rounded-sm transition-colors" />
                </>
               ) : (
                <>
                  <label className="text-[9px] text-terminal-muted uppercase flex items-center gap-1">Est Price</label>
                  <div className="w-full bg-black/5 dark:bg-white/5 border border-transparent p-1.5 text-right text-terminal-muted text-xs font-mono rounded-sm">{quote?.price.toFixed(2) || '0.00'}</div>
                </>
               )}
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className={`w-full py-2 font-bold text-xs uppercase tracking-wider rounded shadow active:scale-[0.98] transition-all mt-2 ${side === 'BUY' ? 'bg-terminal-up text-black hover:brightness-110' : 'bg-terminal-down text-white hover:brightness-110'}`}>
            {side} {quote?.symbol || 'STOCK'} <span className="opacity-70 ml-1">(${total})</span>
          </button>
        </form>

        {/* Status Messages */}
        {statusMsg && (
          <div className={`p-1.5 rounded text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            <span className="truncate font-medium">{statusMsg.text}</span>
          </div>
        )}
      </div>
      
      {/* Footer / Status */}
      <div className={`px-2 py-1 border-t text-[9px] flex items-center justify-between font-bold ${
        isPaper 
          ? 'bg-yellow-500/5 text-yellow-600 dark:text-yellow-500 border-yellow-500/20' 
          : 'bg-green-500/5 text-green-600 dark:text-green-500 border-green-500/20'
      }`}>
        <div className="flex items-center gap-1">
           {isPaper ? <ShieldCheck size={10} /> : <Zap size={10} />}
           <span>{isPaper ? 'PAPER ACCOUNT' : 'LIVE MARKET'}</span>
        </div>
        <div className="opacity-50">
           TIF: GTC
        </div>
      </div>
    </Card>
  );
};