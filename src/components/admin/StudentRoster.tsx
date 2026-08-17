'use client';
import { Users, Eye, TrendingUp, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentRosterProps {
  students: any[];
  onReveal: (id: string) => void;
}

export default function StudentRoster({ students, onReveal }: StudentRosterProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Students', value: students.length, icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Active Learners', value: students.filter(s => s.xp > 0).length, icon: Zap, color: 'text-secondary', bg: 'bg-secondary/5' },
          { label: 'Average XP', value: Math.round(students.reduce((acc, s) => acc + s.xp, 0) / (students.length || 1)), icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/5' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface p-6 rounded-3xl border border-gray-200 shadow-sm group">
            <div className="relative z-10 flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-2xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.1em]">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Student Directory
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Real-time Sync
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-gray-50/30">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Student Identity</th>
                <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Performance Metrics</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Administration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, i) => (
                <motion.tr
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={student.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img src={student.avatar_url} className="w-10 h-10 rounded-xl border border-gray-200 shadow-sm" />
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">
                          {student.level}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm truncate">{student.username}</div>
                        <div className="text-[10px] text-gray-400 font-medium">Student ID: #{student.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-5">
                    <div className="max-w-[200px]">
                      <div className="flex items-center justify-between text-[10px] mb-1.5">
                        <span className="text-primary font-bold">{student.xp} XP Accumulation</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((student.xp / 5000) * 100, 100)}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => onReveal(student.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-all duration-200 text-[10px] font-bold uppercase tracking-wider"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
