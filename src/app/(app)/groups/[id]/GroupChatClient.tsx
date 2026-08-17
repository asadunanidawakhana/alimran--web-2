'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, User, ChevronLeft, Shield, Info, Eye, Trash2, Sparkles, Activity, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '@/components/ToastNotification';

export default function GroupChatClient() {
  const { id: batchId } = useParams();
  const { user } = useGameStore();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showIdentifyModal, setShowIdentifyModal] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!batchId) return;
    const fetchBatchData = async () => {
      const { data: bData } = await supabase.from('groups').select('*').eq('id', batchId).single();
      setBatchInfo(bData);

      const { data: mData } = await supabase.from('messages').select('*, sender:users(username, avatar_url, role)').eq('group_id', batchId).order('created_at', { ascending: true });
      if (mData) setMessages(mData);

      const { data: memData } = await supabase.from('group_members').select('*, user:users(username, avatar_url, role)').eq('group_id', batchId);
      if (memData) setMembers(memData);
    };

    fetchBatchData();

    const channel = supabase.channel(`group-chat-${batchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${batchId}` }, async (payload) => {
        const { data: sender } = await supabase.from('users').select('username, avatar_url, role').eq('id', payload.new.sender_id).single();
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          const optimisticIndex = prev.findIndex(m => m.sender_id === payload.new.sender_id && m.message_text === payload.new.message_text && typeof m.id === 'string' && m.id.includes('.'));
          if (optimisticIndex !== -1) {
            const updated = [...prev];
            updated[optimisticIndex] = { ...payload.new, sender };
            return updated;
          }
          return [...prev, { ...payload.new, sender }];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [batchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { data: banData } = await supabase
      .from('user_bans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (banData) {
      const isPermanent = banData.ban_type === 'permanent';
      const isExpired = !isPermanent && banData.banned_until && new Date(banData.banned_until) < new Date();

      if (!isExpired) {
        showToast({
          type: 'error',
          title: 'Action Restricted',
          message: 'Your account is currently restricted from chatting.'
        });
        return;
      }
    }

    const tempId = Math.random().toString();
    const tempMsg = {
      id: tempId,
      group_id: batchId,
      sender_id: user.id,
      message_text: newMessage,
      created_at: new Date().toISOString(),
      sender: { username: user.username, avatar_url: user.avatar_url, role: user.role }
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({ group_id: batchId, sender_id: user.id, message_text: newMessage });
    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showToast({ type: 'error', title: 'Transmission Error', message: 'The communication packet failed to send.' });
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm('Purge this data segment for all users?')) return;
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (error) showToast({ type: 'error', title: 'Erasure Error', message: 'Failed to purge the message from the stream.' });
  };

  const handleIdentify = (member: any) => {
    if (user?.role === 'admin') setShowIdentifyModal(member);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50/50 overflow-hidden -m-4">
      {/* SaaS Chat Header */}
      <header className="bg-white px-6 py-4 shadow-xl shadow-slate-200/40 flex items-center justify-between border-b border-slate-200 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/groups')} className="p-2.5 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight italic leading-tight">
              {batchInfo?.name || 'SYNCING...'}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {members.length} Active Nodes
              </span>
            </div>
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
          <Info className="w-5 h-5" />
        </div>
      </header>

      {/* Modern Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          const member = members.find(m => m.user_id === msg.sender_id);
          const isTeacher = msg.sender?.role === 'admin';

          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg`}>
              <div className={`flex items-end gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl overflow-hidden shrink-0 border-2 shadow-lg transition-transform hover:scale-110 ${isTeacher ? 'border-blue-400 shadow-blue-100' : 'border-white shadow-slate-200'}`}>
                  <img src={msg.sender?.avatar_url} className="w-full h-full object-cover bg-slate-100" />
                </div>

                <div className="relative">
                  <div className={`p-4 rounded-[1.5rem] text-sm font-medium shadow-sm transition-all ${isMe ? 'bg-blue-600 text-white rounded-br-none shadow-blue-200' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-slate-200/50'}`}>
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isTeacher ? 'text-blue-600' : 'text-slate-400'}`}>
                          {isTeacher ? 'Official Instructor' : (member?.anonymous_name || 'Anonymous Student')}
                        </span>
                        {user?.role === 'admin' && (
                          <button onClick={() => handleIdentify(member)} className="text-blue-500 hover:text-blue-700 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isTeacher && <Sparkles className="w-3 h-3 text-blue-500 fill-current" />}
                      </div>
                    )}

                    {msg.message_text.startsWith('📎 Resource Shared:') ? (
                      <div className={`p-4 rounded-2xl border-2 transition-all ${isMe ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 border-blue-100 text-blue-900'} min-w-[220px]`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-blue-600 text-white'}`}>
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block">Secure_Asset</span>
                            <span className="font-bold text-sm block truncate leading-tight">{msg.message_text.match(/\[(.*?)\]/)?.[1] || 'File_Module'}</span>
                          </div>
                        </div>
                        <a
                          href={msg.message_text.match(/\((.*?)\)/)?.[1]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] transition-all ${isMe ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
                        >
                          Pull Resource
                        </a>
                      </div>
                    ) : msg.message_text.startsWith('🖼️ [IMAGE]') ? (
                      <div className="mt-2 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 group relative group-hover:scale-[1.02] transition-transform">
                        <img
                          src={msg.message_text.match(/\((.*?)\)/)?.[1]}
                          alt="Shared Visual"
                          className="max-w-full h-auto object-cover cursor-zoom-in"
                          onClick={() => window.open(msg.message_text.match(/\((.*?)\)/)?.[1], '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed">{msg.message_text}</p>
                    )}
                  </div>

                  {isMe && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="absolute -left-12 top-1/2 -translate-y-1/2 p-2.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover/msg:opacity-100 transition-all bg-white shadow-xl rounded-2xl border border-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <span className={`text-[8px] font-black text-slate-400 mt-2 uppercase tracking-widest ${isMe ? 'mr-12' : 'ml-12'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          );
        })}
      </div>

      <footer className="p-6 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <form onSubmit={sendMessage} className="flex gap-4 max-w-5xl mx-auto">
          <input
            type="text"
            placeholder="Input communication string..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-4 rounded-[1.5rem] shadow-xl shadow-blue-600/20 hover:bg-black transition-all active:scale-95 flex items-center justify-center"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </footer>

      <AnimatePresence>
        {showIdentifyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowIdentifyModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl border border-slate-100" onClick={e => e.stopPropagation()}>
              <div className="w-28 h-28 rounded-[2rem] bg-slate-100 mx-auto mb-6 overflow-hidden border-4 border-white shadow-2xl shadow-slate-200/50">
                <img src={showIdentifyModal.user?.avatar_url} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-2">Protocol: Identity_Reveal</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Access Level: Administrator Only</p>

              <div className="space-y-4 mb-10">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Pseudonym:</span>
                  <span className="font-bold text-slate-700">{showIdentifyModal.anonymous_name}</span>
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-100 flex justify-between items-center">
                  <span className="text-[9px] font-black text-blue-400 uppercase">Verified Name:</span>
                  <span className="font-black text-blue-700 text-xl">{showIdentifyModal.user?.username}</span>
                </div>
              </div>

              <button onClick={() => setShowIdentifyModal(null)} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-slate-900/20 active:scale-95">
                Close_Dossier
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
