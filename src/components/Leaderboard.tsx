import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { safeParseResponse } from '../utils';
import { Trophy, Medal, Award, Flame, Search, CheckCircle2, Shield } from 'lucide-react';

interface LeaderboardProps {
  token: string;
}

export default function Leaderboard({ token }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeParseResponse(res);
      if (res.ok) {
        setEntries(data);
      } else {
        console.error('Failed to load leaderboard:', data.error || 'API responded with an error');
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredEntries = entries.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full shrink-0 shadow-sm animate-bounce">
            <Trophy className="w-5 h-5" />
          </div>
        );
      case 2:
        return (
          <div className="p-1.5 bg-slate-300/10 border border-slate-300/20 text-slate-300 rounded-full shrink-0 shadow-sm">
            <Medal className="w-5 h-5" />
          </div>
        );
      case 3:
        return (
          <div className="p-1.5 bg-amber-600/10 border border-amber-600/20 text-amber-600 rounded-full shrink-0 shadow-sm">
            <Award className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <span className="w-8 text-center text-xs text-slate-500 font-bold font-mono">
            #{rank}
          </span>
        );
    }
  };

  const getHeroTier = (points: number) => {
    if (points >= 400) return { name: 'Platinum Guardian', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' };
    if (points >= 250) return { name: 'Gold Advocate', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
    if (points >= 150) return { name: 'Silver Defender', color: 'text-slate-300 bg-slate-300/10 border-slate-300/20' };
    return { name: 'Civic Scout', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
  };

  return (
    <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 md:p-8 shadow-xl max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center border-b border-white/5 pb-6">
        <div className="inline-flex p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 mb-3">
          <Trophy className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white">Hyperlocal Hero Leaderboard</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Honoring citizens who actively report issues, verify cases, and help clean up our municipality.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute top-2.5 left-3.5 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search citizens by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
        />
      </div>

      {/* Leaderboard Table List */}
      {isLoading ? (
        <div className="space-y-3 py-10">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-14 bg-[#0a0a0b]/40 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry, idx) => {
            const tier = getHeroTier(entry.points);
            const rank = entry.rank || (idx + 1);

            return (
              <div 
                key={entry.userId}
                className="p-3.5 bg-[#0a0a0b] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-4 transition shadow-sm"
              >
                {/* Left: Rank, Avatar, Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(rank)}
                  
                  <img 
                    src={entry.avatar} 
                    alt={entry.name} 
                    className="w-10 h-10 rounded-full border border-white/10 bg-[#0d0d0f] shrink-0 object-cover" 
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{entry.name}</h4>
                    
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border font-mono font-medium ${tier.color}`}>
                        {tier.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {entry.reportsCount} Reports
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Points */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-orange-400 font-mono">
                    {entry.points}
                  </span>
                  <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-semibold font-mono">
                    Hero Points
                  </span>
                </div>

              </div>
            );
          })}

          {filteredEntries.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-10">No active Heroes match your search filter.</p>
          )}
        </div>
      )}

      {/* Rules Footer */}
      <div className="p-4 bg-[#0a0a0b] border border-white/5 rounded-xl flex items-start gap-3">
        <Flame className="w-5 h-5 text-orange-500 shrink-0" />
        <div className="text-[10px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-200 block mb-0.5">How to climb the Leaderboard?</span>
          File unique complaints to earn <b>+50 points</b>. Complete on-site verifications for <b>+15 points</b>. Get your submitted issues successfully resolved by municipal crews to earn a massive <b>+100 points</b> bonus!
        </div>
      </div>

    </div>
  );
}
