'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
import { BookOpen, User, ArrowRight, ShieldCheck, Sparkles, Shield } from 'lucide-react';
import { showToast } from '@/components/ToastNotification';

export default function EntryPage() {
  const router = useRouter();
  const { user, setUser } = useGameStore();
  const [showSplash, setShowSplash] = useState(true);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      if (user) router.push('/home');
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, router]);

  const getUserIP = async (): Promise<string> => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);

    try {
      // Get user IP
      const ip = await getUserIP();

      const { data: existingUsers, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim());
      if (searchError) throw searchError;

      let currentUser;
      if (existingUsers && existingUsers.length > 0) {
        currentUser = existingUsers[0];
      } else {
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${username.trim()}`;
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ username: username.trim(), avatar_url: avatarUrl }])
          .select()
          .single();
        if (createError) throw createError;
        currentUser = newUser;
      }

      // Check if user is banned (by ID or IP)
      const { data: bans } = await supabase
        .from('user_bans')
        .select('*')
        .or(`user_id.eq.${currentUser.id},user_ip.eq.${ip}`)
        .eq('is_active', true);

      if (bans && bans.length > 0) {
        const ban = bans[0];
        const isPermanent = ban.ban_type === 'permanent';
        const isExpired = !isPermanent && ban.banned_until && new Date(ban.banned_until) < new Date();

        if (!isExpired) {
          setBanInfo(ban);
          useGameStore.getState().setBanInfo(ban);
          setIsLoading(false);
          return;
        } else {
          await supabase.from('user_bans').update({ is_active: false }).eq('id', ban.id);
        }
      }

      // Update IP and login history
      const loginEntry = { ip, logged_at: new Date().toISOString() };
      const newHistory = [loginEntry, ...(currentUser.login_history || []).slice(0, 9)];
      await supabase.from('users').update({
        last_ip: ip,
        login_history: newHistory
      }).eq('id', currentUser.id);

      setUser({ ...currentUser, last_ip: ip });
      router.push('/home');
    } catch (error) {
      showToast({ type: 'error', title: 'Login Failed', message: 'Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (banInfo) {
    const isPermanent = banInfo.ban_type === 'permanent';
    const untilDate = banInfo.banned_until ? new Date(banInfo.banned_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-10 border border-red-200 shadow-2xl shadow-red-100/50 max-w-md w-full text-center space-y-6"
        >
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Account Banned</h2>
            <p className="text-slate-500 text-sm font-medium">
              {isPermanent
                ? 'Your account has been permanently banned by the admin.'
                : `Your account is temporarily banned until ${untilDate}.`}
            </p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Reason</p>
            <p className="text-sm text-red-700 font-medium">{banInfo.reason || 'Violation of community guidelines'}</p>
          </div>
          <p className="text-xs text-slate-400 font-medium">Contact your administrator if you believe this is a mistake.</p>
          <button
            onClick={() => setBanInfo(null)}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all text-sm uppercase tracking-widest"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Soft Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-40" />
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center space-y-4 absolute inset-0 bg-white z-50"
          >
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <BookOpen className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Al Imran</h1>
              <p className="text-slate-500 font-medium">English Learning Excellence</p>
            </div>
          </motion.div>
        ) : !user && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md z-10"
          >
            <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
              <header className="text-center space-y-2 mb-10">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                  <User className="w-7 h-7" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-slate-500">Sign in to continue your learning journey</p>
              </header>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Your Full Name</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Asad Chaudhary"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      Sign In to Platform
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-10 flex items-center justify-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-widest">Enterprise Grade Security</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-6 opacity-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Gamified Learning</span>
              </div>
              <div className="w-px h-4 bg-slate-300 self-center" />
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Smart Curriculum</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
