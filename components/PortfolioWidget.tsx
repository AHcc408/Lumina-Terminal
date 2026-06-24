import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { marketService } from '../services/marketService';
import { portfolioService } from '../services/portfolioService';
import { Quote, Portfolio, Position } from '../types';
import { TrendingUp, TrendingDown, RefreshCcw, DollarSign } from 'lucide-react';

export const PortfolioWidget: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isPaper, setIsPaper] = useState(true);

  useEffect(() => {
    const unsubPortfolio = portfolioService.subscribe(setPortfolio);
    const unsubMarket = marketService.subscribe(setQuotes);
    const unsubMode = portfolioService.subscribeMode(setIsPaper);
    return () => {
      unsubPortfolio();
      unsubMarket();
      unsubMode();
    };
  }, []);

  if (!portfolio) return null;

  let equityValue = 0;
  let totalUnrealizedPnL = 0;
  let totalDayPnL = 0;

  const positionRows = Object.values(portfolio.positions).map((pos: Position) => {
    const quote = quotes.find(q => q.symbol === pos.symbol);
    const currentPrice = quote ? quote.price : pos.averageEntryPrice;
    
    // Market Value
    const marketValue = pos.quantity * currentPrice;
    
    // Unrealized P&L (Total Open P&L)
    const unrealizedPnL = (currentPrice - pos.averageEntryPrice) * pos.quantity;
    const unrealizedPnLPercent = pos.averageEntryPrice > 0 
      ? ((currentPrice - pos.averageEntryPrice) / pos.averageEntryPrice) * 100 
      : 0;

    // Day P&L (Change since open)
    const dayChange = quote ? quote.change : 0;
    const dayPnL = dayChange * pos.quantity;
    const dayPnLPercent = quote ? quote.changePercent : 0;

    equityValue += marketValue;
    totalUnrealizedPnL += unrealizedPnL;
    totalDayPnL += dayPnL;

    return { 
      ...pos, 
      currentPrice, 
      marketValue, 
      unrealizedPnL, 
      unrealizedPnLPercent,
      dayPnL,
      dayPnLPercent
    };
  });

  const totalNetWorth = portfolio.cash + equityValue;
  const isDayPositive = totalDayPnL >= 0;
  const isTotalPositive = totalUnrealizedPnL >= 0;

  return (
    <Card 
      title={`Portfolio - ${isPaper ? 'Paper Trading' : 'Live Account'}`} 
      className="h-full flex flex-col"
      actions={
        isPaper && (
          <button 
            onClick={() => portfolioService.resetPaperAccount()}
            className="text-[10px] text-terminal-muted hover:text-terminal-text flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
            title="Reset Paper Account"
          >
            <RefreshCcw size={10} />
            <span>Reset</span>
          </button>
        )
      }
    >
      {/* Account Summary Header */}
      <div className={`p-4 border-b border-terminal-border relative overflow-hidden flex flex-col gap-4 ${isPaper ? 'bg-yellow-50/50 dark:bg-[#1a1a10]' : 'bg-green-50/50 dark:bg-[#101a10]'}`}>
        <div className={`absolute top-0 right-0 w-32 h-full opacity-10 blur-xl ${isPaper ? 'bg-yellow-500' : 'bg-green-500'}`}></div>

        {/* Top Row: Net Liq & Cash */}
        <div className="flex justify-between items-end relative z-10">
          <div>
            <span className="text-[10px] text-terminal-muted uppercase tracking-wider font-semibold">Net Liquidity</span>
            <div className="text-3xl font-bold text-terminal-text font-mono tracking-tighter">
              ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
             <span className="text-[10px] text-terminal-muted uppercase tracking-wider font-semibold">Cash Available</span>
             <div className="text-lg font-mono text-terminal-text">
                ${portfolio.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </div>
          </div>
        </div>

        {/* Bottom Row: P&L Stats */}
        <div className="flex gap-6 relative z-10 pt-2 border-t border-terminal-border/20">
            {/* Day P&L */}
            <div className="flex-1">
              <span className="text-[9px] text-terminal-muted uppercase tracking-wider block mb-0.5">Day P&L</span>
              <div className={`text-sm font-bold font-mono flex items-center gap-1 ${isDayPositive ? 'text-terminal-up' : 'text-terminal-down'}`}>
                {isDayPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>${Math.abs(totalDayPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Total P&L */}
            <div className="flex-1">
              <span className="text-[9px] text-terminal-muted uppercase tracking-wider block mb-0.5">Open P&L</span>
              <div className={`text-sm font-bold font-mono flex items-center gap-1 ${isTotalPositive ? 'text-terminal-up' : 'text-terminal-down'}`}>
                <span className="font-sans text-[10px]">{isTotalPositive ? '▲' : '▼'}</span>
                <span>${Math.abs(totalUnrealizedPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="flex-1 overflow-auto bg-terminal-bg relative">
        <table className="w-full text-left border-collapse">
          <thead className="bg-terminal-panel sticky top-0 z-10 text-[9px] uppercase text-terminal-muted font-bold tracking-wider shadow-sm">
            <tr>
              <th className="p-2 border-b border-terminal-border">Ticker</th>
              <th className="p-2 text-right border-b border-terminal-border">Qty</th>
              <th className="p-2 text-right border-b border-terminal-border">Last</th>
              <th className="p-2 text-right border-b border-terminal-border hidden sm:table-cell">Mkt Val</th>
              <th className="p-2 text-right border-b border-terminal-border">Day P&L</th>
              <th className="p-2 text-right border-b border-terminal-border">Open P&L</th>
            </tr>
          </thead>
          <tbody>
            {positionRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-terminal-muted text-xs">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <DollarSign size={24} />
                    <span>No open positions</span>
                  </div>
                </td>
              </tr>
            ) : (
              positionRows.map((pos) => (
                <tr key={pos.symbol} className="border-b border-terminal-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-xs group">
                  <td className="p-2 font-bold text-terminal-text font-mono group-hover:text-terminal-accent transition-colors">{pos.symbol}</td>
                  <td className="p-2 text-right font-mono text-terminal-muted">{pos.quantity.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono text-terminal-text">{pos.currentPrice.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono text-terminal-text hidden sm:table-cell">
                    {(pos.marketValue / 1000).toFixed(1)}k
                  </td>
                  
                  {/* Day P&L Column */}
                  <td className={`p-2 text-right font-mono ${pos.dayPnL >= 0 ? 'text-terminal-up' : 'text-terminal-down'}`}>
                    <div className="flex flex-col items-end leading-none gap-0.5">
                       <span>{pos.dayPnL >= 0 ? '+' : ''}{pos.dayPnL.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                       <span className="text-[9px] opacity-70 bg-black/10 dark:bg-white/10 px-1 rounded">{pos.dayPnLPercent > 0 ? '+' : ''}{pos.dayPnLPercent.toFixed(2)}%</span>
                    </div>
                  </td>

                  {/* Open P&L Column */}
                  <td className={`p-2 text-right font-mono ${pos.unrealizedPnL >= 0 ? 'text-terminal-up' : 'text-terminal-down'}`}>
                    <div className="flex flex-col items-end leading-none gap-0.5">
                       <span>{pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                       <span className="text-[9px] opacity-70">{pos.unrealizedPnLPercent.toFixed(2)}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};