'use client';
import { motion } from 'framer-motion';
import { BookOpen, Users, CheckSquare, Trophy, Zap, ChevronRight, GraduationCap, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

export default function HomePage() {
  const router = useRouter();
  const { user } = useGameStore();

  const ActionCard = ({ title, subtitle, icon: Icon, onClick, highlighted = false, delay = 0 }: any) => (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden w-full rounded-3xl p-8 flex flex-col items-start justify-between min-h-[180px] text-left transition-all border group ${highlighted
          ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-600/20'
          : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50'
        }`}
    >
      <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center transition-all ${highlighted ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
        <Icon className={`w-6 h-6 ${highlighted ? 'text-white' : ''}`} />
      </div>

      <div className="space-y-1">
        <h3 className={`text-xl font-bold tracking-tight ${highlighted ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`text-sm font-medium ${highlighted ? 'text-blue-100' : 'text-slate-500'}`}>
          {subtitle}
        </p>
      </div>

      <div className={`absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all ${highlighted ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-6xl mx-auto p-6 md:p-10 pb-32 space-y-8">
        
        {/* Modern Welcome Banner */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          {/* Animated Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Hello, {user?.username || 'Learner'}</h2>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Your Learning Journey is 33% Complete</p>
                </div>
                <button 
                  onClick={() => router.push('/battle')}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-all active:scale-95"
                >
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Battle Now
                </button>
              </div>
            </div>

            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">Course Completion</span>
                </div>
                <span className="text-lg font-black text-blue-600">33.3%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '33.33%' }}
                  className="h-full bg-blue-600 rounded-full shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ActionCard
              title="1v1 Battle Arena"
              subtitle="Compete with global players"
              icon={Zap}
              onClick={() => router.push('/battle')}
              highlighted={true}
              delay={0.1}
            />
          </div>
          <div className="lg:col-span-2">
            <ActionCard
              title="AI Assistant &amp; Notes"
              subtitle="Chat with AI &amp; convert question photos to exam notes"
              icon={Sparkles}
              onClick={() => router.push('/ai')}
              delay={0.15}
            />
          </div>
          <div className="lg:col-span-2">
            <ActionCard
              title="Curriculum Path"
              subtitle="Continue your structured English journey"
              icon={BookOpen}
              onClick={() => router.push('/learn')}
              delay={0.2}
            />
          </div>
          <ActionCard
            title="Daily Check"
            subtitle="Short practice sessions to keep you fresh"
            icon={CheckSquare}
            onClick={() => router.push('/daily-tests')}
            delay={0.3}
          />
          <ActionCard
            title="Active Groups"
            subtitle="Connect and learn with your batchmates"
            icon={Users}
            onClick={() => router.push('/groups')}
            delay={0.4}
          />
          <ActionCard
            title="Global Ranking"
            subtitle="See how you compare with other students"
            icon={Trophy}
            onClick={() => router.push('/leaderboard')}
            delay={0.5}
          />
        </div>
      </div>
    </div>
  );
}
