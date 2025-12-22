import React, { useState } from 'react';
import { SearchResult, Song } from '../types';
import { searchYoutubeKaraoke } from '../services/youtubeService';
import { Search as SearchIcon, Plus, Loader2, Zap } from 'lucide-react';

interface SearchProps {
  onAddSong: (song: Song, priority: boolean) => void;
  isRemote?: boolean;
}

const Search: React.FC<SearchProps> = ({ onAddSong, isRemote = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setResults([]);
    
    try {
      // Classic YouTube Search Only
      const data = await searchYoutubeKaraoke(query);

      if (data.length === 0) {
        setError("Không tìm thấy bài hát. Hãy thử từ khóa khác (vd: 'My Heart Will Go On').");
      }
      setResults(data);
    } catch (err) {
        console.error(err);
        setError("Tìm kiếm thất bại. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (result: SearchResult, priority: boolean) => {
    const newSong: Song = {
        ...result,
        addedBy: isRemote ? 'Remote User' : 'Host',
        isPriority: priority
    };
    onAddSong(newSong, priority);
  };

  return (
    <div className={`flex flex-col h-full ${isRemote ? 'p-2' : 'p-0'}`}>
      
      <form onSubmit={handleSearch} className="relative mb-6">
        <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
                isRemote ? "Tìm bài hát..." : "Tìm tên bài hát (vd: 'Em Của Ngày Hôm Qua')"
            }
            className="w-full bg-white border border-gray-200 text-gray-800 rounded-full py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:border-karaoke-500 focus:ring-1 focus:ring-karaoke-500 transition-all placeholder:text-gray-400"
        />
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        
        <button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-karaoke-600 hover:bg-karaoke-700 rounded-full text-xs font-bold text-white transition-colors disabled:opacity-50 shadow-sm"
        >
            {isLoading ? '...' : 'TÌM'}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-karaoke-600">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p className="text-sm animate-pulse">Đang tìm trên YouTube...</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {results.map((result) => (
                <div key={result.id} className="group bg-white hover:bg-gray-50 p-3 rounded-xl flex items-center gap-3 transition-all border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md">
                    <img 
                        src={result.thumbnail} 
                        alt={result.title} 
                        referrerPolicy="no-referrer"
                        className="w-24 h-14 object-cover rounded-md flex-shrink-0 bg-gray-200 border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate text-sm md:text-base" dangerouslySetInnerHTML={{__html: result.title}}></h4>
                        <p className="text-xs text-gray-500 truncate">{result.channel}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => handleAdd(result, false)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg transition-colors border border-indigo-100"
                            title="Thêm vào hàng chờ"
                        >
                            <Plus size={16} />
                        </button>
                        <button 
                            onClick={() => handleAdd(result, true)}
                            className="p-2 bg-pink-50 text-pink-500 hover:bg-pink-100 hover:text-pink-700 rounded-lg transition-colors border border-pink-100"
                            title="Ưu tiên (Phát kế tiếp)"
                        >
                            <Zap size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}
      
      {!isLoading && results.length === 0 && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
            <SearchIcon size={48} className="mb-2 mx-auto" />
            <p>Nhập tên bài hát để tìm kiếm</p>
        </div>
      )}
    </div>
  );
};

export default Search;