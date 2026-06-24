import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { BrainCircuit, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { INITIAL_QUOTES } from '../constants';
import { Quote } from '../types';

interface Prediction {
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  confidence: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  horizon: string;
}

interface PredictionWidgetProps {
  symbol?: string;
  theme?: 'dark' | 'light';
}

export const PredictionWidget: React.FC<PredictionWidgetProps> = ({ theme = 'dark' }) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    // Generate AI Forecasts for ALL companies
    const generateForecasts = () => {
      const newPreds = INITIAL_QUOTES.map((quote) => {
        // Deterministic pseudo-random based on symbol char code to keep it consistent-ish
        const seed = quote.symbol.charCodeAt(0) + quote.symbol.charCodeAt(quote.symbol.length - 1);
        const volatility = 0.15; // 15% annual vol proxy
        
        // Random direction bias
        const randomFactor = Math.sin(seed) * 2; // -2 to 2
        const percentChange = (randomFactor * volatility) / 4; // Approx 1 week move
        
        const target = quote.price * (1 + percentChange);
        const sentiment = percentChange > 0.01 ? 'BULLISH' : percentChange < -0.01 ? 'BEARISH' : 'NEUTRAL';
        const confidence = 65 + (Math.abs(Math.cos(seed)) * 30); // 65% to 95%

        return {
          symbol: quote.symbol,
          currentPrice: quote.price,
          targetPrice: target,
          confidence: confidence,
          sentiment: sentiment,
          horizon: '7D'
        } as Prediction;
      });

      // Sort by absolute move potential (Hot opportunities first)
      setPredictions(newPreds.sort((a, b) => 
        Math.abs((b.targetPrice - b.currentPrice)/b.currentPrice) - Math.abs((a.targetPrice - a.currentPrice)/a.currentPrice)
      ));
    };

    generateForecasts();
  }, []);

  return (
    <Card 
      title="AI Market Forecast (All Tickers)" 
      className="h-full flex flex-col"
      actions={
        <div className="flex items-center gap-1 text-[10px] text-terminal-muted bg-terminal-panel border border-terminal-border px-2 py-0.5 rounded">
          <BrainCircuit size={10} className="text-purple-400" />
          <span>MODEL: MARKET-SCAN-V4</span>
        </div>
      }
    >
      <div className="flex-1 overflow-auto bg-terminal-bg relative">
        <table className="w-full text-left border-collapse">
          <thead className="bg-terminal-panel sticky top-0 z-10 text-[9px] uppercase text-terminal-muted font-bold tracking-wider">
            <tr>
              <th className="p-2 border-b border-terminal-border">Symbol</th>
              <th className="p-2 text-right border-b border-terminal-border">Price</th>
              <th className="p-2 text-center border-b border-terminal-border">Direction</th>
              <th className="p-2 text-right border-b border-terminal-border">Target (7d)</th>
              <th className="p-2 text-right border-b border-terminal-border">% Ret</th>
              <th className="p-2 text-right border-b border-terminal-border hidden xl:table-cell">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((pred) => {
              const returnPct = ((pred.targetPrice - pred.currentPrice) / pred.currentPrice) * 100;
              const isBull = pred.sentiment === 'BULLISH';
              const isBear = pred.sentiment === 'BEARISH';
              
              return (
                <tr key={pred.symbol} className="border-b border-terminal-border/50 hover:bg-black/5 dark:hover:bg-white/5 text-xs group transition-colors">
                  <td className="p-2 font-bold text-terminal-text font-mono group-hover:text-terminal-accent">{pred.symbol}</td>
                  <td className="p-2 text-right font-mono text-terminal-muted">{pred.currentPrice.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isBull ? 'bg-green-500/10 text-green-500' : 
                      isBear ? 'bg-red-500/10 text-red-500' : 
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {pred.sentiment}
                    </span>
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-terminal-text">
                    {pred.targetPrice.toFixed(2)}
                  </td>
                  <td className={`p-2 text-right font-mono ${isBull ? 'text-terminal-up' : isBear ? 'text-terminal-down' : 'text-terminal-muted'}`}>
                    {returnPct > 0 ? '+' : ''}{returnPct.toFixed(2)}%
                  </td>
                  <td className="p-2 text-right font-mono text-terminal-muted hidden xl:table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-8 h-1 bg-terminal-border rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${pred.confidence}%` }}></div>
                      </div>
                      <span className="text-[9px]">{pred.confidence.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};