import React from 'react';
import { X, Smartphone, Wifi, Loader2 } from 'lucide-react';

interface RemoteQRProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateConnect: () => void;
  sessionId: string;
}

const RemoteQR: React.FC<RemoteQRProps> = ({ isOpen, onClose, onSimulateConnect, sessionId }) => {
  if (!isOpen) return null;

  // Construct the remote URL using the current window location
  const currentUrl = window.location.href.split('?')[0];
  const remoteUrl = `${currentUrl}?mode=remote&session=${sessionId}`;
  
  // Use QuickChart API for better reliability
  const qrApiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(remoteUrl)}&size=300&ecLevel=H&margin=1&dark=2e1065&light=ffffff`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-karaoke-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-2xl flex flex-col items-center">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
            <X size={24} />
        </button>

        <div className="text-center w-full">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-karaoke-600">
                <Smartphone size={32} />
            </div>
            <h2 className="text-2xl font-bold text-karaoke-900 mb-2">Kết nối thiết bị</h2>
            
            {sessionId ? (
                <>
                    <p className="text-gray-500 text-sm mb-6">
                        Quét mã để chọn bài hát từ điện thoại.
                    </p>

                    {/* QR Code Container */}
                    <div className="bg-white border-2 border-indigo-100 p-2 rounded-xl w-64 h-64 mx-auto mb-6 flex items-center justify-center shadow-inner overflow-hidden">
                        <img 
                            src={qrApiUrl} 
                            alt="Scan QR"
                            className="w-full h-full object-contain block"
                            loading="eager"
                        />
                    </div>
                </>
            ) : (
                <div className="h-64 flex flex-col items-center justify-center text-karaoke-600">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p className="text-sm font-medium">Đang tạo kết nối...</p>
                </div>
            )}

            <div className="space-y-2 text-xs text-gray-400">
                <p>Mở Camera hoặc Zalo để quét mã</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 w-full">
                 <button 
                    onClick={onSimulateConnect}
                    disabled={!sessionId}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold underline disabled:opacity-50"
                 >
                    Mở link trực tiếp (Giả lập Remote)
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteQR;