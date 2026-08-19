'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Eye, EyeOff, ExternalLink, CheckCircle2, AlertCircle, Sparkles, X, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, removeStoredApiKey, validateApiKey } from '@/lib/gemini';
import { showToast } from '@/components/ToastNotification';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  forceRequired?: boolean;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSuccess,
  forceRequired = false,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getStoredApiKey();
      if (existing) {
        setApiKey(existing);
        setHasExistingKey(true);
      } else {
        setApiKey('');
        setHasExistingKey(false);
      }
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setErrorMessage('Please enter your Gemini API key.');
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      const result = await validateApiKey(cleanKey);
      if (result.valid) {
        setStoredApiKey(cleanKey);
        showToast({
          type: 'success',
          title: 'Gemini AI Connected',
          message: 'Your API key was saved securely.',
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please check your key.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveKey = () => {
    removeStoredApiKey();
    setApiKey('');
    setHasExistingKey(false);
    showToast({
      type: 'info',
      title: 'Key Removed',
      message: 'Your Gemini API key has been removed.',
    });
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={(e) => {
          if (!forceRequired && e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl shadow-slate-900/10 relative overflow-hidden"
        >
          {/* Close button if not forced */}
          {!forceRequired && (
            <button
              type="button"
              id="close-gemini-api-modal-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-6 right-6 p-2.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all z-30 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  AI Integration
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Gemini API Configuration
              </h2>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 space-y-2">
            <p className="text-slate-700 font-semibold text-sm leading-relaxed">
              Connect your Google Gemini API key to continue uninterrupted.
            </p>
            <p className="text-xs text-slate-500 font-medium leading-normal">
              Al Imran AI features a high-capacity managed key pool. Connecting your own free API key acts as an instant dedicated backup whenever public traffic is high.
            </p>
          </div>

          {/* Step Guide / Get Key Button */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-blue-900">Don’t have an API key yet?</span>
            </div>
            <a
              id="get-gemini-api-key-btn"
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
            >
              Get Gemini API Key
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
                Gemini API Key
              </label>
              <div className="relative flex items-center">
                <input
                  id="gemini-api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Paste your key here (e.g. AIzaSy...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 font-mono focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  id="toggle-show-api-key-btn"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-all"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                id="save-gemini-api-key-btn"
                disabled={isValidating || !apiKey.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50 active:scale-[0.98]"
              >
                {isValidating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Validating Key...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Continue &amp; Save API Key</span>
                  </>
                )}
              </button>

              {hasExistingKey && (
                <button
                  type="button"
                  id="remove-gemini-api-key-btn"
                  onClick={handleRemoveKey}
                  className="w-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold py-2.5 rounded-xl transition-all text-xs tracking-wider uppercase"
                >
                  Remove Key from Device
                </button>
              )}
            </div>
          </form>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted local storage • Never shared publicly</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
