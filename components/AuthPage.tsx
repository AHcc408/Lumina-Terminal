import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Terminal, User, Chrome } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface AuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // For now, we'll keep the mock email/password login but add Google Sign-in
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px]"></div>
      
      <div className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-lg shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
               <Terminal className="text-cyan-500" size={24} />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Access Request'}
          </h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            {isLogin ? 'Enter your credentials to access the terminal.' : 'Apply for a professional trading account.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 rounded text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome size={18} />
              Continue with Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-gray-600 text-[10px] uppercase tracking-widest">Or use credentials</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    className="w-full bg-[#050505] border border-white/10 rounded p-3 pl-10 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-700"
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded p-3 pl-10 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-700"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded p-3 pl-10 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-700"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    {isLogin ? 'Authenticate' : 'Submit Request'} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 flex justify-between items-center text-xs">
             <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-500 hover:text-cyan-400">
               {isLogin ? 'Create an account' : 'Already have an account?'}
             </button>
             <button onClick={onBack} className="text-gray-500 hover:text-white">
               Back to Home
             </button>
          </div>
        </div>
        
        {/* Footer decoration */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>
      </div>
    </div>
  );
};
