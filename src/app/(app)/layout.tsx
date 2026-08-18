'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import BanGuard from '@/components/BanGuard';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { showToast } from '@/components/ToastNotification';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords } from 'lucide-react';
import OneSignal from 'react-onesignal';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, syncWithDatabase } = useGameStore();
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);

  // Hide UI for immersive modes
  const isImmersive = pathname?.includes('/battle') || pathname?.includes('/learn/');

  // Authoritative Database Sync for XP, Level, and Realtime Listeners
  useEffect(() => {
    if (user?.id) {
      syncWithDatabase();
    }
  }, [user?.id, syncWithDatabase]);

  useEffect(() => {
    if (!user) return;

    // Initialize OneSignal Web Push SDK
    try {
      if (typeof window !== 'undefined' && (window as any).OneSignal?.initialized) {
        OneSignal.login(user.username);
        if (!OneSignal.User.PushSubscription.optedIn) {
          setShowPermissionPopup(true);
        }
      } else {
        OneSignal.init({
          appId: '359f34c1-6708-4dbb-8486-244f1c677b68',
          allowLocalhostAsSecureOrigin: true,
        }).then(() => {
          OneSignal.login(user.username);
          if (!OneSignal.User.PushSubscription.optedIn) {
            setShowPermissionPopup(true);
          }
        });
      }
    } catch (e) {
      console.warn('OneSignal initialization failed:', e);
    }

    // Listen globally for match search queue entries (Realtime fallback)
    const channel = supabase
      .channel('global-matchmaking')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'battle_queue',
      }, async (payload) => {
        const queueEntry = payload.new;
        if (queueEntry.user_id === user.id) return;

        // Fetch challenger username
        const { data: challenger } = await supabase
          .from('users')
          .select('username')
          .eq('id', queueEntry.user_id)
          .single();

        if (challenger?.username) {
          // Play match alert notification sound
          try {
            const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            sound.volume = 0.7;
            sound.play().catch(() => { });
          } catch (e) { }

          // Display in-app visual toast notification
          showToast({
            type: 'info',
            title: '⚔️ Duel Challenge!',
            message: `${challenger.username} is searching for a 1v1 match! Go to Arena to join.`,
            duration: 8000
          });

          // Display desktop browser notification (realtime fallback)
          if ('Notification' in window && Notification.permission === 'granted') {
            const n = new Notification('⚔️ Duel Challenge!', {
              body: `${challenger.username} is searching for a 1v1 match! Click to enter the Arena.`,
              tag: 'matchmaking-alert',
            });
            n.onclick = () => {
              window.focus();
              router.push('/battle');
              n.close();
            };
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, router]);

  return (
    <BanGuard>
      <div className="flex flex-col h-full bg-background relative pb-20">
        {!isImmersive && <TopBar />}
        <main className={`flex-1 overflow-y-auto ${isImmersive ? 'pb-0' : ''}`}>
          {children}
        </main>
        {!isImmersive && <BottomNav />}

        {/* Custom Notification Permission Modal Overlay */}
        <AnimatePresence>
          {showPermissionPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white max-w-sm w-full rounded-[2.5rem] p-8 border border-slate-100 text-center shadow-2xl space-y-6"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto relative">
                  <div className="absolute inset-0 bg-blue-100/50 rounded-[2rem] animate-ping" />
                  <Swords className="w-10 h-10 text-blue-600 relative z-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Enable Battle Alerts</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Get instant matchmaking alerts when other students challenge you to 1v1 Arena Duels!
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={async () => {
                      localStorage.setItem('matchmaking_notification_prompt_dismissed', 'true');
                      setShowPermissionPopup(false);
                      try {
                        let granted = false;
                        if (typeof window !== 'undefined' && (window as any).OneSignal) {
                          await OneSignal.Notifications.requestPermission();
                          await OneSignal.User.PushSubscription.optIn();
                          granted = OneSignal.Notifications.permission;
                        } else {
                          const res = await Notification.requestPermission();
                          granted = res === 'granted';
                        }

                        if (granted) {
                          showToast({ type: 'success', title: 'Alerts Enabled!', message: 'You will receive battle challenges.' });
                        }
                      } catch (err) {
                        console.warn('Notification permission request failed:', err);
                        Notification.requestPermission();
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-98 uppercase tracking-widest text-xs"
                  >
                    Enable Alerts
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('matchmaking_notification_prompt_dismissed', 'true');
                      setShowPermissionPopup(false);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-black py-4 rounded-2xl transition-all active:scale-98 uppercase tracking-widest text-xs"
                  >
                    Not Now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BanGuard>
  );
}
