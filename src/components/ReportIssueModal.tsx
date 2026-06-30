import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Upload, Loader2, Sparkles, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface ReportIssueModalProps {
  onClose: () => void;
  onSuccess: (newIssue: any) => void;
  prefilledCoords: { lat: number; lng: number; address: string } | null;
  token: string;
}

export default function ReportIssueModal({
  onClose,
  onSuccess,
  prefilledCoords,
  token
}: ReportIssueModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryHint, setCategoryHint] = useState('Pothole');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Prefill coordinates if clicked from map
  useEffect(() => {
    if (prefilledCoords) {
      setLat(prefilledCoords.lat.toFixed(6));
      setLng(prefilledCoords.lng.toFixed(6));
      setAddress(prefilledCoords.address);
    }
  }, [prefilledCoords]);

  // Messages shown while Gemini AI analyzes the report
  const loadingMessages = [
    'Optimizing civic image data...',
    'Consulting Gemini AI classification engine...',
    'Analyzing report severity score...',
    'Scanning nearby maps for duplicate reports...',
    'Generating safety precautions & assigning department...',
    'Registering official report with City Hall...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      let step = 0;
      setSubmitMessage(loadingMessages[0]);
      interval = setInterval(() => {
        step = (step + 1) % loadingMessages.length;
        setSubmitMessage(loadingMessages[step]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Geolocation detector
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude.toFixed(6));
        setLng(longitude.toFixed(6));

        // Use standard reverse geocoding API to fetch readable address
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            setAddress(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } else {
            setAddress(`Hyperlocal Street ${Math.floor(Math.random() * 500) + 1}, San Francisco, CA`);
          }
        } catch {
          setAddress(`GPS Location near Latitude: ${latitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('Location error:', err);
        setError('Unable to fetch precise location. Please enter coordinates or double-click the map to pin.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Convert uploaded file to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!image) {
      setError('Please upload or drag an image showing the civic issue.');
      return;
    }

    if (!lat || !lng || !address) {
      setError('Please capture coordinates using geolocation or enter a valid address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image,
          categoryHint,
          location: {
            address,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected reporting file.');
      }

      onSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0b]/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0d0d0f] border border-white/5 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-400 animate-pulse" />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">Analyzing Civic Report</h3>
            <p className="text-xs text-orange-400 font-mono tracking-wider h-8 animate-pulse">{submitMessage}</p>
            <div className="mt-8 max-w-xs text-xs text-slate-500 leading-relaxed bg-[#0a0a0b] border border-white/5 p-4 rounded-xl">
              Our server-side Gemini AI engine is extracting issue details, mapping priority levels, and scanning municipal dispatch databases for duplicates. This ensures efficient municipal remediation.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <h2 className="font-display text-xl font-bold text-white">Report Civic Issue</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a photo. Gemini AI will automatically catalog, analyze, estimate severity, and dispatch this report.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Image Dropzone */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition ${
                image 
                  ? 'border-white/10 bg-[#0a0a0b]' 
                  : 'border-white/10 hover:border-white/20 bg-[#0a0a0b]/10'
              }`}
            >
              {image ? (
                <div className="relative max-h-[180px] rounded-xl overflow-hidden group">
                  <img src={image} alt="Report Preview" className="w-full h-full object-cover max-h-[180px] rounded-xl" />
                  <div className="absolute inset-0 bg-[#0a0a0b]/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <label className="p-2.5 bg-[#0d0d0f] border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 text-xs text-white font-medium flex items-center gap-1.5">
                      <Camera className="w-4 h-4" />
                      <span>Replace Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center py-6">
                  <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 mb-3 group-hover:scale-105 transition">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-xs text-slate-200 font-medium mb-1">Drag and drop issue photo here</span>
                  <span className="text-2xs text-slate-500 mb-4">PNG, JPG or JPEG (Max 10MB)</span>
                  <span className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-2xs text-slate-200 font-medium rounded-lg transition">
                    Choose Photo
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Hint category selector */}
            <div>
              <label className="block text-2xs uppercase tracking-wider text-slate-400 font-medium mb-1.5">
                Issue Category Hint
              </label>
              <select
                value={categoryHint}
                onChange={(e) => setCategoryHint(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
              >
                <option value="Pothole">Pothole / Road Damage</option>
                <option value="Illegal Dumping">Illegal Dumping / Rubbish</option>
                <option value="Broken Streetlight">Broken Streetlight</option>
                <option value="Water Leakage">Water Leakage / Pipe Leak</option>
                <option value="Drainage Block">Drainage Block / Flood</option>
                <option value="Tree Fallen">Tree Fallen / Obstruction</option>
                <option value="Other">Other / Infrastructure Failure</option>
              </select>
            </div>

            {/* Geolocation Fields */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-2xs uppercase tracking-wider text-slate-400 font-medium">
                  GPS Coordinates & Address
                </label>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={isLocating}
                  className="text-2xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Auto-detect GPS</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
                />
              </div>

              <input
                type="text"
                placeholder="Detailed street address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50 transition"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-xs text-white font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
