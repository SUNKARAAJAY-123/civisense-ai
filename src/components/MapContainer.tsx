import React, { useState } from 'react';
import { Issue, IssueSeverity, IssueStatus } from '../types';
import { MapPin, AlertCircle, Eye, CheckCircle2, Navigation, Plus, Layers, ZoomIn, ZoomOut } from 'lucide-react';

interface MapContainerProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  onMapDoubleClick: (coords: { lat: number; lng: number; address: string }) => void;
  filterStatus: string;
  filterSeverity: string;
}

export default function MapContainer({
  issues,
  selectedIssue,
  onSelectIssue,
  onMapDoubleClick,
  filterStatus,
  filterSeverity
}: MapContainerProps) {
  const [zoom, setZoom] = useState(14);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // SF Center
  const [showCoordinatesAlert, setShowCoordinatesAlert] = useState(true);

  // Filter issues according to selected filters
  const filteredIssues = issues.filter(issue => {
    if (filterStatus && issue.status !== filterStatus) return false;
    if (filterSeverity && issue.severity !== filterSeverity) return false;
    return true;
  });

  // Calculate pixel offsets for issues based on San Francisco bounding box
  // Lat: 37.7500 to 37.8100
  // Lng: -122.4300 to -122.3900
  const getCoordinatesOffset = (lat: number, lng: number) => {
    const minLat = 37.7500;
    const maxLat = 37.8100;
    const minLng = -122.4300;
    const maxLng = -122.3900;

    // Convert to percentage offsets
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100; // Invert Y for screen coordinates

    return { 
      x: Math.max(5, Math.min(95, x)), 
      y: Math.max(5, Math.min(95, y)) 
    };
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only double click triggers adding coordinates
    if (e.detail !== 2) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    // Inverse of getCoordinatesOffset to calculate lat/lng
    const minLat = 37.7500;
    const maxLat = 37.8100;
    const minLng = -122.4300;
    const maxLng = -122.3900;

    const lng = minLng + (percentX / 100) * (maxLng - minLng);
    const lat = minLat + (1 - percentY / 100) * (maxLat - minLat);

    // Dynamic address generator based on clicked location
    const streets = ['Market St', 'Mission St', 'Valencia St', 'Geary Blvd', 'Pine St', 'Polk St', 'Folsom St', 'Castro St'];
    const randomStreet = streets[Math.floor(Math.random() * streets.length)];
    const randomNum = Math.floor(Math.random() * 1500) + 100;
    const mockAddress = `${randomNum} ${randomStreet}, San Francisco, CA 94103`;

    onMapDoubleClick({ lat, lng, address: mockAddress });
  };

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 border-red-200 text-white';
      case 'high': return 'bg-amber-500 border-amber-200 text-white';
      case 'medium': return 'bg-yellow-500 border-yellow-200 text-slate-900';
      case 'low': return 'bg-blue-500 border-blue-200 text-white';
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'open': return 'ring-red-400 bg-red-500';
      case 'assigned': return 'ring-sky-400 bg-sky-500';
      case 'resolved': return 'ring-orange-400 bg-orange-500';
      case 'duplicate': return 'ring-purple-400 bg-purple-500';
    }
  };

  return (
    <div className="relative w-full h-[550px] bg-[#0a0a0b] rounded-2xl overflow-hidden border border-white/5 shadow-2xl group select-none">
      {/* Background Grid Pattern simulating vector maps */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }} 
       />

      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none border border-white/5" />
      
      {/* City Blocks Vector Art Mockup */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {/* Major Waterway / SF Bay representation */}
        <div className="absolute top-0 right-0 w-[45%] h-[40%] bg-sky-500/10 rounded-bl-full filter blur-md" />
        <div className="absolute top-12 left-10 w-[20%] h-[30%] bg-emerald-500/10 rounded-full filter blur-lg" /> {/* Park */}
        {/* Diagonal Streets Represented as grids */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 transform rotate-12" />
        <div className="absolute top-1/3 left-0 w-full h-1 bg-white/5 transform -rotate-12" />
        <div className="absolute top-0 left-1/4 w-1 h-full bg-white/5 transform rotate-6" />
        <div className="absolute top-0 left-2/3 w-1 h-full bg-white/5 transform -rotate-6" />
      </div>

      {/* Map Interactive Stage */}
      <div 
        id="municipal-vector-stage"
        className="absolute inset-0 cursor-crosshair active:cursor-grabbing transition-transform duration-300"
        onClick={handleMapClick}
      >
        {/* Double Click Hint Label */}
        {showCoordinatesAlert && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-[#0d0d0f]/95 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-lg text-xs text-slate-300">
            <span className="flex items-center gap-2 text-slate-300">
              <Navigation className="w-4 h-4 text-orange-400 animate-pulse" />
              <span><b>Double-click anywhere on the map</b> to drop a new pin and auto-capture GPS coordinates.</span>
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowCoordinatesAlert(false); }} 
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/5 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Map Legend Floating Banner */}
        <div className="absolute bottom-4 left-4 z-10 bg-[#0d0d0f]/95 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-wrap gap-4 items-center shadow-lg text-2xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-500/20" />
            <span>Open (New)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
            <span>Assigned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-500/20" />
            <span>Resolved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
            <span>Duplicate</span>
          </div>
        </div>

        {/* Dynamic Pins */}
        {filteredIssues.map((issue) => {
          const { x, y } = getCoordinatesOffset(issue.location.lat, issue.location.lng);
          const isSelected = selectedIssue?.id === issue.id;
          
          return (
            <div
              key={issue.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
              onClick={(e) => {
                e.stopPropagation();
                onSelectIssue(issue);
              }}
            >
              <button
                className={`relative p-2.5 rounded-full transition-all duration-300 flex items-center justify-center border-2 ${
                  isSelected 
                    ? 'scale-125 bg-orange-500 text-white border-white shadow-[0_0_15px_rgba(249,115,22,0.6)] z-30' 
                    : `${getSeverityColor(issue.severity)} border-[#0a0a0b] hover:scale-115 shadow-lg`
                }`}
              >
                {issue.status === 'resolved' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}

                {/* Status Indicator Ring */}
                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${getStatusColor(issue.status)}`} />
              </button>

              {/* Pin Hover/Selected Information Tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0d0d0f] border border-white/10 text-white text-[10px] rounded-lg p-2.5 shadow-xl pointer-events-none transition-all duration-200 origin-bottom ${
                isSelected 
                  ? 'opacity-100 scale-100 translate-y-0' 
                  : 'opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0'
              }`}>
                <div className="flex justify-between items-start gap-1 font-semibold mb-1 text-slate-200">
                  <span className="truncate">{issue.title}</span>
                  <span className={`text-[8px] uppercase px-1 rounded-sm shrink-0 ${
                    issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    issue.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                    issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 mb-1.5 truncate">{issue.location.address}</div>
                <div className="flex justify-between items-center text-[8px] border-t border-white/5 pt-1 text-slate-500">
                  <span>Category: <b>{issue.category}</b></span>
                  <span className="capitalize text-slate-400 font-medium">{issue.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={() => setZoom(z => Math.min(18, z + 1))}
          className="p-2.5 rounded-xl bg-[#0d0d0f]/90 backdrop-blur-md border border-white/10 hover:bg-white/5 hover:border-white/10 text-slate-300 transition shadow-lg cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoom(z => Math.max(10, z - 1))}
          className="p-2.5 rounded-xl bg-[#0d0d0f]/90 backdrop-blur-md border border-white/10 hover:bg-white/5 hover:border-white/10 text-slate-300 transition shadow-lg cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setMapCenter({ lat: 37.7749, lng: -122.4194 })}
          className="p-2.5 rounded-xl bg-[#0d0d0f]/90 backdrop-blur-md border border-white/10 hover:bg-white/5 hover:border-white/10 text-slate-300 transition shadow-lg cursor-pointer"
          title="Recenter Map"
        >
          <Navigation className="w-4 h-4 rotate-45 text-orange-400" />
        </button>
      </div>
    </div>
  );
}
