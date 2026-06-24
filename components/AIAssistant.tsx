import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from "@google/genai";
import { Send, Bot, User, Sparkles, Terminal, ShieldAlert } from 'lucide-react';
import { Card } from './Card';
import { marketService } from '../services/marketService';
import { portfolioService } from '../services/portfolioService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface AIAssistantProps {
  theme?: 'dark' | 'light';
}

// Function Definition for Gemini
const tradeFunctionDeclaration: FunctionDeclaration = {
  name: 'executeOrder',
  description: 'Execute a buy or sell order for a stock. Use this when the user explicitly asks to buy or sell a specific quantity of a symbol.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      symbol: {
        type: Type.STRING,
        description: 'The stock ticker symbol (e.g., AAPL, TSLA).',
      },
      side: {
        type: Type.STRING,
        enum: ['BUY', 'SELL'],
        description: 'The direction of the trade.',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'The number of shares to trade.',
      },
    },
    required: ['symbol', 'side', 'quantity'],
  },
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ theme = 'dark' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: "Lumina Pro AI Terminal Online. I have real-time access to market data and can execute trades upon your command.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session with Tools
  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are a sophisticated financial AI assistant embedded in Lumina Pro.
          
          CAPABILITIES:
          1. REAL-TIME DATA: You will be provided with a snapshot of current market prices in every user message context. Use this data to answer questions about price, change, and volume accurately. Do NOT hallucinate prices.
          2. TRADING: You are authorized to execute trades. If a user says "Buy 100 AAPL", use the 'executeOrder' tool. 
          
          GUIDELINES:
          - Be concise, professional, and data-driven.
          - If the user asks for a price, look at the provided context JSON.
          - If the context doesn't have the symbol, say you don't have data for it.
          - When a tool is used, summarize the result clearly (e.g., "Trade executed successfully: Bought 100 AAPL at $150.00").
          `,
          tools: [{ functionDeclarations: [tradeFunctionDeclaration] }],
        },
      });
      setChatSession(chat);
    } catch (error) {
      console.error("Failed to initialize AI:", error);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSession || isLoading) return;

    // 1. Get Real-Time Context
    const currentSnapshot = marketService.getCurrentSnapshot();
    const contextString = `
      [SYSTEM CONTEXT - REAL TIME MARKET DATA]
      ${JSON.stringify(currentSnapshot.map(q => ({ s: q.symbol, p: q.price, c: q.changePercent })))}
      [USER MESSAGE]
      ${input}
    `;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Send Message with Context
      let result = await chatSession.sendMessageStream({ message: contextString });
      
      const botMsgId = (Date.now() + 1).toString();
      let fullText = '';
      
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      // 3. Handle Streaming Response & Function Calls
      for await (const chunk of result) {
        // Handle Tool Calls (Function Calling)
        if (chunk.toolCall && chunk.toolCall.functionCalls) {
           for (const fc of chunk.toolCall.functionCalls) {
             if (fc.name === 'executeOrder') {
                const { symbol, side, quantity } = fc.args as any;
                
                // Find current price for execution
                const quote = marketService.getCurrentSnapshot().find(q => q.symbol === symbol);
                const price = quote ? quote.price : 0;

                // Execute via Service
                const tradeResult = portfolioService.executeTrade(symbol, side, quantity, price);
                
                // Send result back to Gemini
                const toolResponse = {
                  functionResponses: [{
                    id: fc.id,
                    name: fc.name,
                    response: { result: tradeResult } // Pass the success/fail message back
                  }]
                };
                
                // Gemini will now generate a text response based on this tool output
                // We need to wait for the *next* response from Gemini which explains what happened
                // Note: In streaming, we might need a separate call or handle the continuation. 
                // The SDK handles sending the tool response and continuing the conversation.
                await chatSession.sendToolResponse(toolResponse); 
                // The loop will effectively continue receiving the *text* explanation from Gemini in subsequent chunks or a new generation
             }
           }
        }

        // Accumulate Text
        if (chunk.text) {
          fullText += chunk.text;
          setMessages(prev => prev.map(msg => 
            msg.id === botMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Error: Unable to process request. Please check API key or limits.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const bubbleClass = (role: 'user' | 'model') => {
    if (role === 'user') {
      return theme === 'dark' 
        ? 'bg-terminal-accent text-black ml-auto' 
        : 'bg-terminal-accent text-white ml-auto';
    }
    return theme === 'dark' 
      ? 'bg-[#1a1a1a] text-terminal-text border border-terminal-border' 
      : 'bg-white text-terminal-text border border-terminal-border shadow-sm';
  };

  return (
    <Card 
      title="Lumina AI Analyst (Live)" 
      className="h-full flex flex-col"
      actions={
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-terminal-accent/10 border border-terminal-accent/20">
          <Sparkles size={10} className="text-terminal-accent" />
          <span className="text-[10px] font-bold text-terminal-accent tracking-wider">ACTIVE</span>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-terminal-bg relative">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-6 h-6 rounded bg-terminal-panel border border-terminal-border flex items-center justify-center shrink-0 mt-1">
                <Terminal size={12} className="text-terminal-accent" />
              </div>
            )}
            
            <div className={`p-3 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap ${bubbleClass(msg.role)}`}>
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded bg-terminal-accent flex items-center justify-center shrink-0 mt-1">
                <User size={12} className={theme === 'dark' ? 'text-black' : 'text-white'} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%]">
             <div className="w-6 h-6 rounded bg-terminal-panel border border-terminal-border flex items-center justify-center shrink-0">
                <Terminal size={12} className="text-terminal-accent" />
              </div>
              <div className="flex items-center gap-1 p-3 rounded-lg bg-terminal-panel border border-terminal-border">
                <span className="w-1.5 h-1.5 bg-terminal-muted rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-terminal-muted rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-terminal-muted rounded-full animate-bounce delay-150"></span>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 bg-terminal-panel border-t border-terminal-border">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask to 'Buy 100 AAPL' or 'Analyze prices'..."
            className="flex-1 bg-terminal-bg border border-terminal-border rounded p-2 pl-3 text-xs font-mono text-terminal-text focus:outline-none focus:border-terminal-accent transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3 bg-terminal-accent text-white dark:text-black rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </Card>
  );
};