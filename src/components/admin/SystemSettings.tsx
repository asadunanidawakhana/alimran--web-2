'use client';
import { Shield, Key, Save, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemSettingsProps {
  boysPass: string;
  setBoysPass: (pass: string) => void;
  girlsPass: string;
  setGirlsPass: (pass: string) => void;
  masterPass: string;
  setMasterPass: (pass: string) => void;
  onUpdate: (id: string, value: string) => void;
}

export default function SystemSettings({
  boysPass,
  setBoysPass,
  girlsPass,
  setGirlsPass,
  masterPass,
  setMasterPass,
  onUpdate
}: SystemSettingsProps) {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Security Infrastructure</h2>
          <p className="text-sm text-gray-500 font-medium">Configure institutional access keys and sectional security.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {[
          {
            id: 'boys_section_password',
            label: 'Boys Section Credential',
            value: boysPass,
            setter: setBoysPass,
            desc: 'Primary access key for the boys department learning environment.'
          },
          {
            id: 'girls_section_password',
            label: 'Girls Section Credential',
            value: girlsPass,
            setter: setGirlsPass,
            desc: 'Primary access key for the girls department learning environment.'
          },
          {
            id: 'master_password',
            label: 'Administrative Master Key',
            value: masterPass,
            setter: setMasterPass,
            desc: 'High-level credential for unlocking global administrative privileges.',
            isSecret: true
          },
        ].map((setting) => (
          <div
            key={setting.id}
            className="bg-surface p-8 rounded-3xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-8 group shadow-sm hover:border-primary/20 transition-all duration-300"
          >
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                {setting.label}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">{setting.desc}</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                <input
                  type={setting.isSecret ? 'password' : 'text'}
                  value={setting.value}
                  onChange={(e) => setting.setter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-6 py-4 text-foreground font-bold placeholder:text-gray-300 focus:border-primary focus:bg-white outline-none transition-all w-full md:w-64"
                />
              </div>
              <button
                onClick={() => onUpdate(setting.id, setting.value)}
                className="bg-primary hover:bg-primary-dark text-white p-4 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                title="Save Changes"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-700 uppercase tracking-widest">Protocol Advisory</p>
          <p className="text-xs text-amber-600/80 font-medium leading-relaxed">
            Modifications to sectional credentials take immediate effect. Existing active sessions will remain valid, but all new authentication requests will require the updated credentials. Please ensure all department heads are notified post-update.
          </p>
        </div>
      </div>
    </div>
  );
}
