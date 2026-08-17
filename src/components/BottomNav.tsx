'use client';
import { ShoppingCart, BookOpen, Sparkles, Users, CheckSquare, Trophy, User as UserIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { name: 'Shop', path: '/shop', icon: ShoppingCart },
  { name: 'Learn', path: '/learn', icon: BookOpen },
  { name: 'AI', path: '/ai', icon: Sparkles },
  { name: 'Groups', path: '/groups', icon: Users },
  { name: 'Daily', path: '/daily-tests', icon: CheckSquare },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Profile', path: '/profile', icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.05)] z-40">
      <div className="max-w-md mx-auto flex justify-around items-center px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className="relative flex flex-col items-center justify-center min-w-[3.5rem] py-1.5 group"
            >
              <div className={`absolute inset-0 scale-0 opacity-0 group-active:scale-100 group-active:opacity-10 transition-all rounded-xl ${isActive ? 'bg-blue-600' : 'bg-slate-400'}`} />
              <div className={`mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                <item.icon
                  className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-widest transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
