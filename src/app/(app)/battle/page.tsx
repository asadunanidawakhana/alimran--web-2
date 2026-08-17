'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ChevronLeft, Zap, Bot, Search, Trophy, CheckCircle2, XCircle, Shield, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { supabase } from '@/lib/supabase';
import { getAdaptiveQuestions } from '@/lib/questions';
import { showToast } from '@/components/ToastNotification';
import { requestNotificationPermission, sendMatchNotification } from '@/lib/notifications';

type Stage = 'lobby' | 'searching' | 'battle' | 'result';

const AI_OPPONENT = {
  id: 'ai-bot',
  username: 'A.I. Nemesis',
  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=nemesis&backgroundColor=1e40af',
  level: 5,
};

export default function BattlePage() {
  const router = useRouter();
  const { user, updateXP, updateCoins } = useGameStore();

  const [stage, setStage] = useState<Stage>('lobby');
  const [opponent, setOpponent] = useState<any>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [aiWarning, setAiWarning] = useState(false);
  const [winner, setWinner] = useState<'me' | 'opponent' | 'draw' | null>(null);

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const battleChannel = useRef<any>(null);
  const inviteChannelRef = useRef<any>(null);
  const myScoreRef = useRef(0); // always up-to-date score for broadcasting
  const oppScoreRef = useRef(0);
  const stageRef = useRef<Stage>('lobby');

  // Keep refs in sync
  useEffect(() => { myScoreRef.current = myScore; }, [myScore]);
  useEffect(() => { oppScoreRef.current = oppScore; }, [oppScore]);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // ── Cleanup on unmount & page close ────────────────────────────
  useEffect(() => {
    const cleanupQueue = () => {
      if (!user?.id) return;
      
      // 1. Regular database call
      supabase.from('battle_queue').delete().eq('user_id', user.id).then();

      // 2. Keepalive fetch fallback (works even on tab close/unload)
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/battle_queue?user_id=eq.${user.id}`;
      fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        },
        keepalive: true,
      }).catch(() => {});
    };

    // Clean up when tab/browser is closed
    window.addEventListener('beforeunload', cleanupQueue);

    return () => {
      searchTimer.current && clearTimeout(searchTimer.current);
      cleanupQueue();
      if (battleChannel.current) supabase.removeChannel(battleChannel.current);
      if (inviteChannelRef.current) supabase.removeChannel(inviteChannelRef.current);
      window.removeEventListener('beforeunload', cleanupQueue);
    };
  }, [user?.id]);

  // ── Auto-transition to AI battle after warning ─────────
  useEffect(() => {
    if (aiWarning) {
      const t = setTimeout(() => {
        launchAIBattle();
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [aiWarning]);

  // ── Question timer ────────────────────────────────
  useEffect(() => {
    if (stage !== 'battle' || isAnswered) return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, timeLeft, isAnswered]);

  // ── AI auto-answer (simulated) ────────────────────
  useEffect(() => {
    if (stage !== 'battle' || opponent?.id !== 'ai-bot') return;
    const interval = setInterval(() => {
      if (Math.random() > 0.35) {
        setOppScore(s => Math.min(s + 1, questions.length));
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [stage, opponent?.id, questions.length]);

  // ── Broadcast score helper ────────────────────────
  const broadcastScore = useCallback((score: number) => {
    if (battleChannel.current && opponent?.id !== 'ai-bot') {
      battleChannel.current.send({
        type: 'broadcast',
        event: 'score-update',
        payload: { userId: user?.id, score },
      });
    }
  }, [opponent?.id, user?.id]);

  // ── Create realtime channel and THEN launch battle ─
  const launchBattle = useCallback((bId: string, opp: any, questionsData: any[]) => {
    searchTimer.current && clearTimeout(searchTimer.current);

    // Remove existing channel first
    if (battleChannel.current) {
      supabase.removeChannel(battleChannel.current);
      battleChannel.current = null;
    }

    const channelName = `battle-room-${bId}`;
    const channel = supabase.channel(channelName, { config: { broadcast: { self: false } } });

    channel
      .on('broadcast', { event: 'score-update' }, (payload: any) => {
        // Only update opponent score if the sender is NOT us
        if (payload.payload?.userId !== user?.id) {
          setOppScore(payload.payload?.score ?? 0);
          oppScoreRef.current = payload.payload?.score ?? 0;
        }
      })
      .on('broadcast', { event: 'battle-finished' }, (payload: any) => {
        if (payload.payload?.userId !== user?.id) {
          setOppScore(payload.payload?.score ?? 0);
          oppScoreRef.current = payload.payload?.score ?? 0;
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          battleChannel.current = channel;
          // Now that channel is ready, enter battle
          setQuestions(questionsData);
          setStage('battle');
          setMyScore(0);
          setOppScore(0);
          myScoreRef.current = 0;
          oppScoreRef.current = 0;
          setQIndex(0);
          setTimeLeft(20);
          showToast({ type: 'success', title: 'Match found!', message: `vs ${opp.username}` });
        }
      });
  }, [user?.id]);

  // ── Start search ──────────────────────────────────
  const startSearch = async () => {
    if (!user) return;
    setStage('searching');

    // Notify other users via the notification system
    sendMatchNotification(user.username);

    await supabase.from('battle_queue').upsert({ user_id: user.id }, { onConflict: 'user_id' });

    // Cleanup existing invite channel if any
    if (inviteChannelRef.current) {
      supabase.removeChannel(inviteChannelRef.current);
      inviteChannelRef.current = null;
    }

    const timeLimit = new Date(Date.now() - 20000).toISOString(); // 20 seconds ago
    const { data: queue } = await supabase
      .from('battle_queue')
      .select('*')
      .neq('user_id', user.id)
      .gt('joined_at', timeLimit) // Only match active searchers
      .order('joined_at', { ascending: true })
      .limit(1);

    if (queue && queue.length > 0) {
      await startRealBattle(queue[0].user_id);
    } else {
      searchTimer.current = setTimeout(() => {
        setAiWarning(true);
      }, 15000);

      const channel = supabase.channel(`battle-invite-${user.id}-${Date.now()}`);
      inviteChannelRef.current = channel;

      channel
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'battles',
          filter: `player2_id=eq.${user.id}`,
        }, async (payload: any) => {
          searchTimer.current && clearTimeout(searchTimer.current);
          setAiWarning(false);
          const battle = payload.new;
          const { data: opp } = await supabase.from('users').select('id,username,avatar_url,level').eq('id', battle.player1_id).single();
          setBattleId(battle.id);
          setOpponent(opp);
          await supabase.from('battle_queue').delete().eq('user_id', user.id);
          const qs = getAdaptiveQuestions('Random', 10);
          launchBattle(battle.id, opp, qs);
        })
        .subscribe();
    }
  };

  const startRealBattle = async (opponentId: string) => {
    if (!user) return;
    searchTimer.current && clearTimeout(searchTimer.current);

    const { data: opp } = await supabase.from('users').select('id,username,avatar_url,level').eq('id', opponentId).single();
    const { data: battle } = await supabase.from('battles').insert({
      player1_id: user.id, player2_id: opponentId, status: 'active',
    }).select().single();

    if (battle) {
      await supabase.from('battle_queue').delete().in('user_id', [user.id, opponentId]);
      setBattleId(battle.id);
      setOpponent(opp);
      const qs = getAdaptiveQuestions('Random', 10);
      launchBattle(battle.id, opp, qs);
    }
  };

  const launchAIBattle = async () => {
    searchTimer.current && clearTimeout(searchTimer.current);
    if (user?.id) await supabase.from('battle_queue').delete().eq('user_id', user.id);

    setOpponent(AI_OPPONENT);
    const qs = getAdaptiveQuestions('Random', 10);
    setQuestions(qs);
    setStage('battle');
    setMyScore(0);
    setOppScore(0);
    myScoreRef.current = 0;
    oppScoreRef.current = 0;
    setQIndex(0);
    setTimeLeft(20);
    showToast({ type: 'success', title: 'Initiating Protocol', message: 'Matched with A.I. Nemesis!' });
  };

  const handleAnswer = (option: string | null) => {
    if (isAnswered) return;
    setSelected(option);
    setIsAnswered(true);

    const correct = option && option === questions[qIndex]?.answer;
    let newScore = myScoreRef.current;
    if (correct) {
      newScore = newScore + 1;
      setMyScore(newScore);
      myScoreRef.current = newScore;
    }

    // Broadcast updated score immediately
    broadcastScore(newScore);

    setTimeout(() => {
      if (qIndex < questions.length - 1) {
        setQIndex(i => i + 1);
        setSelected(null);
        setIsAnswered(false);
        setTimeLeft(20);
      } else {
        finishBattle(newScore);
      }
    }, 1500);
  };

  const finishBattle = async (finalMy: number) => {
    // Broadcast final score
    if (battleChannel.current) {
      battleChannel.current.send({
        type: 'broadcast',
        event: 'battle-finished',
        payload: { userId: user?.id, score: finalMy },
      });
    }

    // Wait a moment for opponent's final score to arrive
    setTimeout(async () => {
      const finalOpp = oppScoreRef.current;
      let w: 'me' | 'opponent' | 'draw';
      if (finalMy > finalOpp) { w = 'me'; updateXP(50); updateCoins(30); }
      else if (finalOpp > finalMy) { w = 'opponent'; }
      else { w = 'draw'; updateXP(20); updateCoins(10); }

      setWinner(w);
      setStage('result');

      if (battleId && user && opponent) {
        await supabase.from('battles').update({
          player1_score: user.id === opponent?.id ? finalOpp : finalMy,
          player2_score: user.id === opponent?.id ? finalMy : finalOpp,
          status: 'finished',
          finished_at: new Date().toISOString(),
          winner_id: w === 'me' ? user.id : (w === 'opponent' ? opponent?.id : null),
        }).eq('id', battleId);
      }

      // Cleanup channel
      if (battleChannel.current) {
        supabase.removeChannel(battleChannel.current);
        battleChannel.current = null;
      }
    }, 1500);
  };

  const currentQ = questions[qIndex];

  // ── RENDER: LOBBY ─────────────────────────────────
  if (stage === 'lobby') return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-8 left-8">
        <button onClick={() => router.push('/home')} className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-blue-600 transition-all shadow-sm text-sm font-bold uppercase tracking-widest">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-xl w-full space-y-10">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-600/30">
            <Swords className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase italic">Elite <span className="text-blue-600">Arena</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Challenge a player or face the A.I.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Questions</p>
            <p className="text-2xl font-black text-slate-900">10</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <Zap className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Win Reward</p>
            <p className="text-2xl font-black text-emerald-600">+50XP</p>
          </div>
        </div>

        <button id="find-match-btn" onClick={startSearch} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-600/30 transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3">
          <Search className="w-5 h-5" /> Find Match
        </button>
      </motion.div>
    </div>
  );

  // ── RENDER: SEARCHING ─────────────────────────────
  if (stage === 'searching') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse" />
      </div>

      <AnimatePresence>
        {aiWarning && (
          <motion.div key="ai-warning-modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl space-y-6">
              <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                <Bot className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No Players Found</h2>
              <p className="text-slate-500 font-medium">Switching to <span className="font-black text-blue-600">A.I. Nemesis</span> battle mode...</p>
              <div className="flex gap-1.5 justify-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full max-w-4xl relative z-10 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            <Activity className="w-3 h-3" /> Matchmaking Active
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase italic">Elite <span className="text-blue-600">Arena</span></h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Scanning global network...</p>
        </div>

        <div className="flex items-center justify-center gap-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-[2rem] bg-white border-4 border-blue-200 overflow-hidden shadow-xl">
              <img src={user?.avatar_url || ''} className="w-full h-full object-cover" />
            </div>
            <p className="font-black text-slate-900 uppercase tracking-tight">{user?.username}</p>
            <div className="px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black rounded-full tracking-widest">READY</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Swords className="w-10 h-10 text-slate-300" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">VS</span>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-[2rem] bg-slate-100 border-4 border-dashed border-slate-200 flex items-center justify-center shadow-inner">
              <Search className="w-10 h-10 text-slate-300 animate-pulse" />
            </div>
            <p className="font-black text-slate-300 uppercase tracking-tight">???</p>
            <div className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full tracking-widest">LOCATING</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            id="ai-battle-btn"
            onClick={launchAIBattle}
            className="w-full max-w-xs bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-slate-900/30 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 group"
          >
            <Bot className="w-5 h-5 transition-transform group-hover:scale-110" />
            Initiate A.I. Protocol
          </button>

          <button
            onClick={() => { searchTimer.current && clearTimeout(searchTimer.current); setStage('lobby'); }}
            className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Abort Mission
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ── RENDER: RESULT ────────────────────────────────
  if (stage === 'result') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-2xl border border-slate-200 space-y-8">
        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl ${winner === 'me' ? 'bg-amber-50 border-4 border-amber-200' : winner === 'draw' ? 'bg-blue-50 border-4 border-blue-200' : 'bg-rose-50 border-4 border-rose-200'}`}>
          <Trophy className={`w-12 h-12 ${winner === 'me' ? 'text-amber-500' : winner === 'draw' ? 'text-blue-500' : 'text-rose-400'}`} />
        </div>

        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight italic">
            {winner === 'me' ? '🏆 Victory!' : winner === 'draw' ? '🤝 Draw' : '💀 Defeated'}
          </h2>
          {winner === 'me' && <p className="text-emerald-600 font-black uppercase tracking-widest text-sm mt-2">+50 XP • +30 Coins</p>}
          {winner === 'draw' && <p className="text-blue-600 font-black uppercase tracking-widest text-sm mt-2">+20 XP • +10 Coins</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Score</p>
            <p className="text-4xl font-black text-slate-900">{myScore}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{opponent?.username}</p>
            <p className="text-4xl font-black text-slate-900">{oppScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setStage('lobby'); setMyScore(0); setOppScore(0); myScoreRef.current = 0; oppScoreRef.current = 0; setQIndex(0); setWinner(null); setOpponent(null); setBattleId(null); }}
            className="py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95">
            Play Again
          </button>
          <button onClick={() => router.push('/home')}
            className="py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm uppercase tracking-widest transition-all active:scale-95">
            Exit
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ── RENDER: BATTLE ────────────────────────────────
  if (stage === 'battle') {
    if (!currentQ) return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
          {/* Scoreboard */}
          <div className="bg-white rounded-[2rem] p-4 border border-slate-200 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-blue-200">
                <img src={user?.avatar_url || ''} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase">{user?.username}</p>
                <p className="text-2xl font-black text-blue-600">{myScore}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Q {qIndex + 1}/{questions.length}</p>
              <div className={`text-2xl font-black tabular-nums ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>{timeLeft}s</div>
              <div className="h-1 w-16 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(timeLeft / 20) * 100}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-row-reverse">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-rose-200">
                <img src={opponent?.avatar_url || ''} className="w-full h-full object-cover" />
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 uppercase">{opponent?.username}</p>
                <p className="text-2xl font-black text-rose-500">{oppScore}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < qIndex ? 'bg-blue-600' : i === qIndex ? 'bg-blue-300 animate-pulse' : 'bg-slate-100'}`} />
            ))}
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div key={qIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight italic uppercase leading-tight">{currentQ.text}</h2>
            </motion.div>
          </AnimatePresence>

          {/* Options */}
          <div className="grid gap-3">
            {currentQ.options.map((opt: string) => {
              const optIndex = currentQ.options.indexOf(opt);
              let cls = 'bg-white border-slate-200 text-slate-900 hover:border-blue-400 hover:shadow-lg';
              if (isAnswered) {
                if (opt === currentQ.answer) cls = 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-4 ring-emerald-500/10';
                else if (opt === selected) cls = 'bg-rose-50 border-rose-500 text-rose-800 ring-4 ring-rose-500/10';
                else cls = 'bg-white border-slate-100 text-slate-300 opacity-40';
              }
              return (
                <motion.button key={opt} layout onClick={() => handleAnswer(opt)} disabled={isAnswered}
                  className={`w-full py-5 px-8 rounded-[1.5rem] border-2 font-black transition-all text-lg flex justify-between items-center ${cls}`}>
                  <div className="flex items-center gap-6">
                    <span className={`w-9 h-9 rounded-xl text-sm font-black flex items-center justify-center transition-colors ${isAnswered && opt === currentQ.answer ? 'bg-emerald-600 text-white' : isAnswered && opt === selected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className="uppercase tracking-tight">{opt}</span>
                  </div>
                  {isAnswered && opt === currentQ.answer && <CheckCircle2 className="w-7 h-7 text-emerald-600" />}
                  {isAnswered && opt === selected && opt !== currentQ.answer && <XCircle className="w-7 h-7 text-rose-600" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
