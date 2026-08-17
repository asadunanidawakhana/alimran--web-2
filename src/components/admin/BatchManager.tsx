'use client';
import { Plus, Trash2, Lock, ShieldCheck, UserCheck, Users2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchManagerProps {
  batches: any[];
  newBatch: { name: string; type: 'boys' | 'girls'; pass: string };
  setNewBatch: (batch: any) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdatePass: (id: string, pass: string) => void;
}

export default function BatchManager({ batches, newBatch, setNewBatch, onAdd, onRemove, onUpdatePass }: BatchManagerProps) {
  return (
    <div className="space-y-10">
      {/* Batch Initialization Section */}
      <div className="bg-surface rounded-3xl p-6 md:p-8 border border-gray-200 shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-primary/5 p-3 rounded-2xl">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Initialize Academic Batch</h2>
              <p className="text-sm text-gray-500 font-medium">Provision a new secure learning environment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Batch Designation</label>
              <input
                placeholder="e.g. Advanced Tenses A1"
                value={newBatch.name}
                onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-foreground placeholder:text-gray-400 focus:border-primary focus:bg-white outline-none transition-all text-sm font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Department</label>
              <select
                value={newBatch.type}
                onChange={(e) => setNewBatch({ ...newBatch, type: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-foreground focus:border-primary focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-semibold"
              >
                <option value="boys">Boys Section</option>
                <option value="girls">Girls Section</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">Access Passkey</label>
              <input
                placeholder="Required for Join"
                value={newBatch.pass}
                onChange={(e) => setNewBatch({ ...newBatch, pass: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-foreground placeholder:text-gray-400 focus:border-primary focus:bg-white outline-none transition-all text-sm font-semibold"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={onAdd}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-xl py-3.5 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <ShieldCheck className="w-5 h-5" />
                Deploy Batch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {batches.map((batch) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={batch.id}
              className="bg-surface rounded-3xl p-6 border border-gray-200 hover:border-primary transition-all duration-300 group relative shadow-sm"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  batch.group_type === 'boys' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
                }`}>
                  {batch.group_type} Section
                </div>
                <button
                  onClick={() => onRemove(batch.id)}
                  className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-xl font-bold text-foreground tracking-tight mb-6">{batch.name}</h4>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 flex items-center justify-between group/input">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-gray-400 group-hover/input:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Passkey</span>
                  </div>
                  <input
                    defaultValue={batch.password}
                    onBlur={(e) => onUpdatePass(batch.id, e.target.value)}
                    className="bg-transparent text-right font-bold text-primary outline-none w-24 text-sm"
                  />
                </div>
                
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invite Code</span>
                  </div>
                  <span className="font-mono font-bold text-foreground bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 select-all text-sm">{batch.code}</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-50 flex items-center gap-3 text-gray-400">
                <Users2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Enrollment</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
