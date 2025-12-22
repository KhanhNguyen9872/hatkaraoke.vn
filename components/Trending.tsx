import React, { useEffect, useState } from 'react';
import { SearchResult, Song } from '../types';
import { getTrendingKaraoke } from '../services/youtubeService';
import { Plus, Zap, Loader2, Flame, Trophy } from 'lucide-react';

interface TrendingProps {
  onAddSong: (song: Song, priority: boolean) => void;
}

const Trending: React.FC<TrendingProps> = ({ onAddSong }) => {
  const [songs, setSongs] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
        try {
            const data = await getTrendingKaraoke();
            setSongs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchTrending();
  }, []);

  const handleAdd = (result: SearchResult, priority: boolean) => {
    const newSong: Song = {
        ...result,
        addedBy: 'Remote User',
        isPriority: priority
    };
    onAddSong(newSong, priority);
  };

  if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-karaoke-600">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm animate-pulse">Đang cập nhật Hot Trend...</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
            {songs.map((song, index) => (
                <div key={song.id} className="group bg-white rounded-xl flex items-center gap-3 p-3 shadow-sm border border-gray-100 relative overflow-hidden">
                    {/* Rank Badge */}
                    <div className="absolute top-0 left-0 bg-gray-100 text-[10px] font-bold px-2 py-0.5 rounded-br-lg text-gray-500 z-10">
                        #{index + 1}
                    </div>

                    <div className="relative shrink-0">
                        <img 
                            src={song.thumbnail} 
                            alt={song.title} 
                            className="w-24 h-16 object-cover rounded-lg bg-gray-200 border border-gray-100"
                        />
                         {index < 3 && (
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-white text-xs font-bold shadow-sm
                                ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-700'}
                            `}>
                                <Trophy size={12} fill="currentColor" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-2">
                        <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight mb-1">
                            {song.title}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">{song.channel}</p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                        <button 
                            onClick={() => handleAdd(song, false)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg border border-indigo-100 shadow-sm active:scale-95 transition-all"
                            title="Thêm"
                        >
                            <Plus size={18} />
                        </button>
                        <button 
                            onClick={() => handleAdd(song, true)}
                            className="p-2 bg-pink-50 text-pink-500 hover:bg-pink-100 rounded-lg border border-pink-100 shadow-sm active:scale-95 transition-all"
                            title="Ưu tiên"
                        >
                            <Zap size={18} />
                        </button>
                    </div>
                </div>
            ))}
            
            <div className="text-center py-6 text-gray-400 text-xs">
                Đã hiển thị hết danh sách đề xuất
            </div>
        </div>
    </div>
  );
};

export default Trending;