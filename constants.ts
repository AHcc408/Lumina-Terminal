import { Quote, NewsItem, ChartDataPoint } from './types';

export const INITIAL_QUOTES: Quote[] = [
  // US Tech & Market Movers (NASDAQ/NYSE)
  { symbol: 'ES=F', name: 'S&P 500 Futures', price: 4450.25, change: 12.50, changePercent: 0.28, volume: 1500000, high: 4460.00, low: 4435.50, bid: 4450.00, ask: 4450.50, sector: 'Index' },
  { symbol: 'NQ=F', name: 'Nasdaq 100 Futures', price: 15320.75, change: -45.25, changePercent: -0.30, volume: 800000, high: 15400.00, low: 15280.00, bid: 15320.50, ask: 15321.00, sector: 'Index' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.35, change: 1.20, changePercent: 0.68, volume: 45000000, high: 179.00, low: 177.50, bid: 178.30, ask: 178.40, sector: 'Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 325.80, change: 2.10, changePercent: 0.65, volume: 22000000, high: 327.00, low: 324.00, bid: 325.75, ask: 325.85, sector: 'Tech' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 460.15, change: -8.50, changePercent: -1.81, volume: 38000000, high: 470.00, low: 458.00, bid: 460.10, ask: 460.25, sector: 'Semi' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.50, change: 5.30, changePercent: 2.21, volume: 95000000, high: 248.00, low: 241.00, bid: 245.45, ask: 245.55, sector: 'Auto' },
  { symbol: 'AMZN', name: 'Amazon.com', price: 138.50, change: 0.90, changePercent: 0.65, volume: 32000000, high: 139.00, low: 137.50, bid: 138.45, ask: 138.55, sector: 'Tech' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 135.20, change: -0.50, changePercent: -0.37, volume: 18000000, high: 136.00, low: 134.80, bid: 135.15, ask: 135.25, sector: 'Tech' },
  { symbol: 'META', name: 'Meta Platforms', price: 298.00, change: 3.50, changePercent: 1.19, volume: 14000000, high: 300.00, low: 295.00, bid: 297.90, ask: 298.10, sector: 'Tech' },

  // BSE / Indian Markets
  { symbol: 'RELIANCE.BO', name: 'Reliance Ind.', price: 2450.00, change: 15.00, changePercent: 0.62, volume: 5000000, high: 2465.00, low: 2440.00, bid: 2449.50, ask: 2450.50, sector: 'Energy' },
  { symbol: 'TCS.BO', name: 'Tata Consultancy', price: 3450.00, change: -20.00, changePercent: -0.58, volume: 1200000, high: 3480.00, low: 3440.00, bid: 3449.00, ask: 3451.00, sector: 'Tech' },
  { symbol: 'HDFCBANK.BO', name: 'HDFC Bank', price: 1600.00, change: 10.00, changePercent: 0.63, volume: 3000000, high: 1610.00, low: 1590.00, bid: 1599.50, ask: 1600.50, sector: 'Finance' },
  { symbol: 'INFY.BO', name: 'Infosys Ltd.', price: 1450.00, change: 5.00, changePercent: 0.35, volume: 4500000, high: 1460.00, low: 1445.00, bid: 1449.50, ask: 1450.50, sector: 'Tech' },

  // Recent IPOs / Hot Stocks
  { symbol: 'ARM', name: 'Arm Holdings', price: 60.50, change: 5.50, changePercent: 10.00, volume: 50000000, high: 62.00, low: 58.00, bid: 60.40, ask: 60.60, sector: 'Semi' },
  { symbol: 'CART', name: 'Instacart', price: 30.00, change: -3.00, changePercent: -9.09, volume: 12000000, high: 33.00, low: 29.50, bid: 29.90, ask: 30.10, sector: 'Tech' },
  { symbol: 'KVYO', name: 'Klaviyo', price: 34.50, change: 1.50, changePercent: 4.55, volume: 8000000, high: 35.00, low: 33.00, bid: 34.40, ask: 34.60, sector: 'Tech' },

  // Commodities & Crypto
  { symbol: 'CL=F', name: 'Crude Oil', price: 88.50, change: 1.20, changePercent: 1.37, volume: 350000, high: 89.00, low: 87.50, bid: 88.45, ask: 88.55, sector: 'Energy' },
  { symbol: 'GC=F', name: 'Gold Futures', price: 1945.00, change: 5.00, changePercent: 0.26, volume: 150000, high: 1950.00, low: 1940.00, bid: 1944.80, ask: 1945.20, sector: 'Commodity' },
  { symbol: 'BTC-USD', name: 'Bitcoin', price: 26500.00, change: -200.00, changePercent: -0.75, volume: 1200000000, high: 26800.00, low: 26200.00, bid: 26495.00, ask: 26505.00, sector: 'Crypto' },
];

export const NEWS_SOURCES = ['Bloomberg Terminal', 'Reuters Wire', 'DJ Newswires', 'CNBC Pro', 'FT Markets', 'WSJ Markets'];

export const NEWS_TEMPLATES = [
  { text: "{symbol} shares surge {percent}% on heavy volume following earnings beat", type: "Earnings" },
  { text: "Analysts upgrade {symbol} to Overweight, citing strong AI demand", type: "Analyst" },
  { text: "Fed official hints at potential rate pause, markets rally", type: "Macro" },
  { text: "{sector} sector leads gains as investors rotate out of defensive assets", type: "Market Flow" },
  { text: "Oil prices stabilize around ${price} amidst supply concerns", type: "Commodities" },
  { text: "{symbol} announces strategic partnership to expand cloud infrastructure", type: "Corporate" },
  { text: "Breaking: {symbol} CEO to step down effective immediately", type: "Management" },
  { text: "European markets open lower on weak manufacturing data", type: "Macro" },
  { text: "{symbol} hits 52-week high, trading at ${price}", type: "Technical" },
  { text: "Institutional flows into {sector} ETFs hit record high", type: "Market Flow" },
  { text: "{symbol} faces antitrust scrutiny over new product launch", type: "Regulatory" },
  { text: "Bitcoin tests key resistance level at $30,000", type: "Crypto" },
  { text: "{symbol} declares special dividend of $2.50 per share", type: "Corporate" },
  { text: "Bond yields retreat as inflation expectations cool", type: "Macro" },
  { text: "Goldman Sachs raises price target for {symbol} to ${price}", type: "Analyst" }
];

export const MOCK_NEWS: NewsItem[] = [
  { id: '1', headline: "Fed signals potential pause in rate hikes as inflation cools", source: "Bloomberg", time: "10:30 AM", sentiment: "positive", tags: ["Macro", "Fed"] },
  { id: '2', headline: "Apple unveils new iPhone 15 Pro with titanium chassis", source: "Reuters", time: "10:15 AM", sentiment: "neutral", tags: ["Tech", "AAPL"] },
  { id: '3', headline: "Oil prices surge on extended supply cuts by OPEC+", source: "WSJ", time: "09:45 AM", sentiment: "negative", tags: ["Energy", "Commodities"] },
  { id: '4', headline: "Tesla initiates price cuts in China amidst competition", source: "CNBC", time: "09:30 AM", sentiment: "negative", tags: ["Auto", "TSLA"] },
  { id: '5', headline: "NVIDIA announces partnership with major cloud provider", source: "TechCrunch", time: "09:15 AM", sentiment: "positive", tags: ["Tech", "AI"] },
  { id: '6', headline: "Goldman Sachs raises S&P 500 year-end target", source: "Financial Times", time: "08:50 AM", sentiment: "positive", tags: ["Finance", "Markets"] },
];

// Helper to generate some initial chart data
export const generateChartData = (points: number = 500): any[] => {
  const data: any[] = [];
  let price = 150.00;
  let comparePrice = 4400.00; // Simulating an index like S&P 500
  const now = new Date();
  
  for (let i = 0; i < points; i++) {
    const time = new Date(now.getTime() - (points - i) * 60000); // 1 minute intervals
    const volatility = price * 0.002; // 0.2% volatility
    const change = (Math.random() - 0.5) * volatility * 2;
    
    // Generate valid OHLC
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    
    // Comparison Data (Correlated)
    const compareChange = (Math.random() - 0.4) * (comparePrice * 0.001); // Slightly bullish bias
    comparePrice += compareChange;

    const volume = Math.floor(Math.random() * 50000 + 10000);
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: time.getTime(),
      open,
      high,
      low,
      close,
      volume,
      comparePrice
    });
    price = close;
  }
  return data;
};