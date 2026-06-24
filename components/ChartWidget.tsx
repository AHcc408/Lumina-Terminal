import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ReferenceArea, 
  Cell, 
  Scatter, 
  Brush,
  ReferenceDot
} from 'recharts';
import { Card } from './Card';
import { TimeFrame } from '../types';
import { generateChartData } from '../constants';
import { 
  Activity, Pencil, Square, Trash2, MousePointer2, 
  Layers, PenTool, Undo2, ChevronDown, Move, Type,
  TrendingUp, BarChart2, Ruler, Triangle, GitGraph,
  Fan
} from 'lucide-react';

interface ChartWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
}

type DrawingType = 'line' | 'horizontal' | 'rect' | 'fib' | 'gann' | 'elliott';

interface DrawingPoint {
  x: string; // Time label
  y: number; // Price
}

interface Drawing {
  id: string;
  type: DrawingType;
  points: DrawingPoint[]; // Line=2, Rect=2, Horizontal=1, Fib=2, Gann=2, Elliott=5+
  color: string;
}

type ToolType = 'cursor' | 'line' | 'horizontal' | 'rect' | 'fib' | 'gann';
type ChartType = 'candle' | 'line' | 'area';

// --- Indicators Logic ---
const calculateSMA = (data: any[], period: number) => {
  return data.map((item, index, arr) => {
    if (index < period - 1) return { ...item, [`sma${period}`]: null };
    const slice = arr.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return { ...item, [`sma${period}`]: sum / period };
  });
};

const calculateEMA = (data: any[], period: number) => {
  const k = 2 / (period + 1);
  let ema = data[0].close;
  return data.map((item, index) => {
    if (index === 0) return { ...item, ema: item.close };
    ema = (item.close - ema) * k + ema;
    return { ...item, ema };
  });
};

const calculateRSI = (data: any[], period: number = 14) => {
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;

  return data.map((item, index) => {
    if (index <= period) return { ...item, rsi: null };
    
    const change = item.close - data[index - 1].close;
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return { ...item, rsi };
  });
};

const calculateMACD = (data: any[]) => {
  // 1. EMA 12
  const k12 = 2 / (12 + 1);
  let ema12 = data[0].close;
  const dataWithEma12 = data.map((item, i) => {
    if(i===0) return { ...item, ema12 };
    ema12 = (item.close - ema12) * k12 + ema12;
    return { ...item, ema12 };
  });

  // 2. EMA 26
  const k26 = 2 / (26 + 1);
  let ema26 = data[0].close;
  const dataWithEma26 = dataWithEma12.map((item, i) => {
    if(i===0) return { ...item, ema26 };
    ema26 = (item.close - ema26) * k26 + ema26;
    return { ...item, ema26 };
  });

  // 3. MACD Line
  const dataWithMacd = dataWithEma26.map(item => ({
    ...item,
    macdLine: item.ema12 - item.ema26
  }));

  // 4. Signal Line (EMA 9 of MACD Line)
  const k9 = 2 / (9 + 1);
  let signal = 0; 
  // Need to skip first 26 to stabilize
  return dataWithMacd.map((item, i) => {
    if (i < 26) return { ...item, macdSignal: null, macdHist: null };
    if (i === 26) { signal = item.macdLine; return { ...item, macdSignal: signal, macdHist: 0 }; }
    signal = (item.macdLine - signal) * k9 + signal;
    return { ...item, macdSignal: signal, macdHist: item.macdLine - signal };
  });
};

