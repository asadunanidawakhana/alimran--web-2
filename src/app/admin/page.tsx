'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import StudentRoster from '@/components/admin/StudentRoster';
import BatchManager from '@/components/admin/BatchManager';
import ResourceChat from '@/components/admin/ResourceChat';
import SystemSettings from '@/components/admin/SystemSettings';
import BanManager from '@/components/admin/BanManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { showToast } from '@/components/ToastNotification';

export default function AdminPage() {
  const { user: currentUser } = useGameStore();
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'batches' | 'resources' | 'settings' | 'bans'>('roster');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const [newBatch, setNewBatch] = useState({ name: '', type: 'boys' as 'boys' | 'girls', pass: '' });
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatMembers, setChatMembers] = useState<any[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [boysPass, setBoysPass] = useState('');
  const [girlsPass, setGirlsPass] = useState('');
  const [masterPass, setMasterPass] = useState('');

  useEffect(() => {
    const isAdmin = localStorage.getItem('admin_session');
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }
    fetchData();
    const subscription = supabase
      .channel('admin-updates-main')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const fetchData = async () => {
    const { data: userData } = await supabase.from('users').select('*').order('xp', { ascending: false });
    const { data: groupData } = await supabase.from('groups').select('*');
    const { data: settingsData } = await supabase.from('site_settings').select('*');
    
    if (userData) setStudents(userData);
    if (groupData) setBatches(groupData);
    if (settingsData) {
      setBoysPass(settingsData.find(s => s.id === 'boys_section_password')?.value || '');
      setGirlsPass(settingsData.find(s => s.id === 'girls_section_password')?.value || '');
      setMasterPass(settingsData.find(s => s.id === 'master_password')?.value || '');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!selectedBatchId) return;
    
    const fetchChat = async () => {
      const { data: mData } = await supabase
        .from('messages')
        .select('*, sender:users(username, avatar_url, role)')
        .eq('group_id', selectedBatchId)
        .order('created_at', { ascending: true });
      if (mData) setMessages(mData);

      const { data: memData } = await supabase
        .from('group_members')
        .select('*, user:users(username, avatar_url, role)')
        .eq('group_id', selectedBatchId);
      if (memData) setChatMembers(memData);
    };
    
    fetchChat();

    const channel = supabase
      .channel(`admin-chat-${selectedBatchId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${selectedBatchId}` }, async (payload) => {
        const { data: sender } = await supabase.from('users').select('username, avatar_url, role').eq('id', payload.new.sender_id).single();
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, { ...payload.new, sender }].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedBatchId]);

  const handleSendMessage = async (text: string, isLink = false, linkData?: { title: string, url: string }) => {
    if (!selectedBatchId || !currentUser) return;

    let messageText = text;
    if (isLink && linkData) {
      let finalUrl = linkData.url.trim();
      if (finalUrl && !/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
      messageText = `📎 Resource Shared: [${linkData.title}](${finalUrl})`;
    }

    const { error } = await supabase.from('messages').insert({
      group_id: selectedBatchId,
      sender_id: currentUser.id,
      message_text: messageText
    });

    if (error) showToast({ type: 'error', title: 'Message Failed', message: error.message });
  };

  const handleUploadImage = async () => {
    if (!pendingImage || !selectedBatchId || !currentUser) return;
    setIsUploading(true);

    try {
      const fileExt = pendingImage.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedBatchId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('Images only').upload(filePath, pendingImage);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('Images only').getPublicUrl(filePath);

      await supabase.from('messages').insert({
        group_id: selectedBatchId,
        sender_id: currentUser.id,
        message_text: `🖼️ [IMAGE](${publicUrl})`
      });

      setPendingImage(null);
      setImagePreview(null);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddBatch = async () => {
    if (!newBatch.name || !newBatch.pass) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('groups').insert({
      name: newBatch.name,
      group_type: newBatch.type,
      password: newBatch.pass,
      code: code
    });
    if (!error) {
      setNewBatch({ name: '', type: 'boys', pass: '' });
      fetchData();
    }
  };

  const updateSetting = async (id: string, value: string) => {
    const { error } = await supabase.from('site_settings').upsert({ id, value, updated_at: new Date().toISOString() });
    if (error) showToast({ type: 'error', title: 'Update Failed', message: error.message });
    else { showToast({ type: 'success', title: 'Settings Updated' }); fetchData(); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} 
        className="w-16 h-16 border-t-4 border-primary rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        onLogout={() => { localStorage.removeItem('admin_session'); router.push('/'); }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 p-4 md:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-3 bg-surface rounded-xl border border-gray-200 text-foreground shadow-sm"
              >
                <Menu className="w-6 h-6" />
              </button>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {activeTab === 'roster' && 'Student Roster'}
                  {activeTab === 'batches' && 'Batch Management'}
                  {activeTab === 'resources' && 'Learning Resources'}
                  {activeTab === 'settings' && 'System Configuration'}
                  {activeTab === 'bans' && 'Ban Management'}
                </h1>
                <p className="text-muted mt-1 text-xs md:text-sm font-medium">Platform Administration & Analytics</p>
              </motion.div>
            </div>

            <div className="flex items-center gap-4 bg-surface px-4 py-2 md:px-5 md:py-2.5 rounded-2xl border border-gray-200 shadow-sm self-end md:self-auto mr-1">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">A</div>
              <div>
                <p className="text-xs font-bold text-foreground leading-none">Master Admin</p>
                <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-wider">Superuser</p>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="px-1"
            >
              {activeTab === 'roster' && (
                <StudentRoster 
                  students={students} 
                  onReveal={(id) => {
                    const student = students.find(s => s.id === id);
                    alert(`Identity Unlocked: Student_${id.slice(0, 4)} is ${student.username}`);
                  }} 
                />
              )}
              
              {activeTab === 'batches' && (
                <BatchManager 
                  batches={batches}
                  newBatch={newBatch}
                  setNewBatch={setNewBatch}
                  onAdd={handleAddBatch}
                  onRemove={async (id) => {
                    if (confirm('Delete this batch forever?')) {
                      await supabase.from('groups').delete().eq('id', id);
                      fetchData();
                    }
                  }}
                  onUpdatePass={async (id, pass) => {
                    await supabase.from('groups').update({ password: pass }).eq('id', id);
                    fetchData();
                  }}
                />
              )}

              {activeTab === 'resources' && (
                <ResourceChat 
                  batches={batches}
                  selectedBatchId={selectedBatchId}
                  setSelectedBatchId={setSelectedBatchId}
                  messages={messages}
                  chatMembers={chatMembers}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={async (id) => {
                    if (confirm('Delete for everyone?')) await supabase.from('messages').delete().eq('id', id);
                  }}
                  onImageSelect={(file) => {
                    setPendingImage(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                  onRevealIdentity={(anon) => alert(`Identity: ${anon}`)}
                  isUploading={isUploading}
                  imagePreview={imagePreview}
                  onClearImage={() => { setPendingImage(null); setImagePreview(null); }}
                  onUploadImage={handleUploadImage}
                  currentUserId={currentUser?.id || ''}
                />
              )}

              {activeTab === 'settings' && (
                <SystemSettings 
                  boysPass={boysPass}
                  setBoysPass={setBoysPass}
                  girlsPass={girlsPass}
                  setGirlsPass={setGirlsPass}
                  masterPass={masterPass}
                  setMasterPass={setMasterPass}
                  onUpdate={updateSetting}
                />
              )}
              {activeTab === 'bans' && (
                <BanManager students={students} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
