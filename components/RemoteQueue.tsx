import React from 'react';
import { Song } from '../types';
import { ListMusic, Trash2, Zap, Smartphone } from 'lucide-react';

interface RemoteQueueProps {
  queue: Song[];
  onRemove: (index: number) => void;
  onPrioritize: (index: number) => void;
}

const RemoteQueue: React.FC<RemoteQueueProps> = ({ queue, onRemove, onPrioritize }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-3 border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <h3 className="font-bold text-gray-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
                <ListMusic className="text-neon-pink" size={18} />
                Danh sách chờ
            </span>
            <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">
                {queue.length} bài
            </span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-20">
        {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 opacity-60">
                <ListMusic size={48} className="mb-2" />
                <p className="text-sm">Chưa có bài hát nào</p>
                <p className="text-xs">Hãy tìm kiếm và thêm bài hát!</p>
            </div>
        ) : (
            queue.map((song, index) => (
                <div 
                    key={`${song.id}-${index}`}
                    className={`
                        relative flex items-center gap-2 p-2 rounded-lg border shadow-sm
                        ${song.isPriority ? 'bg-pink-50 border-pink-100' : 'bg-white border-gray-100'}
                    `}
                >
                    <div className="w-5 text-center text-gray-400 text-xs font-mono">{index + 1}</div>
                    
                    <img 
                        src={song.thumbnail} 
                        alt="thumb" 
                        className="w-10 h-10 object-cover rounded bg-gray-200 shrink-0 border border-gray-100" 
                    />
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <h4 className="text-sm font-semibold text-gray-800 truncate w-full">
                                {song.title}
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="truncate max-w-[100px]">{song.channel}</span>
                            {song.isPriority && <Zap size={10} className="text-yellow-500 fill-yellow-500" />}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Priority Button */}
                        <button 
                            onClick={() => onPrioritize(index)}
                            className={`p-2 rounded-lg transition-colors border ${index === 0 ? 'opacity-30 cursor-not-allowed text-gray-300 border-transparent' : 'text-yellow-500 border-yellow-100 bg-yellow-50'}`}
                            disabled={index === 0}
                            title="Ưu tiên lên đầu"
                        >
                            <Zap size={16} className={song.isPriority ? "fill-yellow-500" : ""} />
                        </button>

                        {/* Remove Button */}
                        <button 
                            onClick={() => onRemove(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RemoteQueue;