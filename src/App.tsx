import React, { useState, useEffect } from 'react';
import { 
  Shield, Map, Trophy, Gift, LogOut, Bell, Compass, 
  MapPin, CheckCircle2, AlertTriangle, ArrowRight, 
  MessageSquare, ThumbsUp, CheckSquare, Sparkles, Navigation, 
  Plus, Calendar, Share2, CornerDownRight, ExternalLink, X, Eye
} from 'lucide-react';
import AuthPage from './components/AuthPage';
import MapContainer from './components/MapContainer';
import ReportIssueModal from './components/ReportIssueModal';
import AdminDashboard from './components/AdminDashboard';
import Leaderboard from './components/Leaderboard';
import RewardsStore from './components/RewardsStore';
import { Issue, Comment, Notification, User } from './types';
import { safeParseResponse } from './utils';

export default function App() {
  // Session State
  const [token, setToken] = useState<string | null>(localStorage.getItem('hero_token'));
  const [user, setUser] = useState<User | null>(
    localStorage.getItem('hero_user') ? JSON.parse(localStorage.getItem('hero_user')!) : null
  );

  // Layout / Navigation States
  const [activeTab, setActiveTab] = useState<'map' | 'leaderboard' | 'store' | 'admin'>('map');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [prefilledCoords, setPrefilledCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Sidebar Filtering states
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch active issues
  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/issues');
      const data = await safeParseResponse(res);
      if (res.ok) {
        setIssues(data);
        
        // Keep selected issue in sync if currently viewed
        if (selectedIssue) {
          const updated = data.find((i: Issue) => i.id === selectedIssue.id);
          if (updated) setSelectedIssue(updated);
        }
      } else {
        console.error('Failed to load issues:', data.error || 'API responded with an error');
      }
    } catch (e) {
      console.error('Failed to load issues:', e);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeParseResponse(res);
      if (res.ok) {
        setNotifications(data);
      } else {
        console.error('Failed to load notifications:', data.error || 'API responded with an error');
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  // Fetch user profile
  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeParseResponse(res);
      if (res.ok) {
        setUser(data);
        localStorage.setItem('hero_user', JSON.stringify(data));
      } else {
        console.error('Failed to load user profile:', data.error || 'API responded with an error');
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }
  };

  // Fetch comments of selected issue
  const fetchComments = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      const data = await safeParseResponse(res);
      if (res.ok) {
        setComments(data.comments);
      } else {
        console.error('Failed to load comments:', data.error || 'API responded with an error');
      }
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
  };

  useEffect(() => {
    fetchIssues();
    if (token) {
      fetchNotifications();
      fetchProfile();
    }
  }, [token]);

  useEffect(() => {
    if (selectedIssue) {
      fetchComments(selectedIssue.id);
    }
  }, [selectedIssue]);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('hero_token', newToken);
    localStorage.setItem('hero_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    
    // Redirect admins directly to the Admin Dashboard
    if (newUser.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('map');
    }
    showToast(`Welcome back, ${newUser.name}! 🌟`);
  };

  const handleLogout = () => {
    localStorage.removeItem('hero_token');
    localStorage.removeItem('hero_user');
    setToken(null);
    setUser(null);
    setSelectedIssue(null);
    setActiveTab('map');
    showToast('Signed out of Community Hero.');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Trigger upvoting
  const handleVote = async (issueId: string) => {
    if (!token) {
      showToast('Please sign in to upvote issues.');
      return;
    }
    try {
      const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeParseResponse(res);
      if (res.ok) {
        showToast(data.voted ? 'Upvoted report! 👍' : 'Upvote removed.');
        fetchIssues();
      } else {
        showToast(data.error || 'Upvote request failed.');
      }
    } catch (e) {
      console.error('Failed to upvote:', e);
    }
  };

  // Trigger verifications
  const handleVerify = async (issueId: string) => {
    if (!token) {
      showToast('Please sign in to verify reports.');
      return;
    }
    try {
      const res = await fetch(`/api/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeParseResponse(res);
      if (res.ok) {
        showToast('Successfully verified on-site! +15 Points Earned! 🎖️');
        fetchIssues();
        fetchProfile();
      } else {
        showToast(data.error || 'Verification error.');
      }
    } catch (e) {
      console.error('Failed to verify:', e);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Please sign in to write comments.');
      return;
    }
    if (!newCommentText.trim() || !selectedIssue) return;

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newCommentText })
      });

      const data = await safeParseResponse(res);
      if (res.ok) {
        setNewCommentText('');
        fetchComments(selectedIssue.id);
        fetchIssues(); // Refresh comments counts
      } else {
        setFetchError(data.error || 'Failed to post comment.');
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
    }
  };

  // Mark all notifications as read
  const handleReadAllNotifs = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (e) {
      console.error('Failed to read all notifications:', e);
    }
  };

  const handleMapDoubleClick = (coords: { lat: number; lng: number; address: string }) => {
    if (!token) {
      showToast('Please sign in to report community issues.');
      return;
    }
    setPrefilledCoords(coords);
    setIsReportModalOpen(true);
  };

  const handleReportSuccess = (newIssue: any) => {
    setIsReportModalOpen(false);
    setPrefilledCoords(null);
    fetchIssues();
    fetchProfile();
    setSelectedIssue(newIssue);
    showToast(newIssue.duplicateOf ? 'Duplicate matched & linked! 🔗' : 'AI generated complaint logged! +50 Points 🚀');
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'assigned': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-100 flex flex-col md:flex-row relative font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0d0d0f] border border-white/10 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-2.5 text-xs font-semibold text-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* LEFT NAVIGATION DRAWER / SIDEBAR (Apple-Minimalist Rail Layout) */}
      <aside className="w-full md:w-64 bg-[#0d0d0f] border-b md:border-b-0 md:border-r border-white/5 shrink-0 flex flex-col justify-between">
        <div className="p-5 space-y-8">
          
          {/* Logo Brand Header */}
          <div className="flex items-center gap-2.5 pl-1.5">
            <div className="p-2 bg-orange-500 rounded-xl text-white shadow-md shadow-orange-500/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold tracking-tight text-white">Community Hero</h1>
              <span className="text-[9px] text-orange-400 font-mono font-bold tracking-wider uppercase">AI Civics Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('map'); setSelectedIssue(null); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === 'map' 
                  ? 'bg-white/5 text-white border border-white/10 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Map className="w-4 h-4 text-orange-400" />
              <span>Interactive Map</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === 'leaderboard' 
                  ? 'bg-white/5 text-white border border-white/10 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Hero Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('store')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === 'store' 
                  ? 'bg-white/5 text-white border border-white/10 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gift className="w-4 h-4 text-indigo-400" />
              <span>Rewards Store</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-white/5 text-white border border-white/10 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Admin Portal</span>
              </button>
            )}
          </nav>

          {/* Map Filters List (Only visible when active tab is map) */}
          {activeTab === 'map' && (
            <div className="pt-4 border-t border-white/5 space-y-4">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold pl-1.5">Map Pin Filters</span>
              
              <div className="space-y-3">
                {/* Status Filter */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 pl-1.5">Resolution</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open (New)</option>
                    <option value="assigned">Assigned</option>
                    <option value="resolved">Resolved</option>
                    <option value="duplicate">Duplicates</option>
                  </select>
                </div>

                {/* Severity Filter */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1 pl-1.5">Severity Scale</label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* User Sidebar Footer Profile */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full border border-white/10 object-cover bg-[#0a0a0b] shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
              <span className="block text-[9px] text-orange-400 font-mono font-semibold">
                {user.points} Hero Pts
              </span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-xl transition shrink-0 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-5 md:p-8 flex flex-col space-y-6 overflow-y-auto max-h-screen bg-[#0a0a0b]">
        
        {/* TOP BAR / HEADER ROWS */}
        <header className="flex items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-slate-400" />
            <div className="text-xs font-semibold text-slate-300">
              Portal / <span className="text-white capitalize">{activeTab} View</span>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            
            {/* Quick Report Trigger Button */}
            {user.role === 'citizen' && (
              <button
                onClick={() => { setPrefilledCoords(null); setIsReportModalOpen(true); }}
                className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white rounded-xl shadow-lg shadow-orange-500/10 flex items-center gap-1 transition cursor-pointer animate-pulse-slow"
              >
                <Plus className="w-4 h-4" />
                <span>Report Issue</span>
              </button>
            )}

            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); }}
                className="p-2 bg-[#0d0d0f] border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl transition relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                )}
              </button>

              {/* Droplist Box */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0d0d0f] border border-white/5 rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-white/5 bg-[#0a0a0b] flex items-center justify-between">
                    <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold">Alert Inbox</span>
                    <button 
                      onClick={handleReadAllNotifs}
                      className="text-[9px] text-orange-400 hover:text-orange-300 font-bold transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-3 text-2xs transition ${notif.read ? 'bg-transparent text-slate-400' : 'bg-white/5 text-slate-200'}`}
                      >
                        <div className="font-semibold text-slate-200 flex items-center justify-between mb-0.5">
                          <span>{notif.title}</span>
                          <span className="text-[8px] text-slate-500 font-mono">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-slate-400">{notif.message}</p>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <p className="text-center py-6 text-[10px] text-slate-500">Inbox is completely empty.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* PRIMARY VIEW CONTENT */}
        <div className="flex-1">
          {activeTab === 'map' && (
            <div className="space-y-6">
              
              {/* Map container stage */}
              <MapContainer 
                issues={issues}
                selectedIssue={selectedIssue}
                onSelectIssue={(iss) => setSelectedIssue(iss)}
                onMapDoubleClick={handleMapDoubleClick}
                filterStatus={filterStatus}
                filterSeverity={filterSeverity}
              />

              {/* Selected Issue detail panel (Rendered when pin is clicked) */}
              {selectedIssue && (
                <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col lg:flex-row gap-6 animate-in slide-in-from-bottom-4 duration-300 relative">
                  
                  {/* Close button for pin detail */}
                  <button 
                    onClick={() => setSelectedIssue(null)}
                    className="absolute top-4 right-4 p-1.5 bg-[#0a0a0b] border border-white/10 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Left Column: Image and Location coordinates */}
                  <div className="w-full lg:w-1/3 shrink-0 flex flex-col gap-3">
                    <img 
                      src={selectedIssue.image || 'https://via.placeholder.com/350'} 
                      alt="Complaint snapshot" 
                      className="w-full h-44 rounded-xl object-cover border border-white/5 shadow-md"
                    />
                    
                    <div className="p-3 bg-[#0a0a0b] border border-white/5 rounded-xl flex items-start gap-2 text-2xs">
                      <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-slate-200">Hyperlocal Location</span>
                        <p className="text-slate-400 mt-0.5">{selectedIssue.location.address}</p>
                        <span className="block text-[9px] text-slate-600 mt-1 font-mono">
                          GPS: {selectedIssue.location.lat.toFixed(4)}, {selectedIssue.location.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Analysis details */}
                  <div className="flex-1 space-y-4">
                    
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded-md font-bold ${getSeverityBadgeColor(selectedIssue.severity)}`}>
                          Severity: {selectedIssue.severity}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded-md font-bold ${getStatusBadgeColor(selectedIssue.status)}`}>
                          {selectedIssue.status}
                        </span>
                        <span className="text-2xs text-slate-400 font-medium font-mono">
                          Category: <b>{selectedIssue.category}</b>
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-white mt-2 flex items-center gap-1.5">
                        <span>{selectedIssue.title}</span>
                        {!selectedIssue.duplicateOf && (
                          <Sparkles className="w-4 h-4 text-orange-400 animate-pulse shrink-0" title="AI Generated Details" />
                        )}
                      </h3>

                      {/* Duplicate Alert */}
                      {selectedIssue.status === 'duplicate' && selectedIssue.duplicateOf && (
                        <div className="mt-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2 text-2xs text-indigo-400">
                          <CornerDownRight className="w-4 h-4 shrink-0" />
                          <span>
                            AI detected this report is a duplicate of master issue 
                            <button 
                              onClick={() => {
                                const master = issues.find(i => i.id === selectedIssue.duplicateOf);
                                if (master) setSelectedIssue(master);
                              }}
                              className="font-bold underline hover:text-indigo-300 ml-1 inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              #{selectedIssue.duplicateOf.substring(4, 8)} <ExternalLink className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI Generated Complaint Text */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">AI Generated Complaint Logs</span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-[#0a0a0b] p-3.5 border border-white/5 rounded-xl">
                        {selectedIssue.description}
                      </p>
                    </div>

                    {/* Meta Fields (Dept, Urgency, Precautions) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#0a0a0b] border border-white/5 rounded-xl text-2xs">
                        <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Responsible Department</span>
                        <span className="text-slate-300 font-semibold mt-0.5 block">{selectedIssue.department}</span>
                      </div>

                      <div className="p-3 bg-[#0a0a0b] border border-white/5 rounded-xl text-2xs">
                        <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">AI Estimate Urgency / Timeline</span>
                        <span className="text-slate-300 font-semibold mt-0.5 block">{selectedIssue.urgency} / {selectedIssue.estimatedResolution}</span>
                      </div>

                      <div className="p-3 bg-[#0a0a0b] border border-white/5 rounded-xl text-2xs md:col-span-2">
                        <span className="text-slate-500 block uppercase tracking-wider text-[8px] font-bold">Suggested Safety Precautions</span>
                        <p className="text-slate-400 mt-1 leading-relaxed">{selectedIssue.precautions}</p>
                      </div>

                      {selectedIssue.status === 'resolved' && selectedIssue.resolutionDetails && (
                        <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl text-2xs md:col-span-2">
                          <span className="text-orange-400 block uppercase tracking-wider text-[8px] font-bold">Official Resolution Details</span>
                          <p className="text-orange-300 mt-1 leading-relaxed font-semibold">{selectedIssue.resolutionDetails}</p>
                          <span className="text-[9px] text-slate-500 mt-1.5 block">Resolved by: <b>{selectedIssue.assignedTo || 'Municipal Technicians'}</b></span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (Upvote, Verify, Comment count) */}
                    <div className="flex flex-wrap gap-3 border-t border-white/5 pt-4">
                      
                      {/* Upvote button */}
                      <button
                        onClick={() => handleVote(selectedIssue.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-2xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          selectedIssue.upvotes.includes(user.id)
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/10'
                            : 'bg-[#0a0a0b] hover:bg-white/5 border border-white/10 text-slate-300'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Upvote ({selectedIssue.upvotes.length})</span>
                      </button>

                      {/* Verify button */}
                      {user.role === 'citizen' && selectedIssue.reporterId !== user.id && (
                        <button
                          onClick={() => handleVerify(selectedIssue.id)}
                          disabled={selectedIssue.verifications.includes(user.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-2xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                            selectedIssue.verifications.includes(user.id)
                              ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                              : 'bg-[#0a0a0b] hover:bg-white/5 border border-white/10 text-slate-300'
                          }`}
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-orange-400" />
                          <span>
                            {selectedIssue.verifications.includes(user.id) ? 'Verified' : 'Verify On-Site (+15 Points)'}
                          </span>
                        </button>
                      )}

                      {/* Comment Section Panel */}
                      <div className="w-full space-y-3 pt-3">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Community Conversations</span>
                        
                        {/* comments list */}
                        <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                          {comments.map(c => (
                            <div key={c.id} className="p-2.5 bg-[#0a0a0b] border border-white/5 rounded-xl flex gap-2.5 items-start">
                              <img src={c.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(c.userName)}`} alt="Avatar" className="w-6 h-6 rounded-full shrink-0 border border-white/10 bg-[#0d0d0f]" />
                              <div className="min-w-0 flex-1 text-2xs">
                                <div className="flex items-center justify-between font-semibold text-slate-200">
                                  <span>{c.userName}</span>
                                  <span className="text-[8px] text-slate-500 font-mono">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-slate-400 mt-0.5 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          ))}

                          {comments.length === 0 && (
                            <p className="text-center py-4 text-[10px] text-slate-500">Be the first to leave a verified comment.</p>
                          )}
                        </div>

                        {/* Add Comment form */}
                        <form onSubmit={handleAddComment} className="flex gap-2.5">
                          <input
                            type="text"
                            required
                            placeholder="Add your public question or solution comment..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-white/20 transition"
                          />
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#0d0d0f] hover:bg-white/5 border border-white/10 rounded-xl text-2xs text-white font-bold transition cursor-pointer"
                          >
                            Send
                          </button>
                        </form>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard token={token} />
          )}

          {activeTab === 'store' && (
            <RewardsStore 
              token={token} 
              userPoints={user.points} 
              onRefreshProfile={fetchProfile} 
            />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard 
              token={token} 
              onRefreshIssues={fetchIssues} 
              issues={issues}
            />
          )}
        </div>

      </main>

      {/* Report Issue Modal Drawer */}
      {isReportModalOpen && (
        <ReportIssueModal 
          onClose={() => { setIsReportModalOpen(false); setPrefilledCoords(null); }}
          onSuccess={handleReportSuccess}
          prefilledCoords={prefilledCoords}
          token={token}
        />
      )}

    </div>
  );
}
