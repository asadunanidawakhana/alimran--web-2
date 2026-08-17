'use client';
import { useGameStore } from '@/store/gameStore';
import { BookOpen, CheckCircle2, Lock, ChevronRight, PlayCircle, ChevronLeft, Star, Target, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const CURRICULUM = [
  {
    category: 'Grammar Essentials',
    icon: <ShieldCheck className="w-5 h-5" />,
    items: [
      { id: 'n-1', title: 'Nouns', description: 'The foundation of English sentences.', status: 'completed' },
      { id: 'p-1', title: 'Pronouns', description: 'Learn to replace nouns effectively.', status: 'completed' },
      { id: 'v-1', title: 'Verbs', description: 'Understand action and state words.', status: 'unlocked' },
      { id: 'adj-1', title: 'Adjectives', description: 'Master descriptive language.', status: 'locked' },
      { id: 'adv-1', title: 'Adverbs', description: 'Modify and enhance your verbs.', status: 'locked' },
      { id: 'prep-1', title: 'Prepositions', description: 'Space, time, and relationships.', status: 'locked' },
      { id: 'conj-1', title: 'Conjunctions', description: 'Connect ideas seamlessly.', status: 'locked' },
    ]
  },
  {
    category: 'Tense Mastery',
    icon: <Target className="w-5 h-5" />,
    items: [
      { id: 't-1', title: 'Present Simple', description: 'Routines and universal facts.', status: 'locked' },
      { id: 't-2', title: 'Present Continuous', description: 'Actions happening right now.', status: 'locked' },
      { id: 't-3', title: 'Present Perfect', description: 'Connecting the past to now.', status: 'locked' },
      { id: 't-4', title: 'Present Perfect Continuous', description: 'Ongoing duration focus.', status: 'locked' },
      { id: 't-5', title: 'Past Simple', description: 'Mastering completed actions.', status: 'locked' },
      { id: 't-6', title: 'Past Continuous', description: 'Background past actions.', status: 'locked' },
      { id: 't-7', title: 'Past Perfect', description: 'The sequence of past events.', status: 'locked' },
      { id: 't-8', title: 'Past Perfect Continuous', description: 'Duration in the past.', status: 'locked' },
      { id: 't-9', title: 'Future Simple', description: 'Predictions and future plans.', status: 'locked' },
      { id: 't-10', title: 'Future Continuous', description: 'Future events in progress.', status: 'locked' },
      { id: 't-11', title: 'Future Perfect', description: 'Completing future goals.', status: 'locked' },
      { id: 't-12', title: 'Future Perfect Continuous', description: 'Future duration mastery.', status: 'locked' },
    ]
  },
  {
    category: 'Advanced Voice & Narration',
    icon: <Star className="w-5 h-5" />,
    items: [
      { id: 'v-act', title: 'Active Voice', description: 'Direct subject-action focus.', status: 'locked' },
      { id: 'v-pass', title: 'Passive Voice', description: 'Formal and object focus.', status: 'locked' },
      { id: 'n-dir', title: 'Direct Speech', description: 'Precise quoting techniques.', status: 'locked' },
      { id: 'n-ind', title: 'Indirect Speech', description: 'Professional reporting.', status: 'locked' },
    ]
  }
];

export default function LearnPage() {
  const router = useRouter();
  const { user } = useGameStore();

  // Dynamic status calculation
  const dynamicCurriculum = CURRICULUM.map(section => ({
    ...section,
    items: section.items.map(item => {
      let status: 'locked' | 'unlocked' | 'completed' = 'unlocked';

      if (user?.completed_topics?.includes(item.id)) {
        status = 'completed';
      }

      return { ...item, status };
    })
  }));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-10">
        {/* Professional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Curriculum</h1>
              <p className="text-slate-500 font-medium">Master English through structured paths</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-200 shadow-sm self-start">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Level</p>
              <p className="text-sm font-bold text-blue-700 leading-none">Intermediate Core</p>
            </div>
          </div>
        </header>

        {/* Curriculum Modules */}
        <div className="space-y-12">
          {dynamicCurriculum.map((section, sIdx) => (
            <div key={section.category} className="space-y-6">
              {/* Section Branding */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  {section.icon}
                </div>
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{section.category}</h2>
              </div>

              {/* Responsive Item Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item, iIdx) => {
                  const status = item.status as string;
                  const isLocked = status === 'locked';
                  const isCompleted = status === 'completed';
                  const isActive = status === 'unlocked';

                  return (
                    <motion.button
                      key={item.id}
                      disabled={isLocked}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: iIdx * 0.03 }}
                      onClick={() => !isLocked && router.push(`/learn/${item.id}`)}
                      className={`group text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${isLocked
                        ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                        : isActive
                          ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/10 scale-[1.02]'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                    >
                      {/* Status Indicator */}
                      <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-all ${isCompleted
                        ? 'bg-emerald-50 text-emerald-600'
                        : isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-100 text-slate-400'
                        }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : isLocked ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <PlayCircle className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold truncate ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 truncate mt-1">{item.description}</p>
                      </div>

                      {!isLocked && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300 group-hover:text-blue-400'}`}>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
