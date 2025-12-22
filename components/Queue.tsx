import React from 'react';
import { Song } from '../types';
import { ListMusic, Smartphone, Trash2, Zap } from 'lucide-react';

interface QueueProps {
  queue: Song[];
  onRemove: (index: number) => void;
  currentSong: Song | null;
}

const Queue: React.FC<QueueProps> = ({ queue, onRemove, currentSong }) => {
  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-200/60 flex items-center justify-between bg-white/50">
        <h3 className="font-bold text-karaoke-900 flex items-center gap-2">
            <ListMusic className="text-neon-pink" size={20} />
            Chờ phát
        </h3>
        <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">
            {queue.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {queue.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic text-center p-4">
                Danh sách trống. Quét QR để thêm bài!
            </div>
        ) : (
            queue.map((song, index) => (
                <div 
                    key={`${song.id}-${index}`}
                    className={`
                        relative flex items-center gap-3 p-2 rounded-lg border transition-all group
                        ${song.isPriority ? 'bg-pink-50 border-pink-100' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 shadow-sm'}
                    `}
                >
                    <div className="w-5 text-center text-gray-400 text-xs font-mono">{index + 1}</div>
                    
                    <img 
                        src={song.thumbnail} 
                        alt="thumb" 
                        className="w-10 h-10 object-cover rounded bg-gray-200 shrink-0 border border-gray-100" 
                    />
                    
                    {/* min-w-0 and w-full are critical for truncate to work inside flex */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <h4 className="text-sm font-semibold text-gray-800 truncate w-full" title={song.title}>
                                {song.title}
                            </h4>
                            {song.isPriority && <Zap size={12} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span className="truncate max-w-[80px]">{song.channel}</span>
                            {song.addedBy === 'Remote User' && (
                                <Smartphone size={10} className="text-indigo-500 shrink-0" />
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => onRemove(index)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all shrink-0 bg-white rounded-full shadow-sm hover:shadow"
                        title="Xóa khỏi hàng chờ"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Queue;