import React, { useEffect, useState } from 'react';
import { marketService } from '../services/marketService';
import { Quote } from '../types';
import { Card } from './Card';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface QuoteGridProps {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string | null;
}

const formatNumber = (num: number, decimals: number = 2) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const QuoteRow: React.FC<{ quote: Quote; isSelected: boolean; onClick: () => void }> = ({ quote, isSelected, onClick }) => {
  const isUp = quote.change >= 0;
  const colorClass = isUp ? 'text-terminal-up' : 'text-terminal-down';
  const bgClass = isSelected ? 'bg-terminal-accent/10' : 'hover:bg-black/5 dark:hover:bg-white/5';

  return (
    <tr 
      className={`border-b border-terminal-border/50 cursor-pointer transition-colors text-xs ${bgClass}`}
      onClick={onClick}
    >
      <td className="p-2 font-bold text-terminal-text font-mono flex items-center gap-1">
        <span className={`w-1 h-1 rounded-full ${isUp ? 'bg-terminal-up' : 'bg-terminal-down'}`}></span>
        {quote.symbol}
      </td>
      <td className={`p-2 text-right font-mono font-medium ${colorClass}`}>
        {formatNumber(quote.price)}
      </td>
      <td className={`p-2 text-right font-mono ${colorClass}`}>
        <div className="flex items-center justify-end gap-1">
          {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {formatNumber(quote.change)}
        </div>
      </td>
      <td className={`p-2 text-right font-mono ${colorClass}`}>
        {formatNumber(quote.changePercent)}%
      </td>
      <td className="p-2 text-right font-mono text-terminal-muted hidden xl:table-cell">
        {formatNumber(quote.bid)}
      </td>
      <td className="p-2 text-right font-mono text-terminal-muted hidden xl:table-cell">
        {formatNumber(quote.ask)}
      </td>
      <td className="p-2 text-right font-mono text-terminal-muted hidden lg:table-cell">
        {(quote.volume / 1000000).toFixed(2)}M
      </td>
    </tr>
  );
};

export const QuoteGrid: React.FC<QuoteGridProps> = ({ onSelectSymbol, selectedSymbol }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const unsubscribe = marketService.subscribe((data) => {
      setQuotes(data);
    });
    return unsubscribe;
  }, []);

  return (
    <Card title="Market Monitor (Equities & Futures)" className="h-full">
      <div className="w-full h-full overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-terminal-panel sticky top-0 z-10 text-[10px] uppercase text-terminal-muted font-semibold tracking-wider">
            <tr>
              <th className="p-2 border-b border-terminal-border">Ticker</th>
              <th className="p-2 text-right border-b border-terminal-border">Last</th>
              <th className="p-2 text-right border-b border-terminal-border">Chg</th>
              <th className="p-2 text-right border-b border-terminal-border">%Chg</th>
              <th className="p-2 text-right border-b border-terminal-border hidden xl:table-cell">Bid</th>
              <th className="p-2 text-right border-b border-terminal-border hidden xl:table-cell">Ask</th>
              <th className="p-2 text-right border-b border-terminal-border hidden lg:table-cell">Vol</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <QuoteRow 
                key={quote.symbol} 
                quote={quote} 
                isSelected={quote.symbol === selectedSymbol}
                onClick={() => onSelectSymbol(quote.symbol)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};