import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface User {
  id: string;
  username: string;
  avatar_url: string;
  xp: number;
  level: number;
  current_streak: number;
  hearts: number;
  role: 'student' | 'admin';
  selected_theme?: string;
  coins: number;
  perks: {
    hints: number;
    refills: number;
  };
  completed_topics: string[];
  last_test_at?: string;
  last_ip?: string;
  time_xp_earned_today?: number;
  last_time_xp_date?: string;
  // Adaptive Difficulty Persistence
  prev_test_score?: number;
  prev_test_total?: number;
  ban_info?: any;
}

interface GameState {
  user: User | null;
  setUser: (user: User) => void;
  updateXP: (amount: number) => Promise<void>;
  updateHearts: (amount: number) => Promise<void>;
  updateAvatar: (url: string) => Promise<void>;
  updateTheme: (theme: string) => void;
  updateCoins: (amount: number) => Promise<void>;
  addPerk: (perk: 'hints' | 'refills', amount: number) => Promise<void>;
  usePerk: (perk: 'hints' | 'refills') => Promise<boolean>;
  completeTopic: (id: string) => Promise<void>;
  completeTest: (score: number, total: number) => Promise<void>;
  syncWithDatabase: () => void;
  awardTimeXP: () => Promise<void>;
  setBanInfo: (info: any) => void;
  logout: () => void;
}

