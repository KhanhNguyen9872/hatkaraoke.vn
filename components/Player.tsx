import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactPlayer from 'react-player'; 
import { Song } from '../types';
import { SkipForward, Volume2, VolumeX, AlertCircle, Loader2, Maximize2, Minimize2, Music, Play, Pause, List, Disc, Mic2 } from 'lucide-react';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isFullscreen: boolean; // Controlled by parent
  volume: number;        // Controlled by parent
  muted: boolean;        // Controlled by parent
  queue: Song[]; // Added to show next songs
  onTogglePlay: () => void;
  onToggleFullscreen: () => void; // Controlled by parent
  onVolumeChange: (val: number) => void; // Controlled by parent
  onToggleMute: () => void; // Controlled by parent
  onEnded: () => void;
  onSkip: () => void;
}

const Player: React.FC<PlayerProps> = ({ 
  currentSong, 
  isPlaying, 
  isFullscreen,
  volume,
  muted,
  queue,
  onTogglePlay, 
  onToggleFullscreen,
  onVolumeChange,
  onToggleMute,
  onEnded, 
  onSkip 
}) => {
  // Local volume state removed, now using props
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(false);
  
  // Refs to track mounting state and timeouts safely
  const isMountedRef = useRef(true);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<any>(null);

  // Marquee Refs for constant speed calculation
  const marqueeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [marqueeStyle, setMarqueeStyle] = useState<React.CSSProperties>({});

  // Construct the "Next Songs" string for the marquee
  const marqueeText = useMemo(() => {
    if (queue.length === 0) return "Hết bài trong danh sách chờ. Hãy thêm bài mới!";
    return queue.map((s, i) => `${i + 1}. ${s.title} (${s.channel})`).join("  •  ");
  }, [queue]);

  // Calculate duration based on width to ensure constant speed
  useEffect(() => {
    if (marqueeRef.current && containerRef.current) {
        const textWidth = marqueeRef.current.scrollWidth;
        const containerWidth = containerRef.current.offsetWidth;
        const totalDistance = containerWidth + textWidth;
        
        // Speed: pixels per second. Higher = faster.
        const SPEED = 60; 
        const duration = totalDistance / SPEED;

        setMarqueeStyle({
            '--marquee-duration': `${duration}s`,
            '--marquee-end': `-${totalDistance}px`
        } as React.CSSProperties);
    }
  }, [marqueeText, isFullscreen]);

  const playerConfig = useMemo(() => ({
    youtube: {
      playerVars: {
        autoplay: 0,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3, 
        fs: 0,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      }
    }
  }), []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsReady(false);
    setError(false);
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
  }, [currentSong]);

  const handleReady = () => {
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
            setIsReady(true);
        }
    }, 500); 
  };

  const handleError = (e: any) => {
      console.warn("Player error:", e);
      if (isMountedRef.current) {
          setError(true);
          setTimeout(() => {
              if (isMountedRef.current) onEnded();
          }, 3000);
      }
  };

  if (!currentSong) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 rounded-2xl border border-white/10 shadow-2xl p-8 relative overflow-hidden group">
        <style>{`
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-15px); }
            }
            @keyframes pulse-glow {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.1); }
            }
            @keyframes equalizer {
                0% { height: 10%; }
                50% { height: 80%; }
                100% { height: 10%; }
            }
            .animate-float { animation: float 6s ease-in-out infinite; }
            .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
            .bar {
                width: 12px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 99px;
                animation: equalizer 1s ease-in-out infinite;
            }
            .bar:nth-child(1) { animation-duration: 0.8s; }
            .bar:nth-child(2) { animation-duration: 1.2s; }
            .bar:nth-child(3) { animation-duration: 1.5s; }
            .bar:nth-child(4) { animation-duration: 1.1s; }
            .bar:nth-child(5) { animation-duration: 0.9s; }
        `}</style>

        {/* Decorative Background Circles */}
        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>

        {/* Floating Icon Container */}
        <div className="relative z-10 mb-8 animate-float">
            {/* Glow Effect behind icon */}
            <div className="absolute inset-0 bg-neon-pink rounded-full blur-2xl animate-pulse-glow opacity-40"></div>
            
            <div className="relative w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                 <Mic2 className="w-14 h-14 text-white drop-shadow-md" />
                 
                 {/* Rotating Ring */}
                 <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
            </div>
        </div>

        {/* Animated Text */}
        <h2 className="relative z-10 text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white tracking-tight text-center mb-3 drop-shadow-sm">
            SẴN SÀNG
        </h2>
        <p className="relative z-10 text-indigo-200 text-lg text-center font-light mb-8 max-w-md">
            Quét mã QR hoặc chọn bài để bắt đầu bữa tiệc âm nhạc của bạn!
        </p>

        {/* Visualizer Bars */}
        <div className="flex items-end justify-center gap-2 h-16 opacity-60">
            <div className="bar"></div>
            <div className="bar bg-white/30"></div>
            <div className="bar bg-white/40"></div>
            <div className="bar bg-white/30"></div>
            <div className="bar"></div>
        </div>
      </div>
    );
  }

  // Dynamic classes based on Fullscreen state
  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-black flex flex-col justify-center animate-in fade-in duration-300" 
    : "flex flex-col gap-4 relative z-0 h-full transition-all duration-300";

  const videoWrapperClasses = isFullscreen
    ? "relative w-full flex-1 bg-black overflow-hidden flex flex-col justify-center"
    : "relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-4 border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] group";

  const controlBarClasses = isFullscreen
    ? "bg-gradient-to-t from-black/90 to-transparent p-6 w-full safe-area-bottom flex items-center justify-between text-white absolute bottom-0 z-40 hover:opacity-100 opacity-0 hover:opacity-100 transition-opacity duration-300"
    : "bg-white/90 backdrop-blur-md p-4 rounded-xl flex items-center justify-between border border-white shadow-lg";

  const ReactPlayerAny = ReactPlayer as any;

  return (
    <div className={containerClasses}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(var(--marquee-end, -100%)); }
        }
        .animate-marquee {
          /* Starts at the right edge of the container */
          left: 100%; 
          /* Duration is calculated dynamically */
          animation: marquee var(--marquee-duration, 20s) linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Video Container */}
      <div className={videoWrapperClasses}>
        
        {/* Marquee Scrolling Text (Top Overlay) */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-black/60 backdrop-blur-sm text-white py-2 overflow-hidden border-b border-white/10">
            <div className="flex items-center gap-2 px-3 absolute left-0 top-0 bottom-0 bg-black/80 z-10 border-r border-white/20">
                <List size={20} className="text-neon-pink" />
                <span className="text-base font-bold uppercase tracking-wider text-neon-pink whitespace-nowrap">Tiếp theo:</span>
            </div>
            {/* The scrolling container */}
            <div ref={containerRef} className="w-full overflow-hidden relative h-7 pl-40">
                <div 
                    ref={marqueeRef}
                    style={marqueeStyle}
                    className="animate-marquee whitespace-nowrap absolute top-0 text-base font-medium text-gray-200 leading-7"
                >
                    {marqueeText}
                </div>
            </div>
        </div>

        {error ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
                <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                <p>Video không khả dụng. Đang bỏ qua...</p>
             </div>
        ) : (
            <ReactPlayerAny
                ref={playerRef}
                key={currentSong.id}
                url={`https://www.youtube.com/watch?v=${currentSong.id}`}
                width="100%"
                height="100%"
                playing={isPlaying}
                controls={false}
                volume={volume}
                muted={muted}
                onEnded={onEnded}
                onReady={handleReady}
                onError={handleError}
                config={playerConfig as any}
                style={{ pointerEvents: isReady ? 'auto' : 'none' }}
            />
        )}
        
        {/* Pause Overlay */}
        {!isPlaying && isReady && !error && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-white/90 p-4 rounded-full backdrop-blur-sm shadow-xl">
                    <span className="text-karaoke-800 font-bold tracking-widest">TẠM DỪNG</span>
                </div>
            </div>
        )}

        {/* Loading Overlay */}
        {!isReady && !error && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
                 <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                    <span className="text-xs text-white font-mono animate-pulse">ĐANG TẢI...</span>
                 </div>
            </div>
        )}
      </div>

      {/* Control Bar */}
      <div className={controlBarClasses}>
        <div className="flex-1 min-w-0 pr-4">
           <h3 className={`font-bold truncate ${isFullscreen ? 'text-white text-xl' : 'text-karaoke-900 text-lg'}`}>{currentSong.title}</h3>
           <p className={`text-sm truncate ${isFullscreen ? 'text-gray-300' : 'text-karaoke-500'}`}>{currentSong.channel}</p>
        </div>

        <div className="flex items-center gap-4 md:gap-6 shrink-0">
            {/* Volume Control */}
            <div className="flex items-center gap-2 group relative">
                <button 
                    onClick={onToggleMute}
                    className={`${isFullscreen ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-karaoke-700'} transition-colors p-1`}
                >
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-out flex items-center">
                    <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.1} 
                        value={volume}
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-karaoke-600"
                    />
                </div>
            </div>

            {/* Play/Pause Button */}
            <button 
                onClick={onTogglePlay}
                disabled={!isReady}
                className={`
                    px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-md flex items-center gap-2
                    ${isPlaying 
                        ? (isFullscreen ? 'bg-white text-black hover:bg-gray-200' : 'bg-white border-2 border-karaoke-600 text-karaoke-600 hover:bg-karaoke-50')
                        : 'bg-karaoke-600 text-white hover:bg-karaoke-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                {isPlaying ? "DỪNG" : "PHÁT"}
            </button>

            {/* Skip Button */}
            <button 
                onClick={onSkip}
                className={`${isFullscreen ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-karaoke-700'} p-2 rounded-full transition-all hover:scale-110`}
                title="Bỏ qua bài"
            >
                <SkipForward size={24} />
            </button>

             {/* Fullscreen Toggle */}
             <button 
                onClick={onToggleFullscreen}
                className={`${isFullscreen ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-karaoke-700'} p-2 rounded-full transition-all hover:scale-110`}
                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Player;