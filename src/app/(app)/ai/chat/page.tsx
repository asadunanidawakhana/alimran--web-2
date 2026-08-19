'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Send,
  Sparkles,
  User as UserIcon,
  Trash2,
  Key,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Atom,
  Calculator,
  FlaskConical,
  Laptop,
  Dna,
  Landmark,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { getStoredApiKey, sendChatMessage, ChatMessage, SubjectType } from '@/lib/gemini';
import { useGameStore } from '@/store/gameStore';
import { showToast } from '@/components/ToastNotification';
import ApiKeyModal from '@/components/ai/ApiKeyModal';

const SUBJECTS: { type: SubjectType; title: string; desc: string; icon: any; color: string; bg: string; border: string }[] = [
  {
    type: 'English Grammar',
    title: 'English Grammar',
    desc: 'Tenses, sentence structures, active/passive voice, direct/indirect, exam tips.',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    type: 'Physics',
    title: 'Physics',
    desc: 'Concepts, formulas, SI units, derivations, step-by-step numerical problems.',
    icon: Atom,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    type: 'Mathematics',
    title: 'Mathematics',
    desc: 'Algebra, geometry, trigonometry, equations, step-by-step solutions.',
    icon: Calculator,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    type: 'Chemistry',
    title: 'Chemistry',
    desc: 'Reactions, equations, periodic table, definitions, chemical stoichiometry.',
    icon: FlaskConical,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    type: 'Computer',
    title: 'Computer',
    desc: 'Hardware, software, OS, programming basics, databases, networks & IT concepts.',
    icon: Laptop,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  {
    type: 'Biology',
    title: 'Biology',
    desc: 'Cell biology, human systems, genetics, plants, animals, processes & diagrams.',
    icon: Dna,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    type: 'Mutala Pakistan',
    title: 'Mutala Pakistan',
    desc: 'Pakistan Studies, Pakistan Movement, personalities, history, geography & constitution.',
    icon: Landmark,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
];

const SUGGESTIONS_MAP: Record<SubjectType, string[]> = {
  'English Grammar': [
    'Present Perfect vs Past Simple ka difference samjha dein?',
    'Active voice se Passive voice convert karne ke rules?',
    '"Since" aur "For" kab use karte hain?',
    'Direct and Indirect speech ke basic rules?',
  ],
  'Physics': [
    'Newton ke laws of motion simple Hinglish mein explain karein',
    'Velocity aur Acceleration mein kya difference hai?',
    'Ohm\'s Law ka formula aur numerical solve karne ka tareeqa?',
    'Kinetic Energy vs Potential Energy ka concept?',
  ],
  'Mathematics': [
    'Quadratic formula se equation solve karne ke steps?',
    'Pythagoras theorem ko simple example ke sath samjhayein',
    'Trigonometry ke sin, cos, tan ke basic formulas?',
    'Simultaneous equations solve karne ka easy method?',
  ],
  'Chemistry': [
    'Ionic aur Covalent bond mein kya farq hai?',
    'Chemical equations balance karne ka easy method?',
    'Boyle\'s Law aur Charles\'s Law explain karein',
    'Periodic table ke groups aur periods ka concept?',
  ],
  'Computer': [
    'RAM aur ROM mein main difference kya hai?',
    'Operating System ka role aur types explain karein',
    'Compiler aur Interpreter mein kya farq hota hai?',
    'Computer networks (LAN, WAN) simple words mein samjhayein',
  ],
  'Biology': [
    'Photosynthesis ka process simple steps mein explain karein',
    'Plant cell aur Animal cell mein main differences?',
    'Mitosis aur Meiosis mein kya farq hota hai?',
    'DNA ka basic structure aur function kya hai?',
  ],
  'Mutala Pakistan': [
    'Two-Nation Theory (Do Qomi Nazriya) ka basic concept?',
    'Lahore Resolution 1940 ke key points kya thay?',
    'Pakistan ke important geographical features aur borders?',
    'Quaid-e-Azam ke 14 Points ki brief explanation?',
  ],
};

const ALL_SUBJECT_NAMES = [
  'English Grammar',
  'Physics',
  'Mathematics',
  'Chemistry',
  'Computer',
  'Biology',
  'Mutala Pakistan',
];

export default function AiChatPage() {
  const router = useRouter();
  const { user } = useGameStore();

  const [selectedSubject, setSelectedSubject] = useState<SubjectType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load subject from local storage or session
  useEffect(() => {
    const savedSubject = localStorage.getItem('alimran_chat_selected_subject') as SubjectType | null;
    if (savedSubject && ALL_SUBJECT_NAMES.includes(savedSubject)) {
      setSelectedSubject(savedSubject);
    }
  }, []);

  // Load chat history for selected subject
  useEffect(() => {
    if (selectedSubject) {
      const saved = localStorage.getItem(`alimran_ai_chat_${selectedSubject}`);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }
  }, [selectedSubject]);

  // Save chat history
  useEffect(() => {
    if (selectedSubject && messages.length > 0) {
      localStorage.setItem(`alimran_ai_chat_${selectedSubject}`, JSON.stringify(messages));
    }
  }, [messages, selectedSubject]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSelectSubject = (subject: SubjectType) => {
    setSelectedSubject(subject);
    localStorage.setItem('alimran_chat_selected_subject', subject);
  };

  const handleChangeSubject = () => {
    setSelectedSubject(null);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading || !selectedSubject) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Pass full conversation history for multi-turn context retention
      const aiReply = await sendChatMessage(messages, query, selectedSubject);
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...updatedMessages, aiMessage]);
    } catch (err: any) {
      const isPoolExhausted = err?.code === 'AI_POOL_EXHAUSTED' || err?.status === 503;
      const errMsg = isPoolExhausted
        ? 'AI service is temporarily busy. Please connect your own Gemini API key to continue.'
        : err?.message || 'Unable to connect to AI tutor. Please check your internet connection.';

      showToast({
        type: 'error',
        title: isPoolExhausted ? 'AI Service Busy' : 'AI Chat Error',
        message: errMsg,
      });

      if (isPoolExhausted) {
        setKeyModalOpen(true);
      }

      const errorReply: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'model',
        content: isPoolExhausted
          ? `⚠️ **AI Service Busy:** AI service par is waqt temporary traffic hai. Aap "Connect Gemini Key" button par click kar ke apni free API key connect kar sakte hain.`
          : `⚠️ **Connection Issue:** ${errMsg}\n\nDobara koshish karein ya internet connection check karein.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...updatedMessages, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast({ type: 'info', title: 'Copied', message: 'Message copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Clear this subject conversation history?')) {
      setMessages([]);
      if (selectedSubject) {
        localStorage.removeItem(`alimran_ai_chat_${selectedSubject}`);
      }
      showToast({ type: 'info', title: 'Cleared', message: 'Chat history cleared' });
    }
  };

  // --------------------------------------------------------------------------
  // STEP 1: SUBJECT SELECTION SCREEN
  // --------------------------------------------------------------------------
  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/ai')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Step 1: Choose Subject
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Select Subject for AI Chat
              </h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 text-xs font-medium text-slate-600 leading-relaxed shadow-xs">
            AI aapke sath natural <strong className="text-slate-900">Hinglish / Roman Urdu</strong> mein intelligent tutor ki tarah baat karega aur chune huye subject ke exact context ke according concise aur relevant answers dega.
          </div>

          {/* Subject Cards (7 Subjects Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SUBJECTS.map((sub) => {
              const Icon = sub.icon;
              return (
                <motion.button
                  key={sub.type}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectSubject(sub.type)}
                  className="bg-white rounded-[2rem] p-5 border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl ${sub.bg} ${sub.color} flex items-center justify-center border ${sub.border} shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {sub.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">
                      {sub.desc}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 2: DEDICATED CONTEXT-AWARE HINGLISH CHAT
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 relative">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleChangeSubject}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
            title="Change Subject"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  {selectedSubject} AI Tutor
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 uppercase tracking-wider">
                  Hinglish Mode
                </span>
                <button
                  onClick={handleChangeSubject}
                  className="text-[10px] text-slate-400 hover:text-blue-600 font-bold underline underline-offset-2"
                >
                  Change Subject
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Header Action buttons */}
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all text-xs font-bold"
            title="API Key Settings"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API Key</span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {selectedSubject} mein kya poochna chahte hain?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Apna sawal Hinglish ya English mein poochein. AI aapko real tutor ki tarah concise aur context-aware guide karega.
              </p>
            </div>

            {/* Subject Specific Suggested Chips */}
            <div className="w-full max-w-lg space-y-2 pt-2">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Suggested Questions</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS_MAP[selectedSubject]?.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(topic)}
                    className="text-xs font-semibold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-3.5 py-2 rounded-2xl shadow-xs transition-all text-left active:scale-95"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-3xl p-4 sm:p-5 text-sm shadow-xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed font-normal space-y-2">
                      {m.content}
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-1 text-[10px] text-slate-400 font-medium ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{m.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="hover:text-slate-600 p-0.5 rounded transition-colors"
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-xs p-4 flex items-center gap-2 text-xs font-semibold text-slate-500 shadow-xs">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>AI is thinking in Hinglish...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Dock Area */}
      <footer className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-3xl p-2 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`${selectedSubject} ka koi bhi question poochiye (Hinglish/English)...`}
            className="flex-1 max-h-32 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none resize-none"
          />

          <button
            id="send-chat-message-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 transition-all disabled:opacity-40 disabled:hover:bg-blue-600 active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onSuccess={() => setKeyModalOpen(false)}
      />
    </div>
  );
}
