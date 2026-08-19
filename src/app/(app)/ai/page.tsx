'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MessageSquareText, FileText, Sparkles, Key, CheckCircle2, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { getStoredApiKey } from '@/lib/gemini';
import ApiKeyModal from '@/components/ai/ApiKeyModal';

export default function AiDashboardPage() {
  const router = useRouter();
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const refreshKeyState = () => {
    const key = getStoredApiKey();
    const exists = Boolean(key && key.trim().length > 5);
    setHasCustomKey(exists);
    return exists;
  };

  useEffect(() => {
    refreshKeyState();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-32">
      {/* Top Banner / Hero */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
        
        {/* Header Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Managed AI Service
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {hasCustomKey ? 'Custom Key Connected' : 'AI Pool Ready'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Al Imran AI Assistant
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Your personalized English tenses tutor and automated exam note generator.
            </p>
          </div>

          {/* Key Settings Button */}
          <button
            id="manage-api-key-btn"
            onClick={() => setKeyModalOpen(true)}
            className="self-start sm:self-center inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm transition-all text-xs tracking-wider uppercase active:scale-95"
          >
            <Key className="w-4 h-4 text-blue-600" />
            <span>{hasCustomKey ? 'Manage Custom Key' : 'Connect Personal Key'}</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Option 1: Chat with AI */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-[2.5rem] p-8 border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-6 relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <MessageSquareText className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-black uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5" />
                  Instant Q&amp;A
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Chat with AI
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Ask any question regarding English tenses, grammar rules, active/passive voice, sentence formulas, or exam queries. Get simple, student-friendly answers in Hinglish/Roman Urdu.
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Simple formula and rule breakdowns</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Correct vs. Incorrect practical examples</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Exam preparation and error correction</span>
                </div>
              </div>
            </div>

            <div className="pt-8 relative z-10">
              <button
                id="open-ai-chat-btn"
                onClick={() => router.push('/ai/chat')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-98"
              >
                <span>Launch AI Chat</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>

          {/* Option 2: Generate Notes with AI */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-[2.5rem] p-8 border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-6 relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <FileText className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  Multimodal Vision
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Generate Notes with AI
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Upload photos of textbook questions or past papers. AI inspects the question, prevents duplicate text, and renders crisp, downloadable high-res note cards.
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Single or Bulk question image upload</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Strict 2-Mark Short &amp; 6-Mark Long question modes</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Export high-resolution printable PNG notes</span>
                </div>
              </div>
            </div>

            <div className="pt-8 relative z-10">
              <button
                id="open-ai-notes-btn"
                onClick={() => router.push('/ai/notes')}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-98"
              >
                <span>Open Note Generator</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Safety & Educational Footnote */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Secure AI Infrastructure</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Automatic API failover &amp; server-side pool management ensures uninterrupted access.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Al Imran Tenses Learner</span>
          </div>
        </div>

      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => {
          setKeyModalOpen(false);
          refreshKeyState();
        }}
        onSuccess={() => {
          refreshKeyState();
        }}
      />
    </div>
  );
}
