import React from 'react';
import { X, Smartphone, Search, Music, Zap, User, Phone, Heart, Facebook } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-karaoke-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full relative shadow-2xl flex flex-col max-h-[90vh]">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
            <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-karaoke-900 mb-6 text-center border-b border-gray-100 pb-4">
          Hướng Dẫn Sử Dụng <span className="text-karaoke-600">HatKaraoke.VN</span>
        </h2>

        <div className="overflow-y-auto pr-2 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 text-indigo-600 font-bold text-xl shadow-sm">
              1
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                <Smartphone className="text-indigo-500" size={20} />
                Kết Nối Điện Thoại
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Trên màn hình máy tính/TV, nhấn nút <b>"Kết nối ĐT"</b> ở góc phải. Dùng điện thoại quét mã QR hiện ra để truy cập vào giao diện điều khiển (Remote).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100 text-purple-600 font-bold text-xl shadow-sm">
              2
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                <Search className="text-purple-500" size={20} />
                Tìm & Chọn Bài Hát
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Trên điện thoại, nhập tên bài hát vào ô tìm kiếm. 
                <br/>
                - Nhấn nút <b className="text-white bg-indigo-500 px-1 rounded mx-1">+</b> để thêm vào cuối hàng chờ.
                <br/>
                - Nhấn nút <b className="text-yellow-500 bg-yellow-50 border border-yellow-200 px-1 rounded mx-1"><Zap size={12} className="inline"/></b> để ưu tiên phát ngay sau bài hiện tại.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center shrink-0 border border-pink-100 text-pink-600 font-bold text-xl shadow-sm">
              3
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                <Music className="text-pink-500" size={20} />
                Thưởng Thức
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Bài hát sẽ tự động phát trên màn hình lớn. Bạn có thể xem danh sách chờ bên phải màn hình và yêu cầu bỏ qua bài hát nếu cần.
              </p>
            </div>
          </div>

          {/* Author Info Section */}
          <div className="border-t-2 border-dashed border-gray-100 pt-6 mt-4">
            <h3 className="text-lg font-bold text-karaoke-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-karaoke-600" />
                Thông Tin Tác Giả
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                             <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Tác giả</p>
                            <p className="font-bold text-gray-800 text-lg">Nguyễn Thái</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                             <Facebook size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Facebook</p>
                            <a 
                                href="https://www.facebook.com/nqthaivl.1982" 
                                target="_blank" 
                                rel="noreferrer"
                                className="font-medium text-blue-600 hover:underline truncate block"
                            >
                                nqthaivl.1982
                            </a>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                             <Phone size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Điện thoại</p>
                            <a href="tel:0917833184" className="font-bold text-gray-800 hover:text-green-600 text-lg">
                                0917833184
                            </a>
                        </div>
                     </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm md:w-48 shrink-0">
                    <p className="text-xs font-bold text-neon-pink mb-2 flex items-center gap-1 uppercase tracking-wide">
                        <Heart size={12} fill="currentColor" /> Ủng hộ tác giả
                    </p>
                    <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
                        <img 
                            src="https://api.vietqr.io/image/970436-9917833184-yei6iTJ.jpg?accountName=NGUYEN%20QUOC%20THAI&amount=0&addInfo=DONATE" 
                            alt="Mã QR Donate" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Quét mã QR để Donate</p>
                </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-gradient-to-r from-karaoke-600 to-indigo-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            Đã Hiểu, Bắt Đầu Hát!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;