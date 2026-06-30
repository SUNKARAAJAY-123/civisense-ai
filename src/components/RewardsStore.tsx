import React, { useState, useEffect } from 'react';
import { RewardItem } from '../types';
import { Ticket, Gift, Sparkles, AlertCircle, ShoppingBag, CheckCircle2, Award } from 'lucide-react';

interface RewardsStoreProps {
  token: string;
  userPoints: number;
  onRefreshProfile: () => void;
}

export default function RewardsStore({
  token,
  userPoints,
  onRefreshProfile
}: RewardsStoreProps) {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rewards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRewards(data);
      }
    } catch (e) {
      console.error('Failed to load rewards:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleRedeem = async (item: RewardItem) => {
    setError(null);
    setSuccessMsg(null);

    if (userPoints < item.pointsCost) {
      setError(`You do not have enough Hero points to redeem this. You need ${item.pointsCost - userPoints} more points.`);
      return;
    }

    setRedeemingId(item.id);
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId: item.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Redemption rejected.');
      }

      setSuccessMsg(`Successfully redeemed! You have unlocked your "${item.title}". A confirmation code has been sent to your email.`);
      onRefreshProfile();
      fetchRewards(); // Refresh stock
    } catch (err: any) {
      setError(err.message || 'Failed to complete redemption.');
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header card with current points balance */}
      <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Gift className="w-5 h-5 text-orange-400" />
            <h2 className="font-display text-lg font-bold text-white">Civic Rewards Store</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Cash in your Community Hero points for transit passes, tree sponsorships, local roaster vouchers, or eco-friendly merchandise.
          </p>
        </div>

        <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl px-5 py-3 text-center shrink-0">
          <span className="text-xl font-bold font-mono text-orange-400 block">{userPoints}</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Available Points Balance</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-orange-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-44 bg-[#0d0d0f]/40 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rewards.map(item => {
            const hasEnough = userPoints >= item.pointsCost;
            return (
              <div 
                key={item.id}
                className="bg-[#0d0d0f] border border-white/5 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group transition-all hover:border-white/10 hover:shadow-xl"
              >
                {/* Upper Details */}
                <div className="p-4 flex gap-4">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-20 h-20 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition duration-300" 
                  />

                  <div className="min-w-0">
                    <span className="px-1.5 py-0.5 bg-[#0a0a0b] border border-white/10 rounded-md text-[8px] uppercase tracking-wider text-slate-400 font-mono font-medium">
                      {item.category}
                    </span>
                    <h3 className="text-xs font-bold text-white mt-1 group-hover:text-orange-400 transition">{item.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                {/* Lower Action & Pricing */}
                <div className="px-4 py-3 bg-[#0a0a0b] border-t border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold font-mono text-orange-400">{item.pointsCost}</span>
                    <span className="text-[9px] text-slate-400 font-medium ml-1 uppercase">Points</span>
                    <span className="block text-[8px] text-slate-500 font-mono mt-0.5">
                      {item.stock} left in stock
                    </span>
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={redeemingId !== null || item.stock <= 0}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                      item.stock <= 0 
                        ? 'bg-[#0d0d0f] text-slate-500 cursor-not-allowed border border-white/5'
                        : hasEnough 
                          ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-md' 
                          : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
                    }`}
                  >
                    {redeemingId === item.id ? (
                      <span>Redeeming...</span>
                    ) : item.stock <= 0 ? (
                      <span>Sold Out</span>
                    ) : hasEnough ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Redeem</span>
                      </>
                    ) : (
                      <span>Insufficient Points</span>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
