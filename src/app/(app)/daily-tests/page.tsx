'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, XCircle, ChevronLeft, Trophy, ArrowRight, Zap, Lightbulb, RefreshCw, BookOpen, GraduationCap, Star, ShieldCheck, Activity } from 'lucide-react';
import { getAdaptiveQuestions, getDifficultyFromScore } from '@/lib/questions';

const CATEGORIES = ["Grammar", "Voices", "Tenses", "Random"];

export default function DailyTestPage() {
  const router = useRouter();
  const { user, updateXP, updateHearts, completeTest, usePerk, updateCoins } = useGameStore();

  const [stage, setStage] = useState<'cooldown' | 'category' | 'test' | 'result'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [activeDifficulty, setActiveDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const prevScore = user?.prev_test_score || 0;
  const prevTotal = user?.prev_test_total || 0;

  // Check Cooldown
  useEffect(() => {
    if (user?.last_test_at) {
      const lastTest = new Date(user.last_test_at);
      const now = new Date();
      const diffHours = (now.getTime() - lastTest.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        setStage('cooldown');
      }
    }
  }, [user?.last_test_at]);

  // Timer logic
  useEffect(() => {
    if (stage !== 'test' || isAnswered) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, isAnswered]);

  // Handle time up
  useEffect(() => {
    if (stage === 'test' && !isAnswered && timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft, stage, isAnswered]);

  const startTest = (category: string) => {
    setSelectedCategory(category);
    const diff = getDifficultyFromScore(prevScore, prevTotal);
    setActiveDifficulty(diff);
    const q = getAdaptiveQuestions(category, 15, prevScore, prevTotal);
    setQuestions(q);
    setStage('test');
    setTimeLeft(100);
  };

  const handleTimeUp = () => {
    setIsAnswered(true);
    setIsCorrect(false);
    updateHearts(-1);
    setTimeout(() => nextQuestion(), 1500);
  };

  const handleSelect = (option: string) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option === questions[currentQIndex].answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
      updateXP(20);
      updateCoins(5);
    } else {
      updateHearts(-1);
    }

    setTimeout(() => nextQuestion(), 1500);
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setHiddenOptions([]);
    } else {
      // Save score for next adaptive session via completeTest
      completeTest(score, questions.length);
      setStage('result');
    }
  };

  const useHint = async () => {
    if (isAnswered || hiddenOptions.length >= 2) return;
    const success = await usePerk('hints');
    if (success) {
      const currentQ = questions[currentQIndex];
      const wrongIndices = currentQ.options
        .map((opt: string, idx: number) => opt !== currentQ.answer ? idx : -1)
        .filter((idx: number) => idx !== -1 && !hiddenOptions.includes(idx));

      const randomWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      setHiddenOptions(prev => [...prev, randomWrong]);
    }
  };

  const useRefill = async () => {
    const success = await usePerk('refills');
    if (success) {
      updateHearts(5 - (user?.hearts || 0));
    }
  };

  if (stage === 'cooldown') {
    const lastTest = new Date(user!.last_test_at!);
    const nextTest = new Date(lastTest.getTime() + 24 * 60 * 60 * 1000);
    const timeLeftHours = Math.ceil((nextTest.getTime() - new Date().getTime()) / (1000 * 60 * 60));

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-slate-200 shadow-2xl shadow-slate-200/50 max-w-xl w-full text-center space-y-8">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto border-4 border-amber-100 shadow-inner">
            <Clock className="w-12 h-12 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Rest Cycle Active</h2>
            <p className="text-slate-500 font-medium">You've successfully completed today's assessment. The system will reset in <span className="text-blue-600 font-bold">{timeLeftHours} hours</span>.</p>
          </div>
          <button onClick={() => router.push('/home')} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 uppercase tracking-widest text-xs">
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (stage === 'category') {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-32">
        <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-10">
          <header className="flex items-center gap-6">
            <button onClick={() => router.push('/home')} className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Diagnostic Test</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select Your Assessment Category</p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => startTest(cat)}
                className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left flex justify-between items-center group active:scale-[0.98]"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {cat === 'Grammar' && <BookOpen className="w-7 h-7" />}
                    {cat === 'Voices' && <GraduationCap className="w-7 h-7" />}
                    {cat === 'Tenses' && <Zap className="w-7 h-7" />}
                    {cat === 'Random' && <Star className="w-7 h-7" />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight italic">{cat} Assessment</h3>
                  <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> 100s</span>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Activity className="w-3 h-3" /> 15 Questions</span>
                      <div className="w-1 h-1 bg-slate-200 rounded-full" />
                      {prevTotal > 0 && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          getDifficultyFromScore(prevScore, prevTotal) === 'hard' ? 'bg-rose-100 text-rose-600' :
                          getDifficultyFromScore(prevScore, prevTotal) === 'medium' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>{getDifficultyFromScore(prevScore, prevTotal)} tier</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'result') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-slate-200 shadow-2xl shadow-slate-200/50 max-w-xl w-full text-center space-y-10">
          <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto border-4 border-blue-100 shadow-xl shadow-blue-100/50">
            <Trophy className="w-12 h-12 text-blue-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Assessment Finalized</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Technical Summary Report</p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Accuracy Rate</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round((score / questions.length) * 100)}%</span>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{score} / {questions.length} Correct</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">XP Earned</span>
              <span className="text-4xl font-black text-blue-600 tracking-tighter">+{score * 20}</span>
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Next: {getDifficultyFromScore(score, questions.length).toUpperCase()} tier</p>
            </div>
          </div>

          <button onClick={() => router.push('/home')} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-slate-900/20 active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3">
            Sync to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-white md:bg-slate-50/50">
      <div className="max-w-3xl mx-auto p-6 md:p-10 pb-32 space-y-8 flex flex-col min-h-screen">
        {/* Testing Interface Header */}
        <header className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/30">
          <button onClick={() => setStage('category')} className="p-3 rounded-2xl bg-slate-50 text-slate-500 hover:text-blue-600 transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center flex-1 px-8">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Diagnostic_Progress</span>
            <div className="flex gap-1.5 w-full max-w-[240px]">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentQIndex ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-slate-100'}`} />
              ))}
            </div>
          </div>

          <div className={`px-5 py-2.5 rounded-2xl border-2 flex items-center gap-3 font-black text-sm tracking-widest transition-colors ${timeLeft <= 20 ? 'bg-red-50 border-red-500 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-900'}`}>
            <Clock className="w-4 h-4" />
            <span className="w-8">{timeLeft}s</span>
          </div>
        </header>

        {/* Perks Section */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={useHint} disabled={isAnswered || (user?.perks?.hints || 0) <= 0} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 flex items-center justify-center gap-4 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all disabled:opacity-30 group active:scale-95 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 transition-transform group-hover:scale-110">
              <Lightbulb className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hint Protocol</p>
              <p className="text-sm font-black text-slate-900 leading-none">Remaining: {user?.perks?.hints || 0}</p>
            </div>
          </button>
          <button onClick={useRefill} disabled={(user?.perks?.refills || 0) <= 0 || (user?.hearts || 0) === 5} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 flex items-center justify-center gap-4 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all disabled:opacity-30 group active:scale-95 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 transition-transform group-hover:scale-110">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Life Support</p>
              <p className="text-sm font-black text-slate-900 leading-none">Stock: {user?.perks?.refills || 0}</p>
            </div>
          </button>
        </div>

        {/* Primary Question Module */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[3rem] p-12 md:p-20 border border-slate-200 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-10">Question {currentQIndex + 1} of {questions.length}</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase italic">{currentQ.text}</h2>
          </motion.div>
        </AnimatePresence>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          {currentQ.options.map((option: string, idx: number) => {
            const isHidden = hiddenOptions.includes(idx);
            if (isHidden) return null;

            let stateClass = "bg-white border-slate-200 text-slate-900 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-200/50";
            if (isAnswered) {
              if (option === currentQ.answer) {
                stateClass = "bg-emerald-50 border-emerald-500 text-emerald-800 ring-4 ring-emerald-500/10 scale-[1.02] z-10";
              } else if (option === selectedOption) {
                stateClass = "bg-red-50 border-red-500 text-red-800 ring-4 ring-red-500/10 scale-[1.02] z-10";
              } else {
                stateClass = "bg-white border-slate-100 text-slate-300 opacity-40 grayscale";
              }
            }

            return (
              <motion.button
                key={idx}
                layout
                onClick={() => handleSelect(option)}
                disabled={isAnswered || isHidden}
                className={`w-full py-6 px-10 rounded-[2rem] text-xl font-black text-left transition-all border flex justify-between items-center group relative ${stateClass}`}
              >
                <div className="flex items-center gap-8">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-2xl text-base font-black transition-colors ${isAnswered && option === currentQ.answer ? 'bg-emerald-600 text-white' : isAnswered && option === selectedOption ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="uppercase tracking-tight">{option}</span>
                </div>
                {isAnswered && option === currentQ.answer && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
                {isAnswered && option === selectedOption && option !== currentQ.answer && <XCircle className="w-8 h-8 text-red-600" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
