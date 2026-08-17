'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, ShieldOff, Clock, User, Wifi, Search, Ban, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '@/components/ToastNotification';

interface BanManagerProps {
  students: any[];
}

export default function BanManager({ students }: BanManagerProps) {
  const [bans, setBans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banModal, setBanModal] = useState(false);
  const [banForm, setBanForm] = useState({
    reason: '',
    ban_type: 'permanent' as 'permanent' | 'temporary',
    duration_hours: 24,
  });

  useEffect(() => {
    fetchBans();
    const sub = supabase
      .channel('bans-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_bans' }, fetchBans)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchBans = async () => {
    const { data } = await supabase
      .from('user_bans')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setBans(data);
    setIsLoading(false);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    const bannedUntil = banForm.ban_type === 'temporary'
      ? new Date(Date.now() + banForm.duration_hours * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase.from('user_bans').insert({
      user_id: selectedUser.id,
      username: selectedUser.username,
      user_ip: selectedUser.last_ip || 'unknown',
      reason: banForm.reason || 'Violation of community guidelines',
      ban_type: banForm.ban_type,
      banned_until: bannedUntil,
      is_active: true,
    });

    if (error) {
      showToast({ type: 'error', title: 'Ban Failed', message: error.message });
    } else {
      showToast({
        type: 'ban',
        title: 'User Banned',
        message: `${selectedUser.username} has been ${banForm.ban_type === 'permanent' ? 'permanently' : `temporarily (${banForm.duration_hours}h)`} banned.`,
        duration: 5000
      });
      setBanModal(false);
      setSelectedUser(null);
      setBanForm({ reason: '', ban_type: 'permanent', duration_hours: 24 });
      fetchBans();
    }
  };

  const handleUnban = async (ban: any) => {
    const { error } = await supabase.from('user_bans').update({ is_active: false }).eq('id', ban.id);
    if (error) {
      showToast({ type: 'error', title: 'Unban Failed', message: error.message });
    } else {
      showToast({ type: 'success', title: 'User Unbanned', message: `${ban.username} has been unbanned.` });
      fetchBans();
    }
  };

  const filteredStudents = students.filter(s =>
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.last_ip?.includes(search)
  );

  const activeBanIds = bans.map(b => b.user_id);

  return (
    <div className="space-y-8">
      {/* Active Bans */}
      {bans.length > 0 && (
        <div className="bg-surface rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-red-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Active Bans</h3>
                <p className="text-xs text-gray-500">{bans.length} users currently banned</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {bans.map((ban) => (
              <div key={ban.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{ban.username || 'Unknown'}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> {ban.user_ip || 'No IP'}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ban.ban_type === 'permanent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {ban.ban_type === 'permanent' ? 'Permanent' : `Until ${new Date(ban.banned_until).toLocaleDateString()}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 italic">{ban.reason}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnban(ban)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-xl transition-all text-xs font-bold uppercase tracking-widest flex-shrink-0"
                >
                  <ShieldOff className="w-4 h-4" /> Unban
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-surface rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">All Users & IP Addresses</h3>
              <p className="text-xs text-gray-500 mt-0.5">Click on any user to ban them</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search by name or IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:border-primary focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {filteredStudents.map((student) => {
            const isBanned = activeBanIds.includes(student.id);
            return (
              <div
                key={student.id}
                className={`p-5 flex items-center justify-between gap-4 transition-colors ${isBanned ? 'bg-red-50/50' : 'hover:bg-gray-50/50 cursor-pointer'}`}
                onClick={() => !isBanned && (setSelectedUser(student), setBanModal(true))}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-gray-100 flex-shrink-0">
                    <img src={student.avatar_url} alt={student.username} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 truncate">{student.username}</p>
                      {isBanned && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Banned</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        {student.last_ip || 'No IP recorded'}
                      </span>
                      <span className="text-xs text-gray-400">Level {student.level} • {student.xp} XP</span>
                    </div>
                  </div>
                </div>
                {!isBanned && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex-shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">No users found matching your search.</div>
          )}
        </div>
      </div>

      {/* Ban Modal */}
      <AnimatePresence>
        {banModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setBanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Ban User</h3>
                  <p className="text-sm text-gray-500">Banning <strong>{selectedUser.username}</strong></p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Wifi className="w-4 h-4 text-gray-400" />
                  <span className="font-mono">IP: {selectedUser.last_ip || 'Not recorded'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-2">Ban Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBanForm(f => ({ ...f, ban_type: 'permanent' }))}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${banForm.ban_type === 'permanent' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      🚫 Permanent
                    </button>
                    <button
                      onClick={() => setBanForm(f => ({ ...f, ban_type: 'temporary' }))}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${banForm.ban_type === 'temporary' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      ⏳ Temporary
                    </button>
                  </div>
                </div>

                {banForm.ban_type === 'temporary' && (
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-2">Duration</label>
                    <select
                      value={banForm.duration_hours}
                      onChange={(e) => setBanForm(f => ({ ...f, duration_hours: Number(e.target.value) }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={6}>6 Hours</option>
                      <option value={24}>24 Hours</option>
                      <option value={72}>3 Days</option>
                      <option value={168}>1 Week</option>
                      <option value={720}>1 Month</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-widest block mb-2">Reason (optional)</label>
                  <textarea
                    placeholder="e.g. Sharing inappropriate content..."
                    value={banForm.reason}
                    onChange={(e) => setBanForm(f => ({ ...f, reason: e.target.value }))}
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setBanModal(false); setSelectedUser(null); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  🚫 Ban User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
