import React from 'react';
import { ArrowRight, BarChart3, Shield, Zap, Globe, Cpu, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-y-auto font-sans selection:bg-cyan-500 selection:text-black">
      {/* Nav */}
      <nav className="fixed w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-500 rounded-sm"></div>
              <span className="text-lg font-bold tracking-widest">LUMINA<span className="text-cyan-500 font-light">PRO</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Platform</a>
              <a href="#" className="hover:text-white transition-colors">Markets</a>
              <a href="#" className="hover:text-white transition-colors">Enterprise</a>
              <a href="#" className="hover:text-white transition-colors">Pricing</a>
            </div>
            <button 
              onClick={onEnter}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all border border-white/10"
            >
              Client Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            SYSTEM V4.0 LIVE
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            The Speed of Thought.<br />
            <span className="text-white">The Power of Data.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10 leading-relaxed">
            Experience the next generation of financial intelligence. 
            Real-time execution, institutional-grade analytics, and AI-driven insights 
            in a unified, keyboard-first terminal interface.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onEnter}
              className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm uppercase tracking-wider rounded transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Launch Terminal <ArrowRight size={16} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 hover:bg-white/5 text-white font-bold text-sm uppercase tracking-wider rounded transition-all">
              Request Demo
            </button>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-[#0a0a0a] border-y border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-[#0f0f0f] border border-white/5 hover:border-cyan-500/30 transition-colors group">
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <Zap className="text-cyan-500" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Microsecond Latency</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Direct market access infrastructure designed for high-frequency workflows. Execute global trades instantly.</p>
            </div>
            
            <div className="p-6 rounded-lg bg-[#0f0f0f] border border-white/5 hover:border-purple-500/30 transition-colors group">
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Cpu className="text-purple-500" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Neural Core</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Integrated Gemini 2.5 Flash models analyze sentiment, predict trends, and automate complex portfolio strategies.</p>
            </div>

            <div className="p-6 rounded-lg bg-[#0f0f0f] border border-white/5 hover:border-green-500/30 transition-colors group">
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <Shield className="text-green-500" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Institutional Security</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Enterprise-grade encryption and compliance tools built for professional funds and desks.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#050505] py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            <span className="text-xs text-gray-500 font-mono">SYSTEM STATUS: OPERATIONAL</span>
          </div>
          <div className="text-xs text-gray-600">
            © 2024 LUMINA TECHNOLOGIES. ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </div>
  );
};