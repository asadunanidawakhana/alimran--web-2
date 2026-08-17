'use client';
import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Flame, Heart, Star, User, Search, X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar() {
  const { user } = useGameStore();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 100);
    else { setQuery(''); setResults([]); }
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, username, avatar_url, xp, level, current_streak, completed_topics')
        .ilike('username', `%${query}%`)
        .neq('id', user?.id || '')
        .limit(6);
      setResults(data || []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [query, user?.id]);

  if (!user) return null;

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-sm">
        {/* User Branding */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => router.push('/profile')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md group-hover:shadow-blue-200 transition-all">
              <div className="w-full h-full rounded-full bg-white overflow-hidden p-0.5">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
              <div className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                L{user.level}
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <h3 className="text-sm font-bold text-slate-900 leading-none">{user.username}</h3>
            <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Premium Student</p>
          </div>
        </div>

        {/* Right side: Stats + AI + Search */}
        <div className="flex items-center gap-2">
          {/* Streak */}
          <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-100/50">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span className="text-sm font-bold text-orange-700">{user.current_streak}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100/50">
            <Star className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
            <span className="text-sm font-bold text-blue-700">{user.xp}</span>
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-100/50">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="text-sm font-bold text-rose-700">{user.hearts}</span>
          </div>

          {/* AI Quick Button */}
          <button
            id="quick-ai-btn"
            onClick={() => router.push('/ai')}
            className="ml-1 px-2.5 h-9 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-600 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all"
            title="Al Imran AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI</span>
          </button>

          {/* Search Button */}
          <button
            id="search-users-btn"
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
            title="Search users"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  id="user-search-input"
                  type="text"
                  placeholder="Search by username..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 text-slate-900 font-medium text-sm outline-none placeholder:text-slate-400"
                />
                <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-all">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {searching && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!searching && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No users found for "{query}"</p>
                  </div>
                )}

                {!searching && results.length > 0 && (
                  <div className="p-2">
                    {results.map((u) => (
                      <button
                        key={u.id}
                        id={`search-result-${u.id}`}
                        onClick={() => {
                          setSearchOpen(false);
                          router.push(`/profile/view?user=${u.username}`);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{u.username}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Level {u.level} • {u.xp} XP • {u.completed_topics?.length || 0} topics</p>
                        </div>
                        <div className="text-xs font-black text-slate-300 group-hover:text-blue-500 transition-colors">→</div>
                      </button>
                    ))}
                  </div>
                )}

                {!query && (
                  <div className="text-center py-8 text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Type a username to search</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
