'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';

export default function AdminLoginPage() {
  const { user, setUser } = useGameStore();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check against dynamic master password from site_settings (or hardcoded fallback)
    const { data: settingData } = await supabase.from('site_settings').select('value').eq('id', 'master_password').single();
    const validPassword = settingData?.value || 'admin123';

    if (password === validPassword) {
      // If a user is logged in, promote them to admin in DB
      if (user?.id) {
        await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
        setUser({ ...user, role: 'admin' });
      }
      
      // Set admin session in localStorage for simplicity
      localStorage.setItem('admin_session', 'true');
      router.push('/admin');
    } else {
      setError('Invalid admin credentials.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Immersive Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md glass rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-2xl relative z-10"
      >
        <div className="w-24 h-24 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-primary/20 border border-primary/30 relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all duration-500" />
          <Shield className="w-12 h-12 text-primary relative z-10" />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Access Control</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-white/10" />
            <p className="text-muted font-black uppercase tracking-[0.3em] text-[10px]">Security Clearance Required</p>
            <span className="h-px w-8 bg-white/10" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-5">Master Access Key</label>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-16 text-white font-black tracking-[0.5em] outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/10 text-center"
                autoFocus
              />
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-error/10 border border-error/20 p-4 rounded-2xl flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
              <p className="text-error font-bold text-[10px] uppercase tracking-widest">{error}</p>
            </motion.div>
          )}

          <button
            disabled={isLoading || !password}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm group"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Authorize Session
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <button 
            onClick={() => router.push('/')}
            className="text-muted hover:text-white transition-all flex items-center justify-center gap-2 mx-auto font-black uppercase tracking-[0.2em] text-[10px] group"
          >
            <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Return to Learning
          </button>
        </div>
      </motion.div>
    </div>
  );
}
