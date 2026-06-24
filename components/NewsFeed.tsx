import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { newsService } from '../services/newsService';
import { NewsItem } from '../types';
import { RefreshCw } from 'lucide-react';

export const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = newsService.subscribe(setNews);
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    newsService.forceRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <Card 
      title="News Wire" 
      className="h-full"
      actions={
        <button onClick={handleRefresh} className={`text-terminal-muted hover:text-terminal-text transition-all ${isRefreshing ? 'animate-spin text-terminal-accent' : ''}`} title="Force Update">
          <RefreshCw size={12} />
        </button>
      }
    >
      <div className="h-full overflow-y-auto">
        <ul className="divide-y divide-terminal-border/30">
          {news.map((item, index) => {
            const isFlash = index === 0 && isRefreshing; 
            return (
              <li key={item.id} className={`p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden ${isFlash ? 'animate-pulse bg-terminal-accent/5' : ''}`}>
                {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-terminal-accent"></div>}
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-white dark:text-black bg-gray-500 dark:bg-gray-400 px-1 rounded-sm uppercase tracking-tight">{item.source}</span>
                    <span className="text-[9px] text-terminal-muted font-mono">{item.time}</span>
                  </div>
                </div>
                <h4 className={`text-[11px] font-medium leading-tight mb-1 ${index === 0 ? 'text-terminal-text font-bold' : 'text-terminal-muted group-hover:text-terminal-text'}`}>
                  {item.headline}
                </h4>
                <div className="flex flex-wrap gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {item.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[8px] text-terminal-accent border border-terminal-accent/20 px-1 rounded">{tag}</span>
                  ))}
                  {item.sentiment === 'positive' && <span className="text-[8px] text-terminal-up">▲ Bullish</span>}
                  {item.sentiment === 'negative' && <span className="text-[8px] text-terminal-down">▼ Bearish</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
};