'use client';
import { useState, useEffect } from 'react';
import { Star, Zap, Sparkles, Heart, User, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/gameStore';
import { showToast } from '@/components/ToastNotification';

type Tab = 'avatars' | 'perks';

const FALLBACK_AVATARS = [
  { id: 'b01a3333-3333-4333-a333-333333333333', name: 'Bilal Elite',    item_type: 'avatar', price: 200, image_url: '/avatars/boy3.png' },
  { id: 'b01a4444-4444-4444-a444-444444444444', name: 'Hassan Prime',   item_type: 'avatar', price: 200, image_url: '/avatars/boy4.png' },
  { id: 'b01a5555-5555-4555-a555-555555555555', name: 'Hamza Ultra',    item_type: 'avatar', price: 250, image_url: '/avatars/boy5.png' },
  { id: 'b01a6666-6666-4666-a666-666666666666', name: 'Farhan Pro',     item_type: 'avatar', price: 250, image_url: '/avatars/boy6.png' },
  { id: 'b01a7777-7777-4777-a777-777777777777', name: 'Asad Pro Max',   item_type: 'avatar', price: 300, image_url: '/avatars/boy7.png' },
  { id: 'b01a8888-8888-4888-a888-888888888888', name: 'Abdullah King',  item_type: 'avatar', price: 300, image_url: '/avatars/boy8.png' },
  { id: 'c01a3333-3333-4333-a333-333333333333', name: 'Zara Elite',     item_type: 'avatar', price: 200, image_url: '/avatars/girl3.png' },
  { id: 'c01a4444-4444-4444-a444-444444444444', name: 'Noor Prime',     item_type: 'avatar', price: 200, image_url: '/avatars/girl4.png' },
  { id: 'c01a5555-5555-4555-a555-555555555555', name: 'Layla Apex',     item_type: 'avatar', price: 250, image_url: '/avatars/girl5.png' },
  { id: 'c01a6666-6666-4666-a666-666666666666', name: 'Aysha Elite',    item_type: 'avatar', price: 250, image_url: '/avatars/girl6.png' },
  { id: 'c01a7777-7777-4777-a777-777777777777', name: 'Insha Ultimate', item_type: 'avatar', price: 300, image_url: '/avatars/girl7.png' },
  { id: 'c01a8888-8888-4888-a888-888888888888', name: 'Amna Ultra',     item_type: 'avatar', price: 300, image_url: '/avatars/girl8.png' },
];

const FALLBACK_PERKS = [
  { id: 'd01a5555-5555-4555-a555-555555555555', name: 'Hint Bundle', item_type: 'perk', price: 150, image_url: null, description: 'Get 3 hint tokens to use during quizzes', icon: 'hint' },
  { id: 'e01a6666-6666-4666-a666-666666666666', name: 'Heart Refill', item_type: 'perk', price: 100, image_url: null, description: 'Refill all 5 hearts instantly', icon: 'heart' },
  { id: 'd01a7777-7777-4777-a777-777777777777', name: 'Double XP Boost', item_type: 'perk', price: 300, image_url: null, description: 'Earn double XP for your next lesson', icon: 'zap' },
];

export default function ShopPage() {
  const { user, updateXP } = useGameStore();
  const [activeTab, setActiveTab] = useState<Tab>('avatars');
  const [avatars, setAvatars] = useState<any[]>(FALLBACK_AVATARS);
  const [perks, setPerks] = useState<any[]>(FALLBACK_PERKS);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .order('price', { ascending: true });

      if (!error && data && data.length > 0) {
        setAvatars(data.filter((i: any) => i.item_type === 'avatar'));
        setPerks(data.filter((i: any) => i.item_type === 'perk'));
      }

      if (user?.id) {
        const { data: purchases } = await supabase
          .from('user_purchases')
          .select('item_id')
          .eq('user_id', user.id);
        if (purchases) setPurchasedIds(purchases.map((p: any) => p.item_id));
      }

      setIsLoading(false);
    };
    fetchItems();
  }, [user?.id]);

  const handlePurchase = async (item: any) => {
    if (!user) return;
    if (user.xp < item.price) {
      showToast({ type: 'warning', title: 'Not Enough XP', message: `You need ${item.price} XP but only have ${user.xp}.` });
      return;
    }

    if (item.item_type === 'avatar' && purchasedIds.includes(item.id)) {
      const { updateAvatar } = useGameStore.getState();
      updateAvatar(item.image_url);
      showToast({ type: 'success', title: 'Avatar Equipped!', message: `${item.name} is now your avatar.` });
      return;
    }

    const { error } = await supabase.from('user_purchases').insert({ user_id: user.id, item_id: item.id });

    if (error && error.code === '23505' && item.item_type === 'avatar') {
      const { updateAvatar } = useGameStore.getState();
      updateAvatar(item.image_url);
      showToast({ type: 'success', title: 'Avatar Equipped!', message: `${item.name} equipped.` });
      return;
    }

    if (!error) {
      setPurchasedIds(prev => [...prev, item.id]);
      updateXP(-item.price);
      const { updateAvatar, addPerk } = useGameStore.getState();

      if (item.item_type === 'avatar') {
        updateAvatar(item.image_url);
        showToast({ type: 'purchase', title: 'Avatar Purchased!', message: `${item.name} equipped.` });
      } else if (item.icon === 'hint' || item.name?.toLowerCase().includes('hint')) {
        addPerk('hints', 3);
        showToast({ type: 'purchase', title: 'Hints Added!', message: '3 hint tokens added to your account.' });
      } else if (item.icon === 'heart' || item.name?.toLowerCase().includes('refill') || item.name?.toLowerCase().includes('heart')) {
        addPerk('refills', 1);
        showToast({ type: 'purchase', title: 'Heart Refill Added!', message: '1 full heart refill added.' });
      } else {
        showToast({ type: 'purchase', title: 'Purchased!', message: `${item.name} added to your account.` });
      }
    } else {
      showToast({ type: 'error', title: 'Purchase Failed', message: 'Something went wrong. Please try again.' });
    }
  };

  const handleEquip = (item: any) => {
    const { updateAvatar } = useGameStore.getState();
    updateAvatar(item.image_url);
    showToast({ type: 'success', title: 'Avatar Equipped!', message: `${item.name} is now your avatar.` });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Store</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Spend your XP on avatars and power-ups</p>
          </div>
          <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 flex items-center gap-4 shadow-xl shadow-slate-200/40">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Your Balance</p>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-slate-900">{user?.xp || 0}</span>
                <span className="text-xs font-bold text-slate-400 uppercase">XP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex gap-2 shadow-sm">
          <button
            id="tab-avatars"
            onClick={() => setActiveTab('avatars')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all ${activeTab === 'avatars' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <User className="w-4 h-4" />
            Avatars
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'avatars' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{avatars.length}</span>
          </button>
          <button
            id="tab-perks"
            onClick={() => setActiveTab('perks')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all ${activeTab === 'perks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Package className="w-4 h-4" />
            Game Perks
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === 'perks' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{perks.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {activeTab === 'avatars' && (
            <motion.div
              key="avatars"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h2 className="text-base font-black text-slate-700 uppercase tracking-widest">Available Avatars</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {avatars.map((item, index) => {
                    const isOwned = purchasedIds.includes(item.id);
                    const isEquipped = user?.avatar_url === item.image_url;
                    return (
                      <AvatarCard key={item.id} item={item} index={index} isOwned={isOwned} isEquipped={isEquipped} userXp={user?.xp || 0} onPurchase={handlePurchase} onEquip={handleEquip} />
                    );
                  })}
                </div>
              </section>
            </motion.div>
          )}

          {/* ── PERKS TAB ── */}
          {activeTab === 'perks' && (
            <motion.div
              key="perks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Power-ups to help you learn faster</p>
              {perks.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="bg-white p-5 rounded-[2rem] border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-all hover:shadow-xl hover:shadow-slate-200/50 group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 text-blue-600 flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:text-white">
                      {item.icon === 'heart' || item.name?.toLowerCase().includes('heart') || item.name?.toLowerCase().includes('refill')
                        ? <Heart className="w-7 h-7" />
                        : item.icon === 'zap' || item.name?.toLowerCase().includes('boost')
                          ? <Zap className="w-7 h-7" />
                          : <Sparkles className="w-7 h-7" />}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{item.name}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {item.description || (item.name?.toLowerCase().includes('hint') ? '3 Hint Tokens to skip hard questions' : item.name?.toLowerCase().includes('heart') || item.name?.toLowerCase().includes('refill') ? 'Refill all your hearts to full' : 'Power-up for your learning')}
                      </p>
                    </div>
                  </div>
                  <button
                    id={`buy-perk-${item.id}`}
                    onClick={() => handlePurchase(item)}
                    className="ml-4 px-5 py-3 bg-slate-50 hover:bg-blue-600 text-slate-900 hover:text-white font-black rounded-2xl flex items-center gap-2 transition-all text-xs uppercase tracking-widest shrink-0 group-hover:shadow-lg group-hover:shadow-blue-600/20"
                  >
                    <Star className={`w-4 h-4 fill-current ${user?.xp && user.xp >= item.price ? 'text-amber-500 group-hover:text-amber-300' : 'text-slate-400'}`} />
                    {item.price}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AvatarCard({ item, index, isOwned, isEquipped, userXp, onPurchase, onEquip }: {
  item: any; index: number; isOwned: boolean; isEquipped: boolean; userXp: number;
  onPurchase: (item: any) => void; onEquip: (item: any) => void;
}) {
  const canAfford = userXp >= item.price;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-[1.75rem] p-4 border-2 flex flex-col items-center group transition-all cursor-pointer ${isEquipped ? 'border-blue-500 shadow-xl shadow-blue-100/60' : 'border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200/60'}`}
    >
      <div className={`w-20 h-20 rounded-full border-4 shadow-inner overflow-hidden bg-slate-100 mb-4 group-hover:scale-105 transition-transform duration-300 ${isEquipped ? 'border-blue-400' : 'border-slate-100'}`}>
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="text-[11px] font-black text-slate-900 text-center mb-2 uppercase tracking-tight leading-tight">{item.name}</h3>

      {isEquipped ? (
        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">✓ Equipped</span>
      ) : isOwned ? (
        <button
          id={`equip-${item.id}`}
          onClick={() => onEquip(item)}
          className="w-full mt-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-black py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all"
        >
          Equip
        </button>
      ) : (
        <button
          id={`buy-${item.id}`}
          onClick={() => onPurchase(item)}
          className={`w-full mt-1 font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] uppercase tracking-widest ${canAfford ? 'bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white' : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'}`}
          disabled={!canAfford}
        >
          <Star className={`w-3 h-3 fill-current ${canAfford ? 'text-amber-500' : 'text-slate-300'}`} />
          {item.price}
        </button>
      )}
    </motion.div>
  );
}