let activeChannel: RealtimeChannel | null = null;
let banChannel: RealtimeChannel | null = null;
let timeXPInterval: ReturnType<typeof setInterval> | null = null;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set((state) => {
        const existingUser = state.user;
        const mergedUser = {
          ...user,
          perks: user.perks || existingUser?.perks || { hints: 3, refills: 2 },
          completed_topics: user.completed_topics || existingUser?.completed_topics || [],
          hearts: user.hearts ?? existingUser?.hearts ?? 5,
          xp: user.xp ?? existingUser?.xp ?? 0,
          coins: user.coins ?? existingUser?.coins ?? 0,
          avatar_url: user.avatar_url || existingUser?.avatar_url || '',
        };
        return { user: mergedUser as User };
      }),
      updateXP: async (amount) => {
        const { user } = get();
        if (!user) return;
        const newXP = Math.max(0, user.xp + amount);
        const newLevel = Math.floor(newXP / 100) + 1;
        set({ user: { ...user, xp: newXP, level: newLevel } });
        try {
          await supabase.from('users').update({ xp: newXP, level: newLevel }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to sync XP:', err);
        }
      },
      updateHearts: async (amount) => {
        const { user } = get();
        if (!user) return;
        const newHearts = Math.max(0, user.hearts + amount);
        set({ user: { ...user, hearts: newHearts } });
        try {
          await supabase.from('users').update({ hearts: newHearts }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to sync Hearts:', err);
        }
      },
      updateAvatar: async (url) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, avatar_url: url } });
        try {
          await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to sync Avatar:', err);
        }
      },
      updateTheme: (theme) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, selected_theme: theme } });
      },
      updateCoins: async (amount) => {
        const { user } = get();
        if (!user) return;
        const newCoins = Math.max(0, (user.coins || 0) + amount);
        set({ user: { ...user, coins: newCoins } });
        try {
          await supabase.from('users').update({ coins: newCoins }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to sync Coins:', err);
        }
      },
      completeTopic: async (id) => {
        const { user } = get();
        if (!user) return;
        if (user.completed_topics?.includes(id)) return;
        const updatedTopics = [...(user.completed_topics || []), id];
        set({ user: { ...user, completed_topics: updatedTopics } });
        try {
          await supabase.from('users').update({ completed_topics: updatedTopics }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to sync Topics:', err);
        }
      },
      completeTest: async (score, total) => {
        const { user } = get();
        if (!user) return;
        const now = new Date().toISOString();
        set({ 
          user: { 
            ...user, 
            last_test_at: now,
            prev_test_score: score,
            prev_test_total: total
          } 
        });
        try {
          await supabase.from('users').update({ 
            last_test_at: now,
            prev_test_score: score,
            prev_test_total: total
          }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to sync Test results:', err);
        }
      },
      addPerk: async (perk, amount) => {
        const { user } = get();
        if (!user) return;
        const updatedPerks = {
          ...(user.perks || { hints: 0, refills: 0 }),
          [perk]: (user.perks?.[perk] || 0) + amount
        };
        set({ user: { ...user, perks: updatedPerks } });
        try {
          await supabase.from('users').update({ perks: updatedPerks }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to sync Perks:', err);
        }
      },
      usePerk: async (perk) => {
        const { user } = get();
        if (!user || !user.perks || user.perks[perk] <= 0) return false;

        const updatedPerks = {
          ...(user.perks || { hints: 0, refills: 0 }),
          [perk]: user.perks[perk] - 1
        };
        set({ user: { ...user, perks: updatedPerks } });
        try {
          await supabase.from('users').update({ perks: updatedPerks }).eq('id', user.id);
          return true;
        } catch (err) {
          console.error('Failed to use Perk:', err);
          return false;
        }
      },
      awardTimeXP: async () => {
        const { user } = get();
        if (!user) return;
        const today = new Date().toISOString().split('T')[0];
        const lastDate = user.last_time_xp_date;
        const earnedToday = lastDate === today ? (user.time_xp_earned_today || 0) : 0;

        if (earnedToday >= 30) return;

        const newXP = user.xp + 1;
        const newLevel = Math.floor(newXP / 100) + 1;
        const newEarned = earnedToday + 1;

        set({
          user: {
            ...user,
            xp: newXP,
            level: newLevel,
            time_xp_earned_today: newEarned,
            last_time_xp_date: today
          }
        });

        try {
          await supabase.from('users').update({
            xp: newXP,
            level: newLevel,
            time_xp_earned_today: newEarned,
            last_time_xp_date: today
          }).eq('id', user.id);
        } catch (err) {
          console.error('Failed to award Time XP:', err);
        }
      },
      setBanInfo: (info) => set((state) => ({ 
        user: state.user ? { ...state.user, ban_info: info } : null 
      })),
      syncWithDatabase: () => {
        const { user } = get();
        if (!user?.id) return;
        if (activeChannel && banChannel) return;

        if (!activeChannel) {
          activeChannel = supabase
            .channel(`user-sync-${user.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
              set((state) => ({
                user: state.user ? { ...state.user, ...payload.new } : null
              }));
            })
            .subscribe();
        }

        // Ban Sync
        if (!banChannel) {
          banChannel = supabase
            .channel(`user-bans-${user.id}`)
            .on('postgres_changes', { 
              event: '*', 
              schema: 'public', 
              table: 'user_bans', 
              filter: `user_id=eq.${user.id}` 
            }, (payload: any) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                if (payload.new.is_active) {
                  const ban = payload.new;
                  const isPermanent = ban.ban_type === 'permanent';
                  const isExpired = !isPermanent && ban.banned_until && new Date(ban.banned_until) < new Date();
                  
                  if (!isExpired) {
                    get().setBanInfo(ban);
                  } else {
                    get().setBanInfo(null);
                  }
                } else {
                  get().setBanInfo(null);
                }
              } else if (payload.eventType === 'DELETE') {
                get().setBanInfo(null);
              }
            })
            .subscribe();
        }

        if (!timeXPInterval) {
          timeXPInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
              get().awardTimeXP();
            }
          }, 60 * 1000);
        }
      },
      logout: () => {
        if (activeChannel) {
          supabase.removeChannel(activeChannel);
          activeChannel = null;
        }
        if (banChannel) {
          supabase.removeChannel(banChannel);
          banChannel = null;
        }
        if (timeXPInterval) {
          clearInterval(timeXPInterval);
          timeXPInterval = null;
        }
        set({ user: null });
      },
    }),
    {
      name: 'alimran-game-storage',
    }
  )
);
