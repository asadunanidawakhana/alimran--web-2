'use client';
import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2, XCircle, Trophy, BookOpen, Star, ArrowRight, Lightbulb, RefreshCw, Activity, Sparkles, ShieldCheck, Bot, Download } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

import { TOPIC_DATA } from '@/lib/learnData';

export default function LearnTopicClient({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const topic = TOPIC_DATA[id];
  const { user, updateXP, updateHearts, usePerk, completeTopic } = useGameStore();

  const [mode, setMode] = useState<'intro' | 'learn' | 'practice' | 'result'>('intro');
  const [practiceSubMode, setPracticeSubMode] = useState<'none' | 'self' | 'ai'>('none');
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [aiScore, setAiScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  const randomizedLevels = useMemo(() => {
    if (!topic) return [];
    return topic.levels.map((level: any) => {
      const options = [...level.options].sort(() => Math.random() - 0.5);
      return { ...level, options };
    });
  }, [topic]);

  const topicDifficulty = topic?.difficulty;

  useEffect(() => {
    if (mode === 'practice' && practiceSubMode === 'ai' && !selectedOption && topicDifficulty) {
      const timer = setInterval(() => {
        if (Math.random() > (topicDifficulty === 'Easy' ? 0.7 : topicDifficulty === 'Medium' ? 0.5 : 0.3)) {
          setAiScore(s => s + 1);
        }
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [mode, practiceSubMode, selectedOption, topicDifficulty]);

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Module Missing</h1>
          <button onClick={() => router.back()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20">Back to Curriculum</button>
        </div>
      </div>
    );
  }

  const handleAnswer = async (option: string) => {
    if (selectedOption || !randomizedLevels[currentLevel]) return;
    setSelectedOption(option);
    const correct = option === randomizedLevels[currentLevel].answer;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
      await updateXP(10);
    } else {
      await updateHearts(-1);
    }

    setTimeout(() => {
      if (currentLevel < randomizedLevels.length - 1) {
        setCurrentLevel(curr => curr + 1);
        setSelectedOption(null);
        setIsCorrect(null);
        setHiddenOptions([]);
      } else {
        completeTopic(id);
        setMode('result');
      }
    }, 1500);
  };

  const useHint = async () => {
    if (selectedOption || hiddenOptions.length >= 2) return;
    const success = await usePerk('hints');
    if (success) {
      const currentQ = randomizedLevels[currentLevel];
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
      await updateHearts(5 - (user?.hearts || 0));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <header className="bg-white p-6 shadow-xl shadow-slate-200/30 flex items-center gap-6 border-b border-slate-200 sticky top-0 z-20">
        <button onClick={() => router.push('/learn')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all active:scale-90">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">{topic.title}</h2>
            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${topic.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : topic.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              {topic.difficulty}_LEVEL
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {mode === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-[3rem] p-12 text-center shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
                <BookOpen className="w-16 h-16 mx-auto mb-6 text-blue-600 shadow-xl shadow-blue-100 p-3 bg-blue-50 rounded-2xl" />
                <h1 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight italic">{topic.title}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{topic.description}</p>
              </div>

              {practiceSubMode === 'none' ? (
                <div className="grid gap-6">
                  <button onClick={() => setMode('learn')} className="bg-white border-2 border-slate-200 p-8 rounded-[2rem] shadow-sm hover:border-blue-500 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><ShieldCheck className="w-8 h-8" /></div>
                      <div className="text-left">
                        <span className="text-xl font-black text-slate-900 uppercase tracking-tight italic block">Study the Rules</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Read formulas &amp; see clear examples</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>

                  <button onClick={() => setPracticeSubMode('self')} className="bg-white border-2 border-slate-200 p-8 rounded-[2rem] shadow-sm hover:border-emerald-500 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Sparkles className="w-8 h-8" /></div>
                      <div className="text-left">
                        <span className="text-xl font-black text-slate-900 uppercase tracking-tight italic block">Practice Quiz</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Answer questions &amp; test yourself</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                      <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic">Select Practice Mode</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Choose your training environment</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setMode('practice'); setPracticeSubMode('self'); }}
                      className="p-6 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-center group"
                    >
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Activity className="w-8 h-8 text-emerald-600" />
                      </div>
                      <span className="text-lg font-black text-slate-900 uppercase block">Self Practice</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Normal Training</span>
                    </button>

                    <button 
                      onClick={() => setShowAIWarning(true)}
                      className="p-6 rounded-3xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50/30 transition-all text-center group relative overflow-hidden"
                    >
                      <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-8 h-8 text-rose-600" />
                      </div>
                      <span className="text-lg font-black text-slate-900 uppercase block">Match with AI</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Competitive Mode</span>
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-600 text-white text-[7px] font-black rounded-full">HARD</div>
                    </button>
                  </div>

                  <button onClick={() => setPracticeSubMode('none')} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">
                    Cancel Selection
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {showAIWarning && (
              <motion.div key="ai-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl space-y-6">
                  <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto">
                    <Activity className="w-10 h-10 text-rose-600 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Tactical Warning</h2>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                      AI matches are designed for <span className="text-rose-600 font-black uppercase">Maximum Difficulty</span>. High accuracy and speed are required to win.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => { setShowAIWarning(false); setMode('practice'); setPracticeSubMode('ai'); setAiScore(0); }}
                      className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-xs"
                    >
                      Initiate Protocol
                    </button>
                    <button 
                      onClick={() => setShowAIWarning(false)}
                      className="w-full text-slate-400 font-black py-2 uppercase tracking-widest text-[10px]"
                    >
                      Fall Back
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'learn' && (
            <motion.div key="learn" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Key Concepts</h3>
                </div>
                <button
                  id="download-pdf-btn"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                  title="Save as PDF"
                >
                  <Download className="w-4 h-4" /> Save PDF
                </button>
              </div>
              <div className="space-y-6 print-content">
                {topic.formulas.map((f: any, i: number) => (
                  <div key={i} className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200 group hover:border-blue-300 transition-all">
                    <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-widest mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">{f.name}</div>
                    <p className="font-bold text-slate-800 mb-6 text-lg tracking-tight leading-relaxed">{f.formula}</p>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm relative">
                      <Sparkles className="w-4 h-4 text-amber-400 absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm" />
                      <span className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] block mb-2">Example</span>
                      <span className="text-slate-600 font-medium">{f.example}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setMode('intro'); setPracticeSubMode('self'); }} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs no-print">
                Start Practice Quiz
              </button>
            </motion.div>
          )}

          {mode === 'practice' && (
            <motion.div key="practice" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  <span className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Sequence {currentLevel + 1} OF {randomizedLevels.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-blue-50 px-5 py-2 rounded-2xl border border-blue-100 shadow-sm">
                    <Star className="w-4 h-4 text-blue-600 fill-current" />
                    <span className="font-black text-blue-700 text-sm">YOU: {score}</span>
                  </div>
                  {practiceSubMode === 'ai' && (
                    <div className="flex items-center gap-2 bg-rose-50 px-5 py-2 rounded-2xl border border-rose-100 shadow-sm">
                      <Activity className="w-4 h-4 text-rose-600" />
                      <span className="font-black text-rose-700 text-sm">AI: {aiScore}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={useHint}
                  disabled={!!selectedOption || (user?.perks?.hints || 0) <= 0}
                  className="bg-white border-2 border-slate-200 rounded-[1.5rem] p-5 flex items-center justify-center gap-4 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/5 transition-all disabled:opacity-30 group active:scale-95 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 transition-transform group-hover:scale-110">
                    <Lightbulb className="w-6 h-6 fill-current" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hint Protocol</p>
                    <p className="text-base font-black text-slate-900 leading-none">Units: {user?.perks?.hints || 0}</p>
                  </div>
                </button>
                <button
                  onClick={useRefill}
                  disabled={(user?.perks?.refills || 0) <= 0 || (user?.hearts || 0) === 5}
                  className="bg-white border-2 border-slate-200 rounded-[1.5rem] p-5 flex items-center justify-center gap-4 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all disabled:opacity-30 group active:scale-95 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 transition-transform group-hover:scale-110">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Life Support</p>
                    <p className="text-base font-black text-slate-900 leading-none">Units: {user?.perks?.refills || 0}</p>
                  </div>
                </button>
              </div>

              <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-slate-200/50 border border-slate-200 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-12 tracking-tight italic uppercase leading-tight">{randomizedLevels[currentLevel].question}</h3>

                <div className="grid gap-4">
                  {randomizedLevels[currentLevel].options.map((opt: string) => {
                    const isHidden = hiddenOptions.includes(randomizedLevels[currentLevel].options.indexOf(opt));
                    if (isHidden) return null;

                    let bg = 'bg-white border-slate-200 text-slate-900 hover:border-blue-500 hover:shadow-xl hover:shadow-slate-200/40';
                    if (selectedOption === opt) {
                      bg = isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-4 ring-emerald-500/10 scale-[1.02] z-10' : 'bg-rose-50 border-rose-500 text-rose-800 ring-4 ring-rose-500/10 scale-[1.02] z-10';
                    } else if (selectedOption && opt === randomizedLevels[currentLevel].answer) {
                      bg = 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-4 ring-emerald-500/10 scale-[1.02] z-10';
                    } else if (selectedOption) {
                      bg = 'bg-white border-slate-100 text-slate-300 opacity-40 grayscale';
                    }

                    return (
                      <motion.button
                        key={`${opt}-${randomizedLevels[currentLevel].options.indexOf(opt)}`}
                        layout
                        onClick={() => handleAnswer(opt)}
                        disabled={!!selectedOption || isHidden}
                        className={`w-full py-6 px-10 rounded-[2rem] border-2 font-black transition-all text-lg flex justify-between items-center group relative ${bg}`}
                      >
                        <div className="flex items-center gap-8">
                          <span className={`w-10 h-10 flex items-center justify-center rounded-2xl text-base font-black transition-colors ${selectedOption === opt ? (isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : (selectedOption && opt === randomizedLevels[currentLevel].answer ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white')}`}>
                            {String.fromCharCode(65 + randomizedLevels[currentLevel].options.indexOf(opt))}
                          </span>
                          <span className="uppercase tracking-tight leading-none">{opt}</span>
                        </div>
                        {selectedOption === opt && (isCorrect ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <XCircle className="w-8 h-8 text-rose-600" />)}
                        {selectedOption && opt === randomizedLevels[currentLevel].answer && opt !== selectedOption && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedOption && (
                    <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-10 flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs p-5 rounded-[2rem] border-2 shadow-xl ${isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50' : 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50'}`}>
                      {isCorrect ? <Sparkles className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      {isCorrect ? '✓ Correct! +10 XP Earned' : '✗ Wrong Answer — You lost a heart'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {mode === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 pt-10">
              <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto border-4 shadow-2xl transition-transform duration-500 group hover:rotate-12 ${practiceSubMode === 'ai' ? (score > aiScore ? 'bg-emerald-50 border-emerald-100 shadow-emerald-100/50' : 'bg-rose-50 border-rose-100 shadow-rose-100/50') : 'bg-blue-50 border-blue-100 shadow-blue-100/50'}`}>
                {practiceSubMode === 'ai' ? (
                  score > aiScore ? <Trophy className="w-16 h-16 text-emerald-600" /> : <XCircle className="w-16 h-16 text-rose-600" />
                ) : (
                  <Trophy className="w-16 h-16 text-blue-600" />
                )}
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
                  {practiceSubMode === 'ai' ? (score > aiScore ? '🏆 Victory!' : '💀 Defeated') : 'Module Finalized'}
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Academic Evaluation Summary</p>
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xl font-black italic">
                      {score} / {randomizedLevels.length} NODES
                    </div>
                    {practiceSubMode === 'ai' && (
                      <div className="bg-rose-600 text-white px-8 py-3 rounded-2xl text-xl font-black italic">
                        AI: {aiScore}
                      </div>
                    )}
                  </div>
                  {practiceSubMode === 'ai' && score > aiScore && <p className="text-emerald-600 font-black uppercase tracking-widest text-xs mt-2">+20 Bonus XP Earned</p>}
                </div>
              </div>
              <button 
                onClick={() => { setMode('intro'); setPracticeSubMode('none'); setScore(0); setAiScore(0); setCurrentLevel(0); }}
                className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-black text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs"
              >
                Back to Lessons <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
