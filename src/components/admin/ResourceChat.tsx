'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, FileUp, Image as ImageIcon, Trash2, Eye, ChevronLeft, ChevronRight, Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResourceChatProps {
  batches: any[];
  selectedBatchId: string | null;
  setSelectedBatchId: (id: string | null) => void;
  messages: any[];
  chatMembers: any[];
  onSendMessage: (text: string, isLink?: boolean, linkData?: { title: string, url: string }) => void;
  onDeleteMessage: (id: string) => void;
  onImageSelect: (file: File) => void;
  onRevealIdentity: (anonName: string) => void;
  isUploading: boolean;
  imagePreview: string | null;
  onClearImage: () => void;
  onUploadImage: () => void;
  currentUserId: string;
}

export default function ResourceChat({
  batches,
  selectedBatchId,
  setSelectedBatchId,
  messages,
  chatMembers,
  onSendMessage,
  onDeleteMessage,
  onImageSelect,
  onRevealIdentity,
  isUploading,
  imagePreview,
  onClearImage,
  onUploadImage,
  currentUserId
}: ResourceChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedBatchId]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleLinkSubmit = () => {
    if (!linkTitle || !linkUrl) return;
    onSendMessage('', true, { title: linkTitle, url: linkUrl });
    setShowLinkModal(false);
    setLinkTitle('');
    setLinkUrl('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, msg: any) => {
    const date = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-180px)] flex flex-col md:flex-row gap-6">
      {/* Batch Selector */}
      <div className={`bg-surface rounded-3xl border border-gray-200 flex flex-col transition-all duration-500 overflow-hidden shadow-sm ${
        selectedBatchId ? 'hidden md:flex md:w-80' : 'flex-1 md:w-80'
      }`}>
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-foreground mb-1">Group Chats</h2>
          <p className="text-xs text-gray-500 font-medium">Select a group to start messaging.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {batches.map((batch) => (
            <button
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 group ${
                selectedBatchId === batch.id
                  ? 'bg-primary border-primary shadow-lg shadow-primary/20'
                  : 'bg-gray-50 border-gray-100 hover:bg-white hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  selectedBatchId === batch.id ? 'bg-white/20' : (batch.group_type === 'boys' ? 'bg-blue-100' : 'bg-pink-100')
                }`}>
                  <Users2 className={`w-5 h-5 ${selectedBatchId === batch.id ? 'text-white' : (batch.group_type === 'boys' ? 'text-blue-600' : 'text-pink-600')}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold tracking-tight truncate ${selectedBatchId === batch.id ? 'text-white' : 'text-foreground'}`}>{batch.name}</h3>
                    <ChevronRight className={`w-4 h-4 transition-transform flex-shrink-0 ${selectedBatchId === batch.id ? 'translate-x-1 text-white' : 'text-gray-400 group-hover:translate-x-1'}`} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    selectedBatchId === batch.id ? 'bg-white/20 text-white' : (batch.group_type === 'boys' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600')
                  }`}>
                    {batch.group_type === 'boys' ? 'Boys' : 'Girls'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <AnimatePresence mode="wait">
        {selectedBatchId ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            key="chat-window"
            className="flex-1 min-w-0 flex flex-col overflow-hidden rounded-3xl border border-gray-200 shadow-sm relative"
            style={{ background: '#f0f2f5' }}
          >
            {/* WhatsApp-style Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedBatchId(null)}
                  className="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-all md:hidden"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedBatch?.group_type === 'boys' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                  <Users2 className={`w-5 h-5 ${selectedBatch?.group_type === 'boys' ? 'text-blue-600' : 'text-pink-600'}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">{selectedBatch?.name}</h3>
                  <p className="text-xs text-green-600 font-semibold">{chatMembers.length} members</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBatchId(null)}
                className="hidden md:flex p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-primary hover:border-primary transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Messages — WhatsApp Style */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth">
              {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
                <div key={date}>
                  {/* Date Divider */}
                  <div className="flex items-center justify-center my-4">
                    <span className="bg-white/90 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-gray-100">
                      {date}
                    </span>
                  </div>

                  {msgs.map((msg: any, i: number) => {
                    const isAdmin = msg.sender?.role === 'admin' || msg.sender_id === currentUserId;
                    const anonName = chatMembers.find((m: any) => m.user_id === msg.sender_id)?.anonymous_name;
                    const senderName = isAdmin ? '🎓 Teacher' : (anonName || 'Student');
                    const showSenderName = !isAdmin && (i === 0 || msgs[i - 1]?.sender_id !== msg.sender_id);
                    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-1 group`}
                      >
                        <div className={`flex items-end gap-2 max-w-[75%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar (show for each new sender block) */}
                          {!isAdmin && (i === 0 || msgs[i - 1]?.sender_id !== msg.sender_id) ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                              <img src={msg.sender?.avatar_url || '/avatars/boy1.png'} className="w-full h-full object-cover" alt={senderName} />
                            </div>
                          ) : (
                            !isAdmin && <div className="w-8 flex-shrink-0" />
                          )}

                          <div className="relative">
                            {/* Message Bubble */}
                            <div
                              className={`px-4 py-2.5 shadow-sm relative ${
                                isAdmin
                                  ? 'bg-[#dcf8c6] text-gray-800 rounded-2xl rounded-tr-sm'
                                  : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm'
                              }`}
                              style={{ minWidth: '80px' }}
                            >
                              {/* Sender Name (for non-admin messages) */}
                              {showSenderName && !isAdmin && (
                                <p className="text-xs font-bold text-blue-600 mb-1">{senderName}</p>
                              )}
                              {isAdmin && showSenderName === false && (msgs[i - 1]?.sender_id !== msg.sender_id) && (
                                <p className="text-xs font-bold text-emerald-600 mb-1">🎓 Teacher</p>
                              )}

                              {/* Message Content */}
                              {msg.message_text?.includes('📎 Resource Shared:') ? (
                                <div className="flex flex-col gap-2 min-w-[180px]">
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Shared Resource</span>
                                  </div>
                                  <a
                                    href={msg.message_text.match(/\((.*?)\)/)?.[1]}
                                    target="_blank"
                                    className="text-sm font-semibold text-blue-600 underline underline-offset-2 hover:opacity-80 break-all"
                                  >
                                    {msg.message_text.match(/\[(.*?)\]/)?.[1]}
                                  </a>
                                </div>
                              ) : msg.message_text?.startsWith('🖼️ [IMAGE]') ? (
                                <div className="rounded-xl overflow-hidden max-w-[220px]">
                                  <img
                                    src={msg.message_text.match(/\((.*?)\)/)?.[1]}
                                    className="w-full h-auto cursor-zoom-in hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(msg.message_text.match(/\((.*?)\)/)?.[1], '_blank')}
                                  />
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed break-words">{msg.message_text}</p>
                              )}

                              {/* Time + Tick */}
                              <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : 'justify-end'}`}>
                                <span className="text-[10px] text-gray-400">{time}</span>
                                {isAdmin && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                              </div>
                            </div>

                            {/* Delete button (admin only, on hover) */}
                            {isAdmin && (
                              <button
                                onClick={() => onDeleteMessage(msg.id)}
                                className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <MessageCircle className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">No messages yet. Say hello! 👋</p>
                  </div>
                </div>
              )}
            </div>

            {/* Link Modal */}
            <AnimatePresence>
              {showLinkModal && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-20 left-4 right-4 p-5 bg-white rounded-2xl border border-gray-200 z-20 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-primary" />
                      Share Resource Link
                    </h4>
                    <button onClick={() => setShowLinkModal(false)} className="text-xs font-bold text-gray-400 hover:text-gray-700">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      placeholder="Resource Title (e.g. Past Tense PDF)"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none"
                    />
                    <input
                      placeholder="URL (https://...)"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:bg-white outline-none"
                    />
                  </div>
                  <button onClick={handleLinkSubmit} className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs">
                    Send Resource
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WhatsApp-Style Input */}
            <div className="p-3 bg-white border-t border-gray-100">
              {imagePreview ? (
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Image ready to send</p>
                    <p className="text-xs text-gray-400">Tap send to share with the group</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={onClearImage} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={onUploadImage}
                      disabled={isUploading}
                      className="px-5 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-all disabled:opacity-50 shadow-md shadow-primary/10"
                    >
                      {isUploading ? '...' : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  {/* Attachment buttons */}
                  <div className="flex gap-1 pb-0.5">
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(true)}
                      className="p-2.5 rounded-full bg-gray-100 text-gray-500 hover:text-primary hover:bg-primary/5 transition-all"
                      title="Share resource link"
                    >
                      <FileUp className="w-5 h-5" />
                    </button>
                    <label className="p-2.5 rounded-full bg-gray-100 text-gray-500 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer" title="Share image">
                      <ImageIcon className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImageSelect(e.target.files[0])} />
                    </label>
                  </div>

                  {/* Text input */}
                  <textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="flex-1 bg-gray-100 rounded-3xl px-5 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                    style={{ maxHeight: '120px' }}
                  />

                  {/* Send button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-40 transition-all flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center p-12"
            style={{ background: '#f0f2f5' }}
          >
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <MessageCircle className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">Select a Group</h3>
            <p className="text-gray-400 text-sm font-medium max-w-xs mx-auto">Choose a batch from the left panel to start sending messages and sharing resources.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Users2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 19a6 6 0 0 0-12 0" />
      <circle cx="8" cy="9" r="4" />
      <path d="M22 19a6 6 0 0 0-6-6 4 4 0 1 0 0-8" />
    </svg>
  );
}
