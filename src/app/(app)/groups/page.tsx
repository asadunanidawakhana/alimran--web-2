'use client';
import { useState, useEffect } from 'react';
import { Users, Lock, ChevronRight, Search, Shield, ChevronLeft, ArrowRight, UserPlus, Sparkles, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';

export default function GroupsPage() {
  const router = useRouter();
  const { user } = useGameStore();
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [step, setStep] = useState<'section' | 'section-auth' | 'batches' | 'batch-auth'>('section');
  const [selectedSection, setSelectedSection] = useState<'boys' | 'girls' | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
      if (data) setBatches(data);
      setIsLoading(false);
    };
    fetchBatches();

    const sub = supabase.channel('groups-list').on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, fetchBatches).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleSectionAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const settingKey = selectedSection === 'boys' ? 'boys_section_password' : 'girls_section_password';
    const { data: settingData } = await supabase.from('site_settings').select('value').eq('id', settingKey).single();

    const validPassword = settingData?.value || (selectedSection === 'boys' ? 'boys123' : 'girls123');

    if (password === validPassword) {
      setPassword('');
      setStep('batches');
    } else {
      setError('Invalid access key. Please try again.');
    }
  };

  const handleBatchAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !user) return;

    setJoining(true);
    setError('');

    if (password !== selectedBatch.password) {
      setError('Incorrect password for this group.');
      setJoining(false);
      return;
    }

    try {
      const anonName = `Student_${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase.from('group_members').insert({
        group_id: selectedBatch.id,
        user_id: user.id,
        anonymous_name: anonName
      });
      router.push(`/groups/${selectedBatch.id}`);
    } catch (err) {
      setError('Failed to join group. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const filteredBatches = batches.filter(b => b.group_type === selectedSection);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-12">
        
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Study <span className="text-blue-600">Groups</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select your group and ask only study-related questions</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 'section' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="section"
              className="grid sm:grid-cols-2 gap-8"
            >
              {[
                { id: 'boys' as const, label: 'Boys Group', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { id: 'girls' as const, label: 'Girls Group', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => { setSelectedSection(section.id); setStep('section-auth'); setPassword(''); setError(''); }}
                  className="bg-white border-2 border-slate-200 p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-8 transition-all hover:border-blue-500 hover:shadow-2xl hover:shadow-slate-200/50 group active:scale-[0.98]"
                >
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${section.bg} ${section.color} transition-transform group-hover:scale-110 shadow-lg shadow-slate-100`}>
                    <section.icon className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{section.label}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] group-hover:text-blue-500 transition-colors">Password Required to Enter</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 'section-auth' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key="section-auth"
              className="w-full max-w-md mx-auto bg-white rounded-[3rem] p-10 md:p-14 border border-slate-200 shadow-2xl shadow-slate-200/50 text-center relative"
            >
              <button onClick={() => { setStep('section'); setPassword(''); setError(''); }} className="absolute top-8 left-8 p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl ${selectedSection === 'boys' ? 'bg-blue-50 text-blue-600 shadow-blue-100' : 'bg-rose-50 text-rose-600 shadow-rose-100'}`}>
                <Lock className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase italic">{selectedSection === 'boys' ? 'Boys Group' : 'Girls Group'}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Enter Section Password</p>

              <form onSubmit={handleSectionAuth} className="space-y-6">
                <div>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center font-black tracking-[0.3em] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-300"
                    autoFocus
                  />
                  {error && <p className="text-rose-500 text-[10px] font-black mt-3 uppercase tracking-widest">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={password.length === 0}
                  className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 uppercase tracking-[0.2em] text-xs ${selectedSection === 'boys' ? 'bg-blue-600 hover:bg-black shadow-blue-600/20' : 'bg-rose-600 hover:bg-black shadow-rose-600/20'}`}
                >
                  Enter Group <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {step === 'batches' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="batches"
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => { setStep('section'); setSelectedSection(null); }}
                  className="flex items-center gap-3 text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" /> All Groups
                </button>
                <div className="flex items-center gap-3">
                  <Activity className={`w-4 h-4 ${selectedSection === 'boys' ? 'text-blue-500' : 'text-rose-500'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border-2 ${selectedSection === 'boys' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                    {selectedSection === 'boys' ? 'Boys Batches' : 'Girls Batches'}
                  </span>
                </div>
              </div>

              <div className="grid gap-6">
                {filteredBatches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => { setSelectedBatch(batch); setStep('batch-auth'); setPassword(''); setError(''); }}
                    className="w-full bg-white p-8 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:border-blue-500 hover:shadow-2xl hover:shadow-slate-200/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${batch.group_type === 'boys' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">{batch.name}</h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <UserPlus className="w-3.5 h-3.5" />
                          Click to Join Batch
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}

                {filteredBatches.length === 0 && (
                  <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Groups Available</h3>
                    <p className="text-slate-400 text-sm font-medium mt-2">No active batches in this section yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'batch-auth' && selectedBatch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key="batch-auth"
              className="w-full max-w-md mx-auto bg-white rounded-[3rem] p-10 md:p-14 border border-slate-200 shadow-2xl shadow-slate-200/50 text-center relative"
            >
              <button onClick={() => { setStep('batches'); setPassword(''); setError(''); }} className="absolute top-8 left-8 p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl ${selectedBatch.group_type === 'boys' ? 'bg-blue-50 text-blue-600 shadow-blue-100' : 'bg-rose-50 text-rose-600 shadow-rose-100'}`}>
                <Lock className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase italic">{selectedBatch.name}</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">Enter Group Password</p>

              <form onSubmit={handleBatchAuth} className="space-y-6">
                <div>
                  <input
                    type="password"
                    placeholder="Enter batch password..."
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center font-black tracking-[0.3em] focus:border-blue-500 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-300"
                    autoFocus
                  />
                  {error && <p className="text-rose-500 text-[10px] font-black mt-3 uppercase tracking-widest">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={password.length === 0 || joining}
                  className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-30 uppercase tracking-[0.2em] text-xs ${selectedBatch.group_type === 'boys' ? 'bg-blue-600 hover:bg-black shadow-blue-600/20' : 'bg-rose-600 hover:bg-black shadow-rose-600/20'}`}
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
