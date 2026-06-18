import { X, Ruler } from "lucide-react";

export default function SizeGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white md:rounded-sm shadow-2xl overflow-hidden animate-slide-up md:animate-scale-in md:mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-fk-blue">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase">
            <Ruler className="w-4 h-4" />
            Bangle Size Guide
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-3">How to Measure Your Size</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fk-blue text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <p>Bring your thumb and little finger together, as if putting on a bangle.</p>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fk-blue text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <p>Wrap a string around the widest part of your hand (knuckles).</p>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fk-blue text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <p>Mark the point where the string meets and measure on a ruler in inches.</p>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-fk-blue text-white text-[10px] font-bold flex items-center justify-center">4</span>
                  <p>Compare this length with our size chart below.</p>
                </li>
              </ol>
            </div>

            {/* Illustration */}
            <div className="bg-gray-50 rounded-sm p-4 flex flex-col items-center justify-center text-center">
              <div className="w-28 h-28 mb-3 opacity-80">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 80 V50 C40 45 45 45 45 50 V70 M50 80 V40 C50 35 55 35 55 40 V70 M60 80 V45 C60 40 65 40 65 45 V70 M30 70 V60 C30 55 35 55 35 60 V70 M75 70 V65 C75 60 70 60 70 65 V80" stroke="#2874f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M30 70 C30 90 75 90 75 70" stroke="#2874f0" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 55 L80 55" stroke="#ff6161" strokeWidth="2" strokeDasharray="4 4"/>
                  <circle cx="20" cy="55" r="3" fill="#ff6161"/>
                  <circle cx="80" cy="55" r="3" fill="#ff6161"/>
                </svg>
              </div>
              <p className="text-xs font-medium text-gray-600">Measure across the widest part of your knuckles.</p>
            </div>
          </div>

          {/* Size Chart Table */}
          <div className="mt-6 overflow-hidden border border-gray-200 rounded-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-xs">Bangle Size</th>
                  <th className="px-4 py-2.5 font-medium text-xs">Diameter (inches)</th>
                  <th className="px-4 py-2.5 font-medium text-xs">Circumference (inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-sm">2.2</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">2.12"</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">6.67"</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-sm">2.4</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">2.25"</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">7.06"</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-fk-blue-light">
                  <td className="px-4 py-2.5 font-medium text-sm flex items-center gap-2">
                    2.6 <span className="bg-fk-blue text-white text-[10px] px-1.5 py-0 rounded-sm font-bold">Standard</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">2.37"</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">7.45"</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-sm">2.8</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">2.50"</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">7.85"</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-sm">2.10</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">2.62"</td>
                  <td className="px-4 py-2.5 text-gray-600 text-sm">8.24"</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
