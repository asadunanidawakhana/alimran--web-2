'use client';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

export default function BanGuard({ children }: { children: React.ReactNode }) {
  const { user, logout } = useGameStore();
  const banInfo = user?.ban_info;

  if (banInfo) {
    const isPermanent = banInfo.ban_type === 'permanent';
    const untilDate = banInfo.banned_until ? new Date(banInfo.banned_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50/80 backdrop-blur-md p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-10 border border-red-200 shadow-2xl shadow-red-100/50 max-w-md w-full text-center space-y-6"
        >
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Account Banned</h2>
            <p className="text-slate-500 text-sm font-medium">
              {isPermanent
                ? 'Your account has been permanently banned by the admin.'
                : `Your account is temporarily banned until ${untilDate}.`}
            </p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Reason</p>
            <p className="text-sm text-red-700 font-medium">{banInfo.reason || 'Violation of community guidelines'}</p>
          </div>
          <p className="text-xs text-slate-400 font-medium">Contact your administrator if you believe this is a mistake.</p>
          <button
            onClick={() => logout()}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all text-sm uppercase tracking-widest"
          >
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
