'use client';
import { Shield, Users, Lock, MessageCircle, Settings, LogOut, X, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const tabs = [
  { id: 'roster', icon: Users, label: 'Student Roster' },
  { id: 'batches', icon: Lock, label: 'Manage Batches' },
  { id: 'resources', icon: MessageCircle, label: 'Resources & Chat' },
  { id: 'bans', icon: Ban, label: 'Ban Management' },
  { id: 'settings', icon: Settings, label: 'System Settings' },
];

export default function AdminSidebar({ activeTab, setActiveTab, onLogout, isOpen, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <div className={`w-72 min-h-screen bg-surface border-r border-gray-200 p-6 flex flex-col z-50 transition-all duration-300 ${
        isOpen 
          ? 'fixed left-0 top-0 translate-x-0' 
          : 'fixed left-0 top-0 -translate-x-full md:relative md:translate-x-0'
      }`}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-xl p-2.5 shadow-lg shadow-primary/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Admin Portal</h1>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Al Imran Learner</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted" />
            </button>
          )}
        </div>

      <nav className="flex-1 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              onClose?.();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
              activeTab === tab.id
                ? 'bg-primary/5 text-primary'
                : 'text-muted hover:bg-gray-50 hover:text-foreground'
            }`}
          >
            <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-muted group-hover:text-foreground'}`} />
            <span className="font-bold text-sm">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="pt-6 mt-auto border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-error font-bold hover:bg-error/5 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
      </div>
    </>
  );
}
