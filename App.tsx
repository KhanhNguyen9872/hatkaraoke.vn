import React, { useState, useEffect, useRef } from 'react';
import { Song, AppMode } from './types';
import Player from './components/Player';
import Search from './components/Search';
import Queue from './components/Queue';
import RemoteQueue from './components/RemoteQueue';
import RemoteQR from './components/RemoteQR';
import Trending from './components/Trending';
import HelpModal from './components/HelpModal';
import { Music, QrCode, Smartphone, Wifi, Link2Off, Link2, Loader2, Volume2, VolumeX, BookOpen, Search as SearchIcon, ListMusic, Play, Pause, SkipForward, Square, Flame, Maximize2, Minimize2, Eye } from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';

// Helper to generate a unique but short-ish ID
const generateId = () => {
    return 'neon-' + Math.random().toString(36).substr(2, 6);
};

// Storage Keys
const STORAGE_KEYS = {
    QUEUE: 'hatkaraoke_saved_queue',
    CURRENT_SONG: 'hatkaraoke_saved_current_song'
};

const App: React.FC = () => {
  // State
  const [mode, setMode] = useState<AppMode>(AppMode.HOST);
  
  // Initialize Queue from LocalStorage
  const [queue, setQueue] = useState<Song[]>(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEYS.QUEUE);
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          console.error("Failed to load queue from storage", e);
          return [];
      }
  });

  // Initialize Current Song from LocalStorage
  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
      try {
          const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_SONG);
          return saved ? JSON.parse(saved) : null;
      } catch (e) {
          console.error("Failed to load current song from storage", e);
          return null;
      }
  });

  // Initialize isPlaying: Auto-play if a song was restored from storage
  const [isPlaying, setIsPlaying] = useState(() => {
      try {
          // If we have a current song loaded from storage, default to playing
          const hasSavedSong = !!localStorage.getItem(STORAGE_KEYS.CURRENT_SONG);
          return hasSavedSong;
      } catch {
          return false;
      }
  });

  const [isFullscreen, setIsFullscreen] = useState(false); // Managed at top level
  
  // Volume State (Lifted Up)
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showRemoteNotification, setShowRemoteNotification] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false); // Connection status indicator
  const [visitCount, setVisitCount] = useState<number>(0); // Visit Counter
  
  // Remote UI State
  const [activeTab, setActiveTab] = useState<'trending' | 'search' | 'queue'>('trending');
  
  // Refs for accessing latest state inside callbacks/effects
  const queueRef = useRef(queue);
  const currentSongRef = useRef(currentSong);
  const isPlayingRef = useRef(isPlaying);
  const isFullscreenRef = useRef(isFullscreen);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  
  // PeerJS Refs
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);

  // --- AUTO PLAY FROM QUEUE ON LOAD ---
  // If F5 happens and we have no current song but we have a queue, play the first one
  useEffect(() => {
      if (!currentSong && queue.length > 0) {
          const next = queue[0];
          setCurrentSong(next);
          setQueue(prev => prev.slice(1));
          setIsPlaying(true);
      }
  }, []); // Run once on mount

  // --- PERSISTENCE EFFECT ---
  // Save Queue and Current Song to LocalStorage whenever they change
  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
      if (currentSong) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_SONG, JSON.stringify(currentSong));
      } else {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_SONG);
      }
  }, [currentSong]);

  // Sync refs with state
  useEffect(() => {
    queueRef.current = queue;
    currentSongRef.current = currentSong;
    isPlayingRef.current = isPlaying;
    isFullscreenRef.current = isFullscreen;
    volumeRef.current = volume;
    mutedRef.current = muted;
    
    // HOST: Broadcast state changes to all connected remotes
    if (mode === AppMode.HOST) {
        broadcastState();
    }
  }, [queue, currentSong, isPlaying, isFullscreen, volume, muted, mode]);

  // Auto-play when song changes (runtime)
  useEffect(() => {
      if (currentSong) {
          setIsPlaying(true);
      }
  }, [currentSong]);

  const broadcastState = () => {
      const state = {
          type: 'SYNC_STATE',
          payload: {
              queue: queueRef.current,
              currentSong: currentSongRef.current,
              isPlaying: isPlayingRef.current,
              isFullscreen: isFullscreenRef.current,
              volume: volumeRef.current,
              muted: mutedRef.current
          }
      };
      
      connectionsRef.current.forEach(conn => {
          if (conn.open) {
              conn.send(state);
          }
      });
  };

  // Initialize P2P Connection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const sessionParam = params.get('session');

    // Clean up function
    const cleanup = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
        }
        connectionsRef.current = [];
    };

    if (modeParam === 'remote') {
        // --- REMOTE MODE ---
        setMode(AppMode.REMOTE);
        if (!sessionParam) {
            alert("Thiếu mã phiên làm việc (Session ID)!");
            return;
        }

        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('Remote Peer ID:', id);
            // Connect to Host
            const conn = peer.connect(sessionParam, {
                reliable: true
            });
            
            conn.on('open', () => {
                setIsConnected(true);
                // Save connection to ref (Remote only has 1 connection to Host)
                connectionsRef.current = [conn];
            });

            conn.on('data', (data: any) => {
                if (data.type === 'SYNC_STATE') {
                    setQueue(data.payload.queue);
                    setCurrentSong(data.payload.currentSong);
                    setIsPlaying(data.payload.isPlaying);
                    setIsFullscreen(data.payload.isFullscreen);
                    setVolume(data.payload.volume);
                    setMuted(data.payload.muted);
                }
            });

            conn.on('close', () => setIsConnected(false));
            conn.on('error', () => setIsConnected(false));
        });
        
        peer.on('error', (err) => {
            console.error('PeerJS Remote Error:', err);
            setIsConnected(false);
        });

    } else {
        // --- HOST MODE ---
        
        // 1. Visit Counter Logic
        const VISITS_KEY = 'hatkaraoke_visits';
        const savedVisits = localStorage.getItem(VISITS_KEY);
        const newVisitCount = savedVisits ? parseInt(savedVisits) + 1 : 1;
        localStorage.setItem(VISITS_KEY, newVisitCount.toString());
        setVisitCount(newVisitCount);

        // 2. Persistence Logic for Session ID
        const STORAGE_KEY = 'hatkaraoke_host_session';
        const EXPIRY_KEY = 'hatkaraoke_host_expiry';
        const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

        const now = Date.now();
        let mySessionId = localStorage.getItem(STORAGE_KEY);
        const expiry = localStorage.getItem(EXPIRY_KEY);

        if (!mySessionId || !expiry || now > parseInt(expiry)) {
            mySessionId = generateId();
            localStorage.setItem(STORAGE_KEY, mySessionId);
            localStorage.setItem(EXPIRY_KEY, (now + SESSION_DURATION).toString());
        } else {
             // Extend expiry on active use
             localStorage.setItem(EXPIRY_KEY, (now + SESSION_DURATION).toString());
        }

        setSessionId(mySessionId);
        
        // --- AUTO SHOW QR ON STARTUP ---
        setIsQrModalOpen(true);

        const peer = new Peer(mySessionId);
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('Host initialized with ID:', id);
            setIsConnected(true); // Host is "online"
        });

        peer.on('connection', (conn) => {
            console.log('New remote connected:', conn.peer);
            
            // --- AUTO CLOSE QR ON REMOTE CONNECT ---
            setIsQrModalOpen(false);
            
            connectionsRef.current.push(conn);

            conn.on('open', () => {
                // Send immediate state sync upon connection
                conn.send({
                    type: 'SYNC_STATE',
                    payload: {
                        queue: queueRef.current,
                        currentSong: currentSongRef.current,
                        isPlaying: isPlayingRef.current,
                        isFullscreen: isFullscreenRef.current,
                        volume: volumeRef.current,
                        muted: mutedRef.current
                    }
                });
            });

            conn.on('data', (data: any) => {
                handleHostCommand(data);
            });

            conn.on('close', () => {
                connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
            });
            
            conn.on('error', (err) => {
                console.error('Connection error:', err);
                connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
            });
        });

        peer.on('error', (err: any) => {
            console.error('PeerJS Host Error:', err);
            // Handle ID collision (e.g. quick refresh, or tab duplication)
            if (err.type === 'unavailable-id') {
                console.warn('Session ID unavailable. Generating new one...');
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(EXPIRY_KEY);
                // Reload to generate fresh ID
                setTimeout(() => window.location.reload(), 1000);
            }
        });
    }

    return cleanup;
  }, []);

  // ---------------------------------------------------------------------------
  // HOST LOGIC: Handle Commands
  // ---------------------------------------------------------------------------
  const handleHostCommand = (data: any) => {
    const { type, payload } = data;

    if (type === 'CMD_ADD_SONG') {
        const { song, priority } = payload;
        const current = currentSongRef.current;
        
        if (!current) {
            setCurrentSong(song);
        } else {
            setQueue(prev => priority ? [song, ...prev] : [...prev, song]);
        }
        
        setShowRemoteNotification(true);
        setTimeout(() => setShowRemoteNotification(false), 3000);
    }
    
    if (type === 'CMD_REMOVE_SONG') {
        setQueue(prev => prev.filter((_, i) => i !== payload.index));
    }

    if (type === 'CMD_PRIORITIZE_SONG') {
        setQueue(prev => {
            if (payload.index <= 0 || payload.index >= prev.length) return prev;
            const newQueue = [...prev];
            const [item] = newQueue.splice(payload.index, 1);
            item.isPriority = true;
            newQueue.unshift(item); // Move to top
            return newQueue;
        });
    }

    if (type === 'CMD_TOGGLE_PLAY') {
        setIsPlaying(prev => !prev);
    }

    if (type === 'CMD_STOP') {
        setIsPlaying(false);
    }

    if (type === 'CMD_NEXT') {
        playNext();
    }
    
    if (type === 'CMD_TOGGLE_FULLSCREEN') {
        setIsFullscreen(prev => !prev);
    }

    if (type === 'CMD_SET_VOLUME') {
        setVolume(payload.volume);
        setMuted(payload.muted);
    }
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  
  const sendRemoteCommand = (command: string, payload: any = {}) => {
      if (mode === AppMode.REMOTE) {
          const conn = connectionsRef.current[0];
          if (conn && conn.open) {
              conn.send({ type: command, payload });
          } else {
              alert("Mất kết nối tới Host.");
          }
      }
  };

  const handleAddSong = (song: Song, priority: boolean) => {
    if (mode === AppMode.REMOTE) {
        sendRemoteCommand('CMD_ADD_SONG', { song, priority });
        if (priority) setActiveTab('queue');
    } else {
        // HOST Local Action
        if (!currentSong) {
            setCurrentSong(song);
        } else {
            setQueue(prev => priority ? [song, ...prev] : [...prev, song]);
        }
    }
  };

  const handleRemoveSong = (index: number) => {
    if (mode === AppMode.REMOTE) {
        sendRemoteCommand('CMD_REMOVE_SONG', { index });
    } else {
        setQueue(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handlePrioritizeSong = (index: number) => {
      if (mode === AppMode.REMOTE) {
          sendRemoteCommand('CMD_PRIORITIZE_SONG', { index });
      } else {
           setQueue(prev => {
              if (index <= 0 || index >= prev.length) return prev;
              const newQueue = [...prev];
              const [item] = newQueue.splice(index, 1);
              item.isPriority = true;
              newQueue.unshift(item);
              return newQueue;
          });
      }
  };

  const playNext = () => {
    if (queueRef.current.length > 0) {
        const next = queueRef.current[0];
        setCurrentSong(next);
        setQueue(prev => prev.slice(1));
    } else {
        setCurrentSong(null);
    }
  };

  const handleSkip = () => {
    playNext();
  };

  // For Host Local Toggle
  const handleTogglePlay = () => {
      setIsPlaying(!isPlaying);
  };
  
  const handleToggleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
  }

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (mode === AppMode.REMOTE) {
        sendRemoteCommand('CMD_SET_VOLUME', { volume: val, muted });
    }
  };

  const handleToggleMute = () => {
      const newMuted = !muted;
      setMuted(newMuted);
      if (mode === AppMode.REMOTE) {
          sendRemoteCommand('CMD_SET_VOLUME', { volume, muted: newMuted });
      }
  };

  const handleSimulateRemoteConnect = () => {
    const currentUrl = window.location.href.split('?')[0];
    window.open(`${currentUrl}?mode=remote&session=${sessionId}`, '_blank', 'width=375,height=812');
    setIsQrModalOpen(false);
  };

  // ---------------------------------------------------------------------------
  // RENDER: REMOTE MODE (Mobile View)
  // ---------------------------------------------------------------------------
  if (mode === AppMode.REMOTE) {
    return (
        <div className="h-screen bg-gray-50 text-karaoke-900 flex flex-col max-w-md mx-auto border-x border-gray-200 relative overflow-hidden">
            {/* Header Status + Controls + Tabs Container */}
            <div className="bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm shrink-0 z-20">
                {/* 1. Header & Player Controls Wrapper */}
                <div className="p-4 pb-3">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-lg font-bold flex items-center gap-2 text-karaoke-700">
                            <Smartphone size={20} /> REMOTE
                        </h1>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <span className="flex items-center gap-1 text-green-600 text-[10px] font-mono border border-green-200 bg-green-50 px-2 py-1 rounded-full">
                                    <Wifi size={10} /> ONLINE
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-red-500 text-[10px] font-mono border border-red-200 bg-red-50 px-2 py-1 rounded-full animate-pulse">
                                    <Link2Off size={10} /> OFFLINE
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Mini Player Status & Controls */}
                    {currentSong ? (
                        <div className="flex flex-col gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-3">
                                <img src={currentSong.thumbnail} alt="" className="w-12 h-8 rounded object-cover border border-indigo-200 shadow-sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold truncate text-xs text-karaoke-900">{currentSong.title}</p>
                                    <p className="text-[10px] text-neon-pink font-semibold">
                                        {isPlaying ? "Đang phát" : "Tạm dừng"}
                                    </p>
                                </div>
                            </div>

                            {/* Remote Controls */}
                            <div className="flex flex-col gap-3 border-t border-indigo-200/50 pt-3 mt-1">
                                {/* Playback Controls */}
                                <div className="flex items-center justify-between gap-2">
                                    <button 
                                        onClick={() => sendRemoteCommand('CMD_STOP')}
                                        className="flex-1 py-2 bg-white text-gray-500 hover:text-red-500 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center active:scale-95 transition-all"
                                        title="Dừng (Stop)"
                                    >
                                        <Square size={18} fill="currentColor" />
                                    </button>
                                    
                                    <button 
                                        onClick={() => sendRemoteCommand('CMD_TOGGLE_PLAY')}
                                        className="flex-[1.5] py-2 bg-karaoke-600 text-white rounded-lg shadow-md shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        title={isPlaying ? "Tạm dừng" : "Phát"}
                                    >
                                        {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
                                    </button>

                                    <button 
                                        onClick={() => sendRemoteCommand('CMD_NEXT')}
                                        className="flex-1 py-2 bg-white text-gray-500 hover:text-karaoke-700 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center active:scale-95 transition-all"
                                        title="Bài tiếp (Next)"
                                    >
                                        <SkipForward size={20} />
                                    </button>

                                    <button 
                                        onClick={() => sendRemoteCommand('CMD_TOGGLE_FULLSCREEN')}
                                        className={`flex-1 py-2 rounded-lg shadow-sm border flex items-center justify-center active:scale-95 transition-all
                                            ${isFullscreen 
                                                ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                                                : 'bg-white border-gray-200 text-gray-500 hover:text-karaoke-700'
                                            }`}
                                        title="Toàn màn hình"
                                    >
                                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                    </button>
                                </div>

                                {/* Volume Control */}
                                <div className="flex items-center gap-3 bg-white/50 p-2 rounded-lg border border-indigo-100/50">
                                    <button 
                                        onClick={handleToggleMute}
                                        className={`p-1.5 rounded-full transition-colors ${muted ? 'bg-red-100 text-red-500' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                    </button>
                                    <input 
                                        type="range" 
                                        min={0} 
                                        max={1} 
                                        step={0.05} 
                                        value={volume}
                                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                        className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-karaoke-600"
                                    />
                                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                                        {Math.round(volume * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-xs text-gray-400 py-2">Chưa có bài hát nào đang phát</div>
                    )}
                </div>

                {/* 2. Navigation Tabs (Moved Here) */}
                <div className="h-12 border-t border-gray-100 grid grid-cols-3 bg-white">
                    <button 
                        onClick={() => setActiveTab('trending')}
                        className={`flex flex-col items-center justify-center gap-0.5 transition-colors border-b-2 ${activeTab === 'trending' ? 'text-orange-500 bg-orange-50/50 border-orange-500' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}
                    >
                        <Flame size={18} className={activeTab === 'trending' ? 'fill-orange-500' : ''} />
                        <span className="text-[10px] font-bold">Hot Trend</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('search')}
                        className={`flex flex-col items-center justify-center gap-0.5 transition-colors border-b-2 ${activeTab === 'search' ? 'text-karaoke-700 bg-indigo-50/50 border-karaoke-700' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}
                    >
                        <SearchIcon size={18} />
                        <span className="text-[10px] font-bold">Tìm bài</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('queue')}
                        className={`flex flex-col items-center justify-center gap-0.5 transition-colors border-b-2 relative ${activeTab === 'queue' ? 'text-neon-pink bg-pink-50/50 border-neon-pink' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}
                    >
                        <div className="relative">
                            <ListMusic size={18} />
                            {queue.length > 0 && (
                                <span className="absolute -top-1.5 -right-2.5 bg-neon-pink text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[14px] text-center leading-none">
                                    {queue.length}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">Đã chọn</span>
                    </button>
                </div>
            </div>

            {/* 3. Main Content Area */}
            <div className="flex-1 overflow-hidden relative bg-gray-50">
                {activeTab === 'search' && (
                     <div className="h-full flex flex-col p-4">
                        <h2 className="font-bold mb-3 text-sm text-gray-500 tracking-wider">TÌM KIẾM BÀI HÁT</h2>
                        <Search onAddSong={handleAddSong} isRemote={true} />
                    </div>
                )}
                {activeTab === 'trending' && (
                    <Trending onAddSong={handleAddSong} />
                )}
                {activeTab === 'queue' && (
                    <RemoteQueue 
                        queue={queue} 
                        onRemove={handleRemoveSong} 
                        onPrioritize={handlePrioritizeSong}
                    />
                )}
            </div>
            
        </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: HOST MODE (TV/Big Screen View)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 text-karaoke-900 font-sans overflow-hidden">
      
      {/* Top Navigation / Header */}
      <header className="h-16 border-b border-white/40 bg-white/70 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-karaoke-600 to-neon-purple rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                <Music className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-karaoke-700 to-neon-purple uppercase">
                    HATKARAOKE.VN
                </h1>
                <span className="text-[10px] md:text-xs text-neon-pink font-bold tracking-widest uppercase -mt-1">
                    Thỏa Đam Mê Ca Hát
                </span>
            </div>
        </div>

        <div className="flex items-center gap-4">
            {showRemoteNotification && (
                <div className="animate-in slide-in-from-top duration-500 px-4 py-1.5 bg-green-100 border border-green-300 text-green-700 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                    <Smartphone size={16} /> Đã nhận yêu cầu!
                </div>
            )}
            
            {/* Visit Counter (Before Session ID) */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-500 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <Eye size={12} className="text-blue-500" />
                <span className="font-semibold">{visitCount.toLocaleString()}</span>
            </div>

            {/* Session ID */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-500 bg-white/50 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                {isConnected ? <Link2 size={12} className="text-green-600" /> : <Loader2 size={12} className="animate-spin" />}
                ID: {sessionId || '...'}
            </div>

            <button 
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200 text-gray-600 hover:text-karaoke-700 shadow-sm"
            >
                <BookOpen size={18} />
                <span className="hidden md:inline text-sm font-medium">Hướng dẫn</span>
            </button>

            <button 
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-karaoke-700 hover:bg-karaoke-800 text-white rounded-lg transition-colors shadow-lg shadow-purple-200 hover:shadow-purple-300 group"
            >
                <QrCode size={18} className="text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">Kết nối ĐT</span>
            </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="w-full h-[calc(100vh-4rem)] grid grid-cols-12 gap-6 p-6">
        
        {/* Left Column: Player Only (No Search) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col h-full overflow-hidden justify-center">
            {/* Player Section - Takes full height of left column */}
            <div className="w-full h-full flex flex-col">
                <Player 
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    isFullscreen={isFullscreen}
                    queue={queue}
                    volume={volume}
                    muted={muted}
                    onToggleFullscreen={handleToggleFullscreen}
                    onTogglePlay={handleTogglePlay}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={handleToggleMute}
                    onEnded={playNext} 
                    onSkip={handleSkip} 
                />
            </div>
        </div>

        {/* Right Column: Queue (Narrower) */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
            <Queue 
                queue={queue} 
                onRemove={handleRemoveSong} 
                currentSong={currentSong}
            />
        </div>

      </main>

      {/* Remote Connect Modal */}
      <RemoteQR 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)} 
        onSimulateConnect={handleSimulateRemoteConnect}
        sessionId={sessionId}
      />

      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />

    </div>
  );
};

export default App;