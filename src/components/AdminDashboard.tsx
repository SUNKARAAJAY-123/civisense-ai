import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { Issue, IssueStatus, IssueSeverity } from '../types';
import { safeParseResponse } from '../utils';
import { 
  ShieldAlert, Settings, RefreshCw, Layers, CheckCircle2, 
  Clock, TrendingUp, Users, ChevronRight, Check, Send, AlertTriangle 
} from 'lucide-react';

interface AdminDashboardProps {
  token: string;
  onRefreshIssues: () => void;
  issues: Issue[];
}

export default function AdminDashboard({
  token,
  onRefreshIssues,
  issues
}: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Status & Assigning state
  const [status, setStatus] = useState<IssueStatus>('assigned');
  const [assignedTo, setAssignedTo] = useState('');
  const [department, setDepartment] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeParseResponse(res);
      if (res.ok) {
        setAnalytics(data);
      } else {
        console.error('Failed to load analytics:', data.error || 'API responded with an error');
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [issues]);

  const handleUpdateIssue = async (issueId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          assignedTo: assignedTo || undefined,
          department: department || undefined,
          resolutionDetails: status === 'resolved' ? resolutionDetails : undefined
        })
      });

      if (res.ok) {
        setSuccessMsg('Issue state updated and saved successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        onRefreshIssues();
        fetchAnalytics();
        
        // Reset inputs
        setResolutionDetails('');
      }
    } catch (e) {
      console.error('Failed to update issue:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const COLORS = ['#f97316', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  const getSeverityBadgeColor = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusBadgeColor = (status: IssueStatus) => {
    switch (status) {
      case 'open': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'assigned': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'resolved': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'duplicate': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            <h1 className="font-display text-2xl font-bold text-white">Authority Admin Portal</h1>
          </div>
          <p className="text-xs text-slate-400">
            Monitor resolution times, dispatch repair crews, and analyze community trends.
          </p>
        </div>
        
        <button
          onClick={() => { fetchAnalytics(); onRefreshIssues(); }}
          className="self-start md:self-auto px-3.5 py-1.5 bg-[#0d0d0f] border border-white/10 hover:bg-white/5 text-2xs text-slate-200 font-medium rounded-xl flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Widget Cards Row */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-medium text-slate-400 uppercase tracking-wider">Total Reports</div>
              <div className="text-xl font-bold text-white mt-0.5">{analytics.totalReports}</div>
            </div>
          </div>

          <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-medium text-slate-400 uppercase tracking-wider">Resolved</div>
              <div className="text-xl font-bold text-white mt-0.5">{analytics.resolvedReports}</div>
            </div>
          </div>

          <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-medium text-slate-400 uppercase tracking-wider">Resolution Rate</div>
              <div className="text-xl font-bold text-white mt-0.5">{analytics.resolutionRate}%</div>
            </div>
          </div>

          <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-medium text-slate-400 uppercase tracking-wider">Community Points</div>
              <div className="text-xl font-bold text-white mt-0.5">{analytics.totalCivicPoints}</div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trends (Line Chart) */}
          <div className="lg:col-span-2 bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 shadow-lg">
            <h3 className="font-display text-sm font-semibold text-slate-200 mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Municipal Resolution Trends (6-Month Forecast)</span>
            </h3>
            <div className="w-full h-64 text-2xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyReports} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0b', borderColor: '#1e293b' }} />
                  <Legend />
                  <Area type="monotone" dataKey="reports" stroke="#f97316" fillOpacity={1} fill="url(#colorReports)" name="Reports Submitted" />
                  <Area type="monotone" dataKey="resolved" stroke="#6366f1" fillOpacity={1} fill="url(#colorResolved)" name="Issues Closed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories distribution (Pie Chart) */}
          <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 shadow-lg">
            <h3 className="font-display text-sm font-semibold text-slate-200 mb-4 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Top Categories Dist.</span>
            </h3>
            <div className="w-full h-48 text-2xs flex justify-center items-center">
              {analytics.categoriesData && analytics.categoriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.categoriesData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0b', borderColor: '#1e293b' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500">No category statistics compiled.</div>
              )}
            </div>
            
            {/* Custom Legends list */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] max-h-16 overflow-y-auto">
              {analytics.categoriesData?.map((entry: any, idx: number) => (
                <div key={entry.name} className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Department Efficiency (Bar Chart) */}
      {analytics && analytics.departmentPerf && (
        <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 shadow-lg">
          <h3 className="font-display text-sm font-semibold text-slate-200 mb-4 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-orange-400" />
            <span>Department Dispatch Efficiency & Workloads</span>
          </h3>
          <div className="w-full h-64 text-2xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.departmentPerf} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tickFormatter={(v) => v.split(' ')[0]} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0b', borderColor: '#1e293b' }} />
                <Legend />
                <Bar dataKey="assignedCount" fill="#f97316" name="Assigned Tasks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolvedCount" fill="#6366f1" name="Completed Resolutions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Issue Dispatch Panel (Split: List on Left, Status dispatch details on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Issue Manager Queue (List) */}
        <div className="lg:col-span-2 bg-[#0d0d0f] border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[520px]">
          <div className="p-4 border-b border-white/5 bg-[#0a0a0b] flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-white">Active Dispatch Queue</h3>
            <span className="px-2 py-0.5 bg-[#0d0d0f] border border-white/10 rounded-md text-2xs text-slate-300 font-mono font-medium">
              {issues.length} Total Cases
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
            {issues.map(issue => {
              const isSelected = selectedIssueId === issue.id;
              return (
                <div 
                  key={issue.id}
                  onClick={() => {
                    setSelectedIssueId(issue.id);
                    setStatus(issue.status);
                    setAssignedTo(issue.assignedTo || '');
                    setDepartment(issue.department || '');
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer transition flex items-center gap-3 ${
                    isSelected 
                      ? 'bg-[#0a0a0b] border border-white/10' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <img 
                    src={issue.image || 'https://via.placeholder.com/150'} 
                    alt="Issue thumbnail" 
                    className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" 
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md border shrink-0 font-medium ${getSeverityBadgeColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md border shrink-0 font-medium ${getStatusBadgeColor(issue.status)}`}>
                        {issue.status}
                      </span>
                      <span className="text-2xs text-slate-500 font-mono truncate">{issue.category}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{issue.title}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{issue.location.address}</p>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'rotate-90 text-orange-400' : ''}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispatch Action Control panel */}
        <div className="bg-[#0d0d0f] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-[520px]">
          {selectedIssueId ? (() => {
            const selectedIssue = issues.find(i => i.id === selectedIssueId);
            if (!selectedIssue) return <p className="text-xs text-slate-500 text-center py-20">Issue not found</p>;
            
            return (
              <div className="flex flex-col h-full justify-between">
                
                {/* Upper Details */}
                <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
                  <div className="border-b border-white/5 pb-3">
                    <span className="text-[9px] text-orange-400 font-mono uppercase tracking-wider">Active Case File</span>
                    <h4 className="text-xs font-bold text-white mt-0.5 line-clamp-2">{selectedIssue.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{selectedIssue.description}</p>
                  </div>

                  {successMsg && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-2 text-2xs text-orange-400 animate-pulse">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Status update selector */}
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-semibold mb-1">
                      Resolution Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as IssueStatus)}
                      className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
                    >
                      <option value="open">Open (Reviewing)</option>
                      <option value="assigned">Assigned (In Progress)</option>
                      <option value="resolved">Resolved (Close Case)</option>
                      <option value="duplicate">Duplicate (Link)</option>
                    </select>
                  </div>

                  {/* Assigned Department */}
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-semibold mb-1">
                      Assigned Municipal Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Department of Public Works"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
                    />
                  </div>

                  {/* Field Technician Crew Name */}
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-semibold mb-1">
                      Field Contractor / Dispatch Crew
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Road Crew Alpha"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
                    />
                  </div>

                  {/* Resolution log details (Only if selecting Resolved) */}
                  {status === 'resolved' && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] uppercase text-slate-400 font-semibold mb-1">
                        Resolution Logs & Outcome Details
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Explain technical solution. This is logged transparently for citizens and unlocks bonus reward points."
                        value={resolutionDetails}
                        onChange={(e) => setResolutionDetails(e.target.value)}
                        className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
                      />
                    </div>
                  )}
                </div>

                {/* Dispatch Button */}
                <button
                  type="button"
                  onClick={() => handleUpdateIssue(selectedIssue.id)}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-xs text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg mt-4 shadow-orange-500/10 cursor-pointer"
                >
                  {isUpdating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Commit Dispatch Updates</span>
                </button>

              </div>
            );
          })() : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <AlertTriangle className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold">Select an issue from the queue</p>
              <p className="text-[10px] text-slate-600 mt-1">Updates to status and crew assignment will appear here.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
