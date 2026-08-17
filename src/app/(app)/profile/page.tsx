'use client';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { LogOut, Star, Flame, Medal, Award, Shield, ChevronRight, User as UserIcon, Bell, Settings, Lightbulb, RefreshCw, Coins, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, logout } = useGameStore();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const achievements = [
    { name: 'Elite Grammarian', icon: Medal, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { name: 'Streak Legend', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { name: 'Mastermind', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        
        {/* Profile Identity Card */}
        <header className="bg-white rounded-[2.5rem] p-10 md:p-12 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-full border-[6px] border-white bg-slate-100 shadow-2xl shadow-blue-600/10 overflow-hidden transition-transform duration-500 group-hover:scale-105">
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 right-4 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full border-4 border-white shadow-lg">
                LEVEL_{user.level}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase italic">{user.username}</h2>
              <div className="flex items-center justify-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{user.role || 'Professional Student'}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Active_Session</span>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-12">
              {[
                { label: 'XP', val: user.xp, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Coins', val: user.coins || 0, icon: Coins, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Hints', val: user.perks?.hints || 0, icon: Lightbulb, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                { label: 'Refills', val: user.perks?.refills || 0, icon: RefreshCw, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center transition-all hover:bg-white hover:border-blue-200 hover:shadow-lg">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-3 shadow-sm`}>
                    <stat.icon className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{stat.val}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Accomplishments */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Academic Achievements</h3>
            </div>
            <Sparkles className="w-5 h-5 text-slate-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((ach, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className={`${ach.bg} rounded-3xl p-6 flex flex-col items-center justify-center text-center border-2 ${ach.border} transition-all hover:shadow-lg`}
              >
                <ach.icon className={`w-10 h-10 ${ach.color} mb-4`} />
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{ach.name}</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Verified_Badge</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Global Configuration */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Control Panel</span>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Security Protocols', icon: Shield },
              { label: 'Identity Settings', icon: UserIcon },
              { label: 'Interface Preferences', icon: Activity },
              { label: 'Communication Hub', icon: Bell },
            ].map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </section>

        {/* Sign Out Protocol */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-rose-50 text-rose-600 font-black py-5 rounded-[2rem] transition-all border-2 border-rose-100 shadow-xl shadow-rose-200/20 active:scale-95 uppercase tracking-[0.2em] text-xs"
        >
          <LogOut className="w-5 h-5" />
          Terminate_Session
        </button>
      </div>
    </div>
  );
}