export const ChartWidget: React.FC<ChartWidgetProps> = ({ symbol, theme = 'dark' }) => {
  // --- STATE ---
  const [rawData, setRawData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<TimeFrame>(TimeFrame.M5);
  const [viewState, setViewState] = useState({ start: 350, end: 499 });
  
  // Settings
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [indicators, setIndicators] = useState({ sma: false, ema: false, rsi: false, macd: false });
  const [showToolbar, setShowToolbar] = useState(false);
  
  // Drawing & Tools
  const [tool, setTool] = useState<ToolType>('cursor');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<Partial<Drawing> | null>(null);
  
  // Dragging logic
  const [dragState, setDragState] = useState<{ 
    isDragging: boolean; 
    drawingId: string | null; 
    pointIndex: number | null; 
  }>({ isDragging: false, drawingId: null, pointIndex: null });

  const chartRef = useRef<HTMLDivElement>(null);

  // --- COLORS ---
  const AXIS_COLOR = theme === 'dark' ? '#444' : '#9ca3af';
  const GRID_COLOR = theme === 'dark' ? '#111' : '#e5e7eb';
  const COLOR_UP = '#00ff9d'; // Neon Green
  const COLOR_DOWN = '#ff3e3e'; // Neon Red
  const TOOL_COLOR = '#00d4ff'; // Neon Blue
  const CROSSHAIR_COLOR = 'rgba(255, 255, 255, 0.2)';

  // --- CROSSHAIR STATE ---
  const [crosshair, setCrosshair] = useState<{ x: number | string; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  useEffect(() => {
    const totalPoints = 500;
    const newData = generateChartData(totalPoints);
    setRawData(newData);
    setViewState({ start: totalPoints - 100, end: totalPoints - 1 });
    setDrawings([]);
  }, [symbol, timeframe]);

  // --- DATA PROCESSING ---
  const fullChartData = useMemo(() => {
    if (!rawData.length) return [];
    let processed = [...rawData];
    processed = calculateSMA(processed, 50);
    processed = calculateSMA(processed, 200);
    if (indicators.sma) processed = calculateSMA(processed, 20);
    if (indicators.ema) processed = calculateEMA(processed, 20);
    if (indicators.rsi) processed = calculateRSI(processed);
    if (indicators.macd) processed = calculateMACD(processed);
    return processed;
  }, [rawData, indicators]);

  const visibleData = useMemo(() => {
    if (!fullChartData.length) return [];
    const start = Math.max(0, viewState.start);
    const end = Math.min(fullChartData.length - 1, viewState.end);
    return fullChartData.slice(start, end + 1);
  }, [fullChartData, viewState]);

  const yDomain = useMemo(() => {
    if (!visibleData.length) return [0, 0];
    const highs = visibleData.map(d => d.high).filter(v => typeof v === 'number' && !isNaN(v));
    const lows = visibleData.map(d => d.low).filter(v => typeof v === 'number' && !isNaN(v));
    
    if (highs.length === 0 || lows.length === 0) return [0, 0];
    
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.15;
    return [min - padding, max + padding];
  }, [visibleData]);

  // --- DRAWING HELPERS ---
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  const getPriceFromY = (chartY: number, height: number) => {
    if (typeof chartY !== 'number' || isNaN(chartY)) return 0;
    const [min, max] = yDomain;
    if (min === max) return min;
    const top = 10; const bottom = 10; 
    const chartHeight = height - top - bottom;
    if (chartHeight <= 0) return 0;
    const relativeY = chartY - top;
    const ratio = Math.max(0, Math.min(1, relativeY / chartHeight));
    const priceRange = max - min;
    return max - (ratio * priceRange);
  };

  const addPattern = (pattern: string) => {
    if (!visibleData.length) return;
    
    // Calculate center of view for placing templates
    const centerIndex = Math.floor(visibleData.length / 2);
    const centerTime = visibleData[centerIndex].time;
    const centerPrice = visibleData[centerIndex].close;
    const spreadX = Math.floor(visibleData.length / 6);
    const leftTime = visibleData[Math.max(0, centerIndex - spreadX)].time;
    const rightTime = visibleData[Math.min(visibleData.length-1, centerIndex + spreadX)].time;
    const priceOffset = centerPrice * 0.005;

    const newDrawings: Drawing[] = [];
    const baseId = generateId();

    switch(pattern) {
      case 'Trendline':
        newDrawings.push({ id: baseId, type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice - priceOffset}, {x: rightTime, y: centerPrice + priceOffset}] });
        break;
      case 'Horizontal':
        newDrawings.push({ id: baseId, type: 'horizontal', color: TOOL_COLOR, points: [{x: centerTime, y: centerPrice}] });
        break;
      case 'Rectangle':
        newDrawings.push({ id: baseId, type: 'rect', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice + priceOffset}, {x: rightTime, y: centerPrice - priceOffset}] });
        break;
      case 'Ascending Triangle':
        newDrawings.push({ id: baseId + '_1', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice + priceOffset}, {x: rightTime, y: centerPrice + priceOffset}] }); // Top Flat
        newDrawings.push({ id: baseId + '_2', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice - priceOffset}, {x: rightTime, y: centerPrice + priceOffset}] }); // Bottom Rising
        break;
      case 'Descending Triangle':
        newDrawings.push({ id: baseId + '_1', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice - priceOffset}, {x: rightTime, y: centerPrice - priceOffset}] }); // Bottom Flat
        newDrawings.push({ id: baseId + '_2', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice + priceOffset}, {x: rightTime, y: centerPrice - priceOffset}] }); // Top Falling
        break;
      case 'Channel':
        newDrawings.push({ id: baseId + '_1', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice - priceOffset}, {x: rightTime, y: centerPrice + priceOffset - priceOffset}] }); 
        newDrawings.push({ id: baseId + '_2', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice + priceOffset}, {x: rightTime, y: centerPrice + priceOffset + priceOffset}] });
        break;
      case 'Head & Shoulders':
         newDrawings.push({ id: baseId + '_neck', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice - priceOffset}, {x: rightTime, y: centerPrice - priceOffset}] }); 
         newDrawings.push({ id: baseId + '_L', type: 'line', color: TOOL_COLOR, points: [{x: leftTime, y: centerPrice - priceOffset}, {x: visibleData[centerIndex - Math.floor(spreadX/2)].time, y: centerPrice + priceOffset}] });
         newDrawings.push({ id: baseId + '_R', type: 'line', color: TOOL_COLOR, points: [{x: visibleData[centerIndex + Math.floor(spreadX/2)].time, y: centerPrice + priceOffset}, {x: rightTime, y: centerPrice - priceOffset}] });
         break;
      case 'Elliott Impulse (12345)':
         const step = Math.floor(spreadX / 2);
         const pointsImpulse = [
           {x: visibleData[Math.max(0, centerIndex - step*2)].time, y: centerPrice},
           {x: visibleData[Math.max(0, centerIndex - step)].time, y: centerPrice + priceOffset * 2},
           {x: visibleData[centerIndex].time, y: centerPrice + priceOffset},
           {x: visibleData[Math.min(visibleData.length-1, centerIndex + step)].time, y: centerPrice + priceOffset * 3},
           {x: visibleData[Math.min(visibleData.length-1, centerIndex + step*1.5)].time, y: centerPrice + priceOffset * 1.5},
           {x: visibleData[Math.min(visibleData.length-1, centerIndex + step*2.5)].time, y: centerPrice + priceOffset * 4}
         ];
         newDrawings.push({ id: baseId, type: 'elliott', color: '#10b981', points: pointsImpulse });
         break;
      case 'Elliott Correction (ABC)':
         const stepABC = Math.floor(spreadX / 2);
         const pointsABC = [
           {x: visibleData[Math.max(0, centerIndex - stepABC)].time, y: centerPrice + priceOffset * 3},
           {x: visibleData[centerIndex].time, y: centerPrice},
           {x: visibleData[Math.min(visibleData.length-1, centerIndex + stepABC)].time, y: centerPrice + priceOffset * 1.5},
           {x: visibleData[Math.min(visibleData.length-1, centerIndex + stepABC*2)].time, y: centerPrice - priceOffset}
         ];
         newDrawings.push({ id: baseId, type: 'elliott', color: '#ef4444', points: pointsABC });
         break;
    }
    
    setDrawings(prev => [...prev, ...newDrawings]);
    setTool('cursor'); 
  };

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: any) => {
    if (!e || !e.activeLabel || typeof e.chartY !== 'number' || isNaN(e.chartY)) return;
    
    if (tool !== 'cursor') {
      const chartHeight = chartRef.current?.clientHeight || 400;
      const price = getPriceFromY(e.chartY, chartHeight);
      
      const newId = generateId();
      const points = [{ x: e.activeLabel, y: price }];
      if (tool !== 'horizontal') points.push({ x: e.activeLabel, y: price }); // 2nd point for line, rect, fib, gann

      setActiveDrawing({ id: newId, type: tool as DrawingType, points, color: TOOL_COLOR });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!e || !e.activeLabel || typeof e.chartY !== 'number' || isNaN(e.chartY)) {
      setCrosshair(prev => ({ ...prev, active: false }));
      return;
    }
    const chartHeight = chartRef.current?.clientHeight || 400;
    const price = getPriceFromY(e.chartY, chartHeight);

    setCrosshair({ x: e.activeLabel, y: e.chartY, active: true });

    if (dragState.isDragging && dragState.drawingId && dragState.pointIndex !== null) {
      setDrawings(prev => prev.map(d => {
        if (d.id === dragState.drawingId) {
          const newPoints = [...d.points];
          newPoints[dragState.pointIndex!] = { x: e.activeLabel, y: price };
          return { ...d, points: newPoints };
        }
        return d;
      }));
      return;
    }

    if (activeDrawing) {
      setActiveDrawing(prev => {
        if (!prev || !prev.points) return null;
        const newPoints = [...prev.points];
        if (prev.type === 'horizontal') {
           newPoints[0] = { x: e.activeLabel, y: price };
        } else {
           newPoints[1] = { x: e.activeLabel, y: price };
        }
        return { ...prev, points: newPoints };
      });
    }
  };

  const handleMouseUp = () => {
    if (activeDrawing) {
      setDrawings(prev => [...prev, activeDrawing as Drawing]);
      setActiveDrawing(null);
      setTool('cursor'); 
    }
    setDragState({ isDragging: false, drawingId: null, pointIndex: null });
  };

  const handleMouseLeave = () => {
    setCrosshair(prev => ({ ...prev, active: false }));
  };

  // --- RENDERERS ---
  const RenderHandles = () => {
    const handleData: any[] = [];
    drawings.forEach(d => {
      d.points.forEach((p, idx) => {
        handleData.push({ x: p.x, y: p.y, drawingId: d.id, pointIndex: idx });
      });
    });

    return (
      <Scatter 
        yAxisId="price"
        data={handleData} 
        shape={(props: any) => (
          <circle 
            cx={props.cx} 
            cy={props.cy} 
            r={5} 
            fill="white" 
            stroke={TOOL_COLOR} 
            strokeWidth={2} 
            cursor="pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              setDragState({ isDragging: true, drawingId: props.payload.drawingId, pointIndex: props.payload.pointIndex });
            }}
          />
        )}
        isAnimationActive={false}
      />
    );
  };

  const AnyReferenceArea = ReferenceArea as any;
  const AnyReferenceLine = ReferenceLine as any;
  const AnyCell = Cell as any;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const displayTime = data.timestamp ? new Date(data.timestamp).toLocaleString() : label;
      
      return (
        <div className="bg-terminal-panel/90 backdrop-blur-md border border-terminal-accent/30 p-3 rounded shadow-[0_0_20px_rgba(0,212,255,0.15)] text-[10px] font-mono z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
          <div className="flex justify-between items-center mb-2 border-b border-terminal-accent/20 pb-1.5">
             <span className="text-terminal-accent font-bold tracking-wider">{displayTime}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-terminal-muted">OPEN</span> 
              <span className="text-terminal-text font-medium">{data.open?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-terminal-muted">HIGH</span> 
              <span className="text-terminal-text font-medium">{data.high?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-terminal-muted">LOW</span> 
              <span className="text-terminal-text font-medium">{data.low?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-terminal-border/30">
              <span className="text-terminal-muted font-bold">CLOSE</span> 
              <span className={`font-bold ${data.close >= data.open ? 'text-terminal-up drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]' : 'text-terminal-down drop-shadow-[0_0_5px_rgba(255,62,62,0.5)]'}`}>
                {data.close?.toFixed(2)}
              </span>
            </div>
            {indicators.rsi && (
              <div className="flex justify-between items-center pt-1 text-purple-400">
                <span className="opacity-70">RSI</span> 
                <span className="font-bold">{data.rsi?.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title={`Price Action - ${symbol}`} 
      className="h-full flex flex-col relative group"
      actions={
        <div className="flex items-center space-x-2">
           {/* TIMEFRAMES */}
           <div className="hidden sm:flex items-center border border-terminal-border rounded overflow-hidden">
              {[TimeFrame.M1, TimeFrame.M5, TimeFrame.H1].map((tf) => (
                <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-0.5 text-[10px] font-mono transition-colors ${timeframe === tf ? 'bg-terminal-accent text-white font-bold' : 'bg-terminal-panel text-terminal-muted hover:text-terminal-text'}`}>{tf}</button>
              ))}
           </div>
           
           <div className="h-4 w-px bg-terminal-border hidden sm:block"></div>

           {/* CHART TYPES */}
           <div className="flex items-center gap-1">
             <button onClick={() => setChartType('candle')} className={`p-1 rounded ${chartType === 'candle' ? 'text-terminal-accent bg-terminal-accent/10' : 'text-terminal-muted'}`} title="Candles"><BarChart2 size={14} /></button>
             <button onClick={() => setChartType('line')} className={`p-1 rounded ${chartType === 'line' ? 'text-terminal-accent bg-terminal-accent/10' : 'text-terminal-muted'}`} title="Line"><TrendingUp size={14} /></button>
             <button onClick={() => setChartType('area')} className={`p-1 rounded ${chartType === 'area' ? 'text-terminal-accent bg-terminal-accent/10' : 'text-terminal-muted'}`} title="Area"><Activity size={14} /></button>
           </div>

           <div className="h-4 w-px bg-terminal-border"></div>

           {/* INDICATORS TOGGLE */}
           <div className="hidden sm:flex items-center gap-1">
             {(['sma', 'ema', 'macd', 'rsi'] as const).map(ind => (
               <button 
                key={ind}
                onClick={() => setIndicators(prev => ({...prev, [ind]: !prev[ind]}))}
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded border transition-colors ${indicators[ind] ? 'bg-terminal-accent/20 border-terminal-accent text-terminal-accent' : 'border-transparent text-terminal-muted hover:bg-terminal-border'}`}
               >
                 {ind}
               </button>
             ))}
           </div>

           <div className="h-4 w-px bg-terminal-border hidden sm:block"></div>

           {/* TOOLBAR TOGGLE */}
           <button onClick={() => setShowToolbar(!showToolbar)} className={`p-1 rounded transition-colors ${showToolbar ? 'text-terminal-accent bg-terminal-accent/10' : 'text-terminal-muted hover:text-terminal-text'}`} title="Drawing Tools"><PenTool size={14} /></button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-terminal-bg relative select-none">
        
        {/* --- DRAWING TOOLBAR --- */}
        {showToolbar && (
          <div className="absolute left-2 top-2 z-20 flex flex-col gap-1 bg-terminal-panel border border-terminal-border rounded shadow-xl p-1 animate-in slide-in-from-left-2 duration-200 w-36">
             <div className="text-[9px] text-terminal-muted uppercase font-bold px-2 py-1">Tools</div>
             <div className="grid grid-cols-4 gap-1 p-1">
                <button onClick={() => setTool('cursor')} className={`p-1.5 rounded flex justify-center ${tool === 'cursor' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:bg-black/10'}`} title="Select/Move"><MousePointer2 size={14} /></button>
                <button onClick={() => setTool('line')} className={`p-1.5 rounded flex justify-center ${tool === 'line' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:bg-black/10'}`} title="Trendline"><Pencil size={14} /></button>
                <button onClick={() => setTool('horizontal')} className={`p-1.5 rounded flex justify-center ${tool === 'horizontal' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:bg-black/10'}`} title="Horizontal Level"><Undo2 size={14} className="rotate-90" /></button>
                <button onClick={() => setTool('rect')} className={`p-1.5 rounded flex justify-center ${tool === 'rect' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:bg-black/10'}`} title="Rectangle"><Square size={14} /></button>
                <button onClick={() => setTool('fib')} className={`p-1.5 rounded flex justify-center ${tool === 'fib' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:bg-black/10'}`} title="Fib Retracement"><Ruler size={14} /></button>
                <button onClick={() => setTool('gann')} className={`p-1.5 rounded flex justify-center ${tool === 'gann' ? 'bg-terminal-accent text-white' : 'text-terminal-muted hover:bg-black/10'}`} title="Gann Fan"><Fan size={14} /></button>
             </div>
             
             <div className="h-px bg-terminal-border my-1"></div>
             <div className="text-[9px] text-terminal-muted uppercase font-bold px-2 py-1">Patterns</div>
             
             <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto p-1">
               {['Elliott Impulse (12345)', 'Elliott Correction (ABC)', 'Ascending Triangle', 'Descending Triangle', 'Channel', 'Head & Shoulders', 'Trendline'].map(p => (
                 <button key={p} onClick={() => addPattern(p)} className="text-left text-[10px] px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-terminal-text truncate">
                   {p}
                 </button>
               ))}
             </div>

             <div className="h-px bg-terminal-border my-1"></div>
             <button onClick={() => setDrawings([])} className="flex items-center gap-2 text-[10px] text-red-400 hover:bg-red-500/10 p-1.5 rounded m-1">
               <Trash2 size={12} /> Clear All
             </button>
          </div>
        )}

        {/* --- MAIN CHART --- */}
        <div className="flex-[0.7] min-h-0 relative w-full" ref={chartRef}>
          {/* Crosshair Overlay */}
          {crosshair.active && typeof crosshair.y === 'number' && !isNaN(crosshair.y) && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {/* Horizontal Line */}
              <div 
                className="absolute left-0 right-0 h-px bg-terminal-accent/30 border-t border-dashed border-terminal-accent/50"
                style={{ top: crosshair.y }}
              />
              {/* Price Label on Right */}
              <div 
                className="absolute right-0 px-1 py-0.5 bg-terminal-accent text-black text-[9px] font-bold rounded-l"
                style={{ top: crosshair.y - 8 }}
              >
                {getPriceFromY(crosshair.y, chartRef.current?.clientHeight || 400).toFixed(2)}
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={visibleData} 
              margin={{ top: 10, right: 50, left: 10, bottom: 0 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: tool === 'cursor' ? (dragState.isDragging ? 'grabbing' : 'default') : 'crosshair' }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_UP} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={COLOR_UP} stopOpacity={0}/>
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={true} />
              <XAxis dataKey="time" hide={true} />
              <YAxis 
                yAxisId="price" 
                domain={yDomain} 
                orientation="right" 
                tick={{ fontSize: 10, fill: AXIS_COLOR, fontFamily: 'JetBrains Mono' }} 
                axisLine={false} 
                tickLine={{ stroke: GRID_COLOR }} 
                tickFormatter={(val) => val.toFixed(2)} 
                width={50} 
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#00d4ff', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }} 
                isAnimationActive={false} 
              />

              {/* DRAWINGS RENDERER */}
              {drawings.map((d) => {
                 // Skip drawings with invalid points
                 if (!d.points || d.points.some(p => isNaN(p.y))) return null;

                 // --- Simple Lines ---
                 if (d.type === 'line' && d.points.length === 2) {
                   return <AnyReferenceLine yAxisId="price" key={d.id} segment={[{ x: d.points[0].x, y: d.points[0].y }, { x: d.points[1].x, y: d.points[1].y }]} stroke={d.color} strokeWidth={2} />;
                 }
                 // --- Horizontal ---
                 if (d.type === 'horizontal' && d.points.length >= 1) {
                   return <AnyReferenceLine yAxisId="price" key={d.id} y={d.points[0].y} stroke={d.color} strokeWidth={2} />;
                 }
                 // --- Rectangle ---
                 if (d.type === 'rect' && d.points.length === 2) {
                   return (
                     <AnyReferenceArea 
                       key={d.id}
                       yAxisId="price" 
                       x1={d.points[0].x} 
                       x2={d.points[1].x} 
                       y1={d.points[0].y} 
                       y2={d.points[1].y} 
                       fill={d.color} 
                       fillOpacity={0.1} 
                       stroke={d.color} 
                     />
                   );
                 }
                 // --- Fibonacci Retracement ---
                 if (d.type === 'fib' && d.points.length === 2) {
                   const y1 = d.points[0].y;
                   const y2 = d.points[1].y;
                   const diff = y2 - y1;
                   const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                   return (
                     <React.Fragment key={d.id}>
                       <ReferenceLine key={`${d.id}-trend`} yAxisId="price" segment={[{x: d.points[0].x, y: y1}, {x: d.points[1].x, y: y2}]} stroke={d.color} strokeDasharray="3 3" strokeOpacity={0.5} />
                       {levels.map(level => {
                         const y = y1 + (diff * level);
                         if (isNaN(y)) return null;
                         return (
                           <ReferenceLine 
                              key={`${d.id}-level-${level}`} 
                              yAxisId="price" 
                              segment={[{x: d.points[0].x, y}, {x: d.points[1].x, y}]} 
                              stroke={d.color} 
                              strokeWidth={1}
                              label={{ position: 'right', value: `${level.toFixed(3)} (${y.toFixed(2)})`, fill: d.color, fontSize: 9 }}
                           />
                         );
                       })}
                     </React.Fragment>
                   );
                 }
                 // --- Gann Fan ---
                 if (d.type === 'gann' && d.points.length === 2) {
                    const multipliers = [0.125, 0.25, 0.333, 0.5, 1, 2, 3, 4, 8];
                    const y1 = d.points[0].y;
                    const y2 = d.points[1].y;
                    const dy = y2 - y1;
                    return (
                      <React.Fragment key={d.id}>
                        {multipliers.map(m => {
                          const targetY = y1 + (dy * m);
                          if (isNaN(targetY)) return null;
                          return (
                            <ReferenceLine 
                               key={`${d.id}-fan-${m}`} 
                               yAxisId="price" 
                               segment={[{x: d.points[0].x, y: y1}, {x: d.points[1].x, y: targetY}]} 
                               stroke={d.color} 
                               strokeWidth={1} 
                               strokeOpacity={0.6}
                               label={m === 1 ? { position: 'insideTopRight', value: '1x1', fill: d.color, fontSize: 9 } : undefined}
                            />
                          );
                        })}
                      </React.Fragment>
                    );
                 }
                 // --- Elliott Wave ---
                 if (d.type === 'elliott' && d.points.length > 1) {
                   return (
                     <React.Fragment key={d.id}>
                       {d.points.map((p, i) => {
                         if (i === d.points.length - 1) return null;
                         const nextP = d.points[i+1];
                         return (
                           <React.Fragment key={`${d.id}-seg-${i}`}>
                             <ReferenceLine 
                               key={`${d.id}-line-${i}`}
                               yAxisId="price" 
                               segment={[{x: p.x, y: p.y}, {x: nextP.x, y: nextP.y}]} 
                               stroke={d.color} 
                               strokeWidth={2}
                             />
                             {i > 0 && (
                               <ReferenceDot 
                                  key={`${d.id}-dot-${i}`}
                                  yAxisId="price"
                                  x={p.x} 
                                  y={p.y} 
                                  r={8} 
                                  fill={theme === 'dark' ? '#000' : '#fff'} 
                                  stroke={d.color}
                                  strokeWidth={1}
                                  label={{ value: i.toString(), fill: d.color, fontSize: 10, fontWeight: 'bold', position: 'center' }}
                                  isFront={true}
                               />
                             )}
                           </React.Fragment>
                         );
                       })}
                       {/* Last Point Label */}
                       <ReferenceDot 
                          key={`${d.id}-dot-last`}
                          yAxisId="price"
                          x={d.points[d.points.length-1].x} 
                          y={d.points[d.points.length-1].y} 
                          r={8} 
                          fill={theme === 'dark' ? '#000' : '#fff'} 
                          stroke={d.color}
                          strokeWidth={1}
                          label={{ value: (d.points.length-1).toString(), fill: d.color, fontSize: 10, fontWeight: 'bold', position: 'center' }}
                          isFront={true}
                       />
                     </React.Fragment>
                   );
                 }

                 return null;
              })}
              
              {/* ACTIVE DRAWING PREVIEW */}
              {activeDrawing && activeDrawing.points && activeDrawing.points.every(p => !isNaN(p.y)) && (
                 activeDrawing.type === 'line' && activeDrawing.points.length === 2 ? 
                  <AnyReferenceLine yAxisId="price" segment={[{ x: activeDrawing.points[0].x, y: activeDrawing.points[0].y }, { x: activeDrawing.points[1].x, y: activeDrawing.points[1].y }]} stroke={TOOL_COLOR} strokeWidth={2} strokeDasharray="3 3" /> :
                 activeDrawing.type === 'rect' && activeDrawing.points.length === 2 ?
                  <AnyReferenceArea 
                    yAxisId="price" 
                    x1={activeDrawing.points[0].x} 
                    x2={activeDrawing.points[1].x} 
                    y1={activeDrawing.points[0].y} 
                    y2={activeDrawing.points[1].y} 
                    fill={TOOL_COLOR} 
                    fillOpacity={0.1} 
                    stroke={TOOL_COLOR} 
                    strokeDasharray="3 3" 
                  /> :
                 activeDrawing.type === 'horizontal' && activeDrawing.points.length >= 1 ?
                  <AnyReferenceLine yAxisId="price" y={activeDrawing.points[0].y} stroke={TOOL_COLOR} strokeWidth={2} strokeDasharray="3 3" /> : 
                 (activeDrawing.type === 'fib' || activeDrawing.type === 'gann') && activeDrawing.points.length === 2 ?
                  <AnyReferenceLine yAxisId="price" segment={[{ x: activeDrawing.points[0].x, y: activeDrawing.points[0].y }, { x: activeDrawing.points[1].x, y: activeDrawing.points[1].y }]} stroke={TOOL_COLOR} strokeWidth={2} strokeDasharray="3 3" /> : null
              )}

              {/* CHART VISUALIZATION */}
              {chartType === 'candle' && (
                <>
                  <Bar dataKey={(d) => [d.low, d.high]} yAxisId="price" barSize={1} isAnimationActive={false}>
                    {visibleData.map((entry, index) => <AnyCell key={`wick-${index}`} fill={entry.close >= entry.open ? COLOR_UP : COLOR_DOWN} />)}
                  </Bar>
                  <Bar dataKey={(d) => [Math.min(d.open, d.close), Math.max(d.open, d.close)]} yAxisId="price" barSize={7} isAnimationActive={false}>
                    {visibleData.map((entry, index) => <AnyCell key={`body-${index}`} fill={entry.close >= entry.open ? COLOR_UP : COLOR_DOWN} style={{ filter: 'url(#glow)' }} />)}
                  </Bar>
                </>
              )}
              {chartType === 'line' && (
                <Line yAxisId="price" type="monotone" dataKey="close" stroke={COLOR_UP} strokeWidth={2} dot={false} isAnimationActive={false} style={{ filter: 'url(#glow)' }} />
              )}
              {chartType === 'area' && (
                <Area yAxisId="price" type="monotone" dataKey="close" stroke={COLOR_UP} fill="url(#areaGradient)" isAnimationActive={false} style={{ filter: 'url(#glow)' }} />
              )}

              {/* OVERLAYS */}
              {indicators.sma && <Line yAxisId="price" type="monotone" dataKey="sma20" stroke="#fb923c" strokeWidth={1} dot={false} isAnimationActive={false} />}
              {indicators.ema && <Line yAxisId="price" type="monotone" dataKey="ema" stroke="#3b82f6" strokeWidth={1} dot={false} isAnimationActive={false} />}
              
              {/* DRAG HANDLES */}
              {tool === 'cursor' && <RenderHandles />}

            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* --- INDICATOR SUB-CHARTS --- */}
        {(indicators.macd || indicators.rsi) && (
          <div className="flex-[0.25] flex flex-col min-h-0 border-t border-terminal-border/50">
            {indicators.rsi && (
              <div className="flex-1 min-h-0 relative">
                 <div className="absolute top-0 left-1 text-[9px] text-terminal-muted z-10">RSI (14)</div>
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={visibleData} margin={{ top: 5, right: 50, left: 10, bottom: 0 }}>
                     <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={true} />
                     <YAxis orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: AXIS_COLOR }} axisLine={false} tickLine={false} width={50} ticks={[30, 70]} />
                     <Tooltip content={<CustomTooltip />} cursor={{ stroke: AXIS_COLOR, strokeDasharray: '4 4' }} isAnimationActive={false} />
                     <AnyReferenceLine y={70} stroke={AXIS_COLOR} strokeDasharray="3 3" />
                     <AnyReferenceLine y={30} stroke={AXIS_COLOR} strokeDasharray="3 3" />
                     <Line type="monotone" dataKey="rsi" stroke="#c084fc" strokeWidth={1} dot={false} isAnimationActive={false} />
                   </ComposedChart>
                 </ResponsiveContainer>
              </div>
            )}
            {indicators.macd && (
              <div className="flex-1 min-h-0 relative border-t border-terminal-border/20">
                 <div className="absolute top-0 left-1 text-[9px] text-terminal-muted z-10">MACD (12, 26, 9)</div>
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={visibleData} margin={{ top: 5, right: 50, left: 10, bottom: 0 }}>
                     <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={true} />
                     <YAxis orientation="right" tick={{ fontSize: 9, fill: AXIS_COLOR }} axisLine={false} tickLine={false} width={50} />
                     <Tooltip content={<CustomTooltip />} cursor={{ stroke: AXIS_COLOR, strokeDasharray: '4 4' }} isAnimationActive={false} />
                     <AnyReferenceLine y={0} stroke={AXIS_COLOR} />
                     <Bar dataKey="macdHist" fill="#444" isAnimationActive={false}>
                        {visibleData.map((entry, index) => (
                          <AnyCell key={`cell-${index}`} fill={(entry as any).macdHist > 0 ? '#22c55e' : '#ef4444'} />
                        ))}
                     </Bar>
                     <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={1} dot={false} isAnimationActive={false} />
                     <Line type="monotone" dataKey="macdLine" stroke="#3b82f6" strokeWidth={1} dot={false} isAnimationActive={false} />
                   </ComposedChart>
                 </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* --- NAVIGATOR --- */}
        {!indicators.macd && !indicators.rsi && (
          <div className="flex-[0.1] w-full border-t border-terminal-border/50 bg-terminal-panel/30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fullChartData} margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
                <defs>
                   <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <Area type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={1} fill="url(#volGradient)" isAnimationActive={false} />
                <Brush 
                    dataKey="time" 
                    height={20} 
                    stroke="#3b82f6" 
                    fill={theme === 'dark' ? '#1a1a1a' : '#f3f4f6'} 
                    fillOpacity={0.5}
                    tickFormatter={() => ''}
                    startIndex={viewState.start}
                    endIndex={viewState.end}
                    onChange={(e: any) => {
                      if (e.startIndex !== undefined) setViewState({ start: e.startIndex, end: e.endIndex });
                    }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
};