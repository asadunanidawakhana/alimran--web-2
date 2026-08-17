'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { Trophy, Crown, TrendingUp, Zap, Sparkles, ChevronRight, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string;
  xp: number;
  level: number;
}

export default function LeaderboardPage() {
  const { user: currentUser } = useGameStore();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, xp, level')
        .order('xp', { ascending: false })
        .limit(50);

      if (!error && data) {
        setUsers(data);
      }
      setIsLoading(false);
    };

    fetchLeaderboard();

    const subscription = supabase
      .channel('public:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-12">
        
        {/* Professional Leaderboard Header */}
        <header className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/40 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-48 h-48 bg-amber-50 rounded-full blur-3xl -ml-24 -mt-24 opacity-60" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-100 group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">The Honor Roll</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Recognizing Excellence Across the Global Network</p>
          </div>
        </header>

        {/* Podium Section (Top 3) */}
        <section className="grid grid-cols-3 gap-6 items-end px-4">
          {/* Silver (Rank 2) */}
          {users[1] && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-200 bg-white p-1 shadow-lg">
                  <img src={users[1].avatar_url} className="w-full h-full rounded-full object-cover grayscale opacity-80" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center font-bold text-slate-700 text-xs">2</div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700 truncate w-24">{users[1].username}</p>
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{users[1].xp} XP</p>
              </div>
            </motion.div>
          )}

          {/* Gold (Rank 1) */}
          {users[0] && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 relative">
              <Crown className="w-8 h-8 text-amber-500 absolute -top-8 animate-bounce" />
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[6px] border-amber-400 bg-white p-1.5 shadow-2xl shadow-amber-200">
                  <img src={users[0].avatar_url} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-amber-500 border-4 border-white flex items-center justify-center font-black text-white text-lg">1</div>
              </div>
              <div className="text-center pb-4">
                <p className="text-lg font-black text-slate-900 tracking-tight">{users[0].username}</p>
                <p className="text-sm font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-4 py-1 rounded-full border border-amber-100">Champion</p>
              </div>
            </motion.div>
          )}

          {/* Bronze (Rank 3) */}
          {users[2] && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-200 bg-white p-1 shadow-lg">
                  <img src={users[2].avatar_url} className="w-full h-full rounded-full object-cover grayscale-[0.5] opacity-90" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-orange-300 border-2 border-white flex items-center justify-center font-bold text-orange-700 text-xs">3</div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700 truncate w-24">{users[2].username}</p>
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{users[2].xp} XP</p>
              </div>
            </motion.div>
          )}
        </section>

        {/* The List */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Standard Rankings</span>
            <Sparkles className="w-4 h-4 text-slate-300" />
          </div>
          
          <div className="divide-y divide-slate-100">
            {users.slice(3).map((u, index) => {
              const isMe = u.id === currentUser?.id;
              const rank = index + 4;
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className={`p-6 flex items-center justify-between transition-all group ${isMe ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-6">
                    <span className={`w-8 text-sm font-black italic ${isMe ? 'text-blue-600' : 'text-slate-300'}`}>
                      {rank.toString().padStart(2, '0')}
                    </span>

                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform group-hover:scale-105 ${isMe ? 'border-blue-400 p-0.5' : 'border-slate-100 p-0.5'}`}>
                        <img src={u.avatar_url} className="w-full h-full rounded-[0.5rem] object-cover bg-slate-50" />
                      </div>
                      {isMe && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className={`font-bold text-base leading-none ${isMe ? 'text-blue-700' : 'text-slate-900'}`}>
                        {u.username} {isMe && <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 ml-2">Self</span>}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level {u.level}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <TrendingUp className="w-3 h-3 text-slate-300" />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className={`text-xl font-black ${isMe ? 'text-blue-700' : 'text-slate-900'}`}>{u.xp}</span>
                      <Zap className={`w-4 h-4 ${isMe ? 'text-blue-500 fill-blue-500' : 'text-slate-300'}`} />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Score</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
