'use client';
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user, syncWithDatabase } = useGameStore();
  const theme = user?.selected_theme;

  useEffect(() => {
    if (user?.id) {
      syncWithDatabase();
    }
  }, [user?.id]);

  const themeClasses = {
    dark: 'bg-slate-900 text-white border-slate-800',
    neon: 'bg-black text-fuchsia-500 border-fuchsia-900/30',
    default: 'bg-background text-foreground border-gray-100'
  };

  const selectedClass = theme === 'dark' ? themeClasses.dark : theme === 'neon' ? themeClasses.neon : themeClasses.default;

  return (
    <div className={`w-full max-w-md min-h-screen shadow-2xl relative overflow-x-hidden flex flex-col transition-all duration-500 ${selectedClass} border-x`}>
      {children}
    </div>
  );
}
