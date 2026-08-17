'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ChevronLeft, Star, Flame, BookOpen, Trophy, CheckCircle2, User, Zap, Heart } from 'lucide-react';

const TOPIC_NAMES: Record<string, string> = {
  'n-1': 'Nouns', 'p-1': 'Pronouns', 'v-1': 'Verbs',
  'adj-1': 'Adjectives', 'adv-1': 'Adverbs', 'prep-1': 'Prepositions',
  'conj-1': 'Conjunctions', 't-1': 'Present Simple', 't-2': 'Present Continuous',
  't-3': 'Present Perfect', 't-4': 'Present Perfect Continuous', 't-5': 'Past Simple',
  't-6': 'Past Continuous', 't-7': 'Past Perfect', 't-8': 'Past Perfect Continuous',
  't-9': 'Future Simple', 't-10': 'Future Continuous', 't-11': 'Future Perfect',
  't-12': 'Future Perfect Continuous', 'v-act': 'Active Voice', 'v-pass': 'Passive Voice',
  'n-dir': 'Direct Speech', 'n-ind': 'Indirect Speech',
};

const ACHIEVEMENT_THRESHOLDS = [
  { id: 'first_lesson', label: 'First Lesson', icon: '📖', desc: 'Completed your first topic', check: (u: any) => (u.completed_topics?.length || 0) >= 1 },
  { id: 'five_lessons', label: 'Quick Learner', icon: '⚡', desc: 'Completed 5 topics', check: (u: any) => (u.completed_topics?.length || 0) >= 5 },
  { id: 'ten_lessons', label: 'Scholar', icon: '🎓', desc: 'Completed 10 topics', check: (u: any) => (u.completed_topics?.length || 0) >= 10 },
  { id: 'all_lessons', label: 'Grammar Master', icon: '👑', desc: 'Completed all 23 topics', check: (u: any) => (u.completed_topics?.length || 0) >= 23 },
  { id: 'level_5', label: 'Level 5 Reach', icon: '🌟', desc: 'Reached Level 5', check: (u: any) => (u.level || 1) >= 5 },
  { id: 'level_10', label: 'Level 10 Reach', icon: '💎', desc: 'Reached Level 10', check: (u: any) => (u.level || 1) >= 10 },
  { id: 'streak_7', label: '7-Day Streak', icon: '🔥', desc: 'Maintained a 7-day streak', check: (u: any) => (u.current_streak || 0) >= 7 },
  { id: 'xp_500', label: 'XP Hunter', icon: '🏆', desc: 'Earned 500+ XP total', check: (u: any) => (u.xp || 0) >= 500 },
];

function PublicProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get('user') || '';
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }
    
    // Initial fetch
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, xp, level, current_streak, hearts, completed_topics, role')
        .ilike('username', username)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();

    // Real-time subscription for live updates
    const channel = supabase
      .channel(`profile-watch-${username}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `username=eq.${username}`,
      }, (payload) => {
        setProfile((prev: any) => prev ? { ...prev, ...payload.new } : payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [username]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <User className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">User Not Found</h1>
        <p className="text-slate-500">No user named "{username}" exists.</p>
        <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest">
          Go Back
        </button>
      </div>
    </div>
  );

  const completedTopics: string[] = profile?.completed_topics || [];
  const achievements = ACHIEVEMENT_THRESHOLDS.map(a => ({ ...a, unlocked: a.check(profile) }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPct = Math.round((completedTopics.length / 23) * 100);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold text-sm uppercase tracking-widest transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden border-4 border-blue-100 shadow-lg bg-slate-100">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-slate-400" /></div>}
              </div>
              {profile.role === 'admin' && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">ADMIN</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{profile.username}</h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Level {profile.level} Student</p>

              {/* Live badge */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Live Stats</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { icon: <Star className="w-4 h-4 fill-current" />, value: profile.xp, label: 'XP', color: 'text-blue-600 bg-blue-50' },
              { icon: <Flame className="w-4 h-4 fill-current" />, value: profile.current_streak, label: 'Streak', color: 'text-orange-500 bg-orange-50' },
              { icon: <BookOpen className="w-4 h-4" />, value: completedTopics.length, label: 'Topics', color: 'text-emerald-600 bg-emerald-50' },
              { icon: <Heart className="w-4 h-4 fill-current" />, value: profile.hearts, label: 'Hearts', color: 'text-rose-500 bg-rose-50' },
            ].map((stat, i) => (
              <div key={i} className={`${stat.color} rounded-2xl p-3 text-center`}>
                <div className="flex justify-center mb-1">{stat.icon}</div>
                <p className="text-lg font-black text-slate-900">{stat.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Learning Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Curriculum Progress</span>
              <span className="text-xs font-black text-blue-600">{completedTopics.length}/23 topics • {progressPct}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Academic Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Academic Achievements</h2>
            </div>
            <span className="text-xs font-black text-slate-400">{unlockedCount}/{achievements.length} Unlocked</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className={`p-4 rounded-2xl border-2 transition-all ${a.unlocked
                  ? 'bg-white border-amber-200 shadow-lg shadow-amber-100/40'
                  : 'bg-slate-50 border-slate-100 opacity-50 grayscale'}`}
              >
                <div className="text-2xl mb-2">{a.icon}</div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-tight">{a.label}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{a.desc}</p>
                {a.unlocked && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Unlocked</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Completed Topics */}
        {completedTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-1">
              <Zap className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Completed Lessons</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {completedTopics.map((topicId) => (
                <div key={topicId} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {TOPIC_NAMES[topicId] || topicId}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PublicProfileContent />
    </Suspense>
  );
}
