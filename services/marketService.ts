import { Quote } from '../types';
import { INITIAL_QUOTES } from '../constants';

type Listener = (quotes: Quote[]) => void;

class MarketService {
  private quotes: Quote[] = [...INITIAL_QUOTES];
  private listeners: Set<Listener> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  constructor() {
    // Initialize simulation
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Send initial data immediately
    listener(this.quotes);
    
    if (!this.isRunning) {
      this.startSimulation();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopSimulation();
      }
    };
  }

  // Helper for AI to get real-time data snapshot
  public getCurrentSnapshot(): Quote[] {
    return [...this.quotes];
  }

  private startSimulation() {
    this.isRunning = true;
    // Simulate high-frequency updates (every 500ms)
    this.intervalId = setInterval(() => {
      this.updateQuotes();
    }, 800);
  }

  private stopSimulation() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateQuotes() {
    // Randomly update a few quotes to simulate market activity
    const updatedQuotes = this.quotes.map(quote => {
      // 40% chance of update per tick
      if (Math.random() > 0.6) {
        const movePercent = (Math.random() - 0.5) * 0.005; // Small moves
        const newPrice = quote.price * (1 + movePercent);
        const change = newPrice - (quote.price - quote.change); // Approx calculation relative to prev close
        const changePercent = (change / (quote.price - quote.change)) * 100;
        
        return {
          ...quote,
          price: Number(newPrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          bid: Number((newPrice - 0.05).toFixed(2)),
          ask: Number((newPrice + 0.05).toFixed(2)),
          high: Math.max(quote.high, newPrice),
          low: Math.min(quote.low, newPrice),
          volume: quote.volume + Math.floor(Math.random() * 1000)
        };
      }
      return quote;
    });

    this.quotes = updatedQuotes;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.quotes));
  }
}

export const marketService = new MarketService();