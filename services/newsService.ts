import { NewsItem } from '../types';
import { MOCK_NEWS, NEWS_TEMPLATES, NEWS_SOURCES, INITIAL_QUOTES } from '../constants';

type NewsListener = (news: NewsItem[]) => void;

class NewsService {
  private news: NewsItem[] = [...MOCK_NEWS];
  private listeners: Set<NewsListener> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  
  // 10 minutes in milliseconds
  private readonly UPDATE_INTERVAL = 10 * 60 * 1000; 

  constructor() {
    this.startService();
  }

  public subscribe(listener: NewsListener): () => void {
    this.listeners.add(listener);
    listener(this.news);
    return () => this.listeners.delete(listener);
  }

  private startService() {
    // Generate some history to make it look lived-in if MOCK_NEWS is too short
    if (this.news.length < 10) {
       for (let i = 0; i < 5; i++) {
         this.addNewsItem(new Date(Date.now() - (Math.random() * 3600000)));
       }
    }

    // Set up the periodic update
    this.intervalId = setInterval(() => {
      this.addNewsItem();
    }, this.UPDATE_INTERVAL);
  }

  public forceRefresh() {
    this.addNewsItem();
  }

  private addNewsItem(timestamp: Date = new Date()) {
    const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    const source = NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)];
    const quote = INITIAL_QUOTES[Math.floor(Math.random() * INITIAL_QUOTES.length)];
    
    // Fill placeholders
    let headline = template.text
      .replace('{symbol}', quote.symbol)
      .replace('{price}', quote.price.toFixed(2))
      .replace('{percent}', Math.abs(quote.changePercent).toFixed(2))
      .replace('{sector}', quote.sector);

    // Determine sentiment based on keyword matching or random if neutral template
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (headline.includes('surge') || headline.includes('record') || headline.includes('upgrade') || headline.includes('beat')) {
      sentiment = 'positive';
    } else if (headline.includes('lower') || headline.includes('down') || headline.includes('scrutiny') || headline.includes('retreat')) {
      sentiment = 'negative';
    }

    const newItem: NewsItem = {
      id: Date.now().toString(),
      headline: headline,
      source: source,
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sentiment: sentiment,
      tags: [template.type, quote.symbol]
    };

    // Prepend new item
    this.news = [newItem, ...this.news].slice(0, 50); // Keep last 50 items
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.news));
  }
}

export const newsService = new NewsService();