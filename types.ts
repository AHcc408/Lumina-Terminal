export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
  name: string;
  sector: string;
}

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

export interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  type: 'LIMIT' | 'MARKET' | 'STOP';
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  timestamp: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
}

export interface Portfolio {
  cash: number;
  positions: { [symbol: string]: Position };
  totalValue: number; // Cash + Equity
}

export enum TimeFrame {
  M1 = '1m',
  M5 = '5m',
  H1 = '1h',
  D1 = '1d'
}

export enum WidgetType {
  QUOTE_GRID = 'Quotes',
  CHART = 'Chart',
  ORDER_ENTRY = 'Order',
  NEWS = 'News',
  PORTFOLIO = 'Portfolio'
}