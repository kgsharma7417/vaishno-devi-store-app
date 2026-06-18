import { X, Ruler } from "lucide-react";

export default function SizeGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-earth-100 bg-earth-50/50">
          <h2 className="text-xl font-heading font-bold text-earth-900 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-sage-600" />
            Bangle Size Guide
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-earth-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Instructions */}
            <div>
              <h3 className="font-heading font-semibold text-earth-800 mb-4">How to Measure Your Size</h3>
              <ol className="space-y-4 text-sm text-earth-600">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold flex items-center justify-center">1</span>
                  <p>Bring your thumb and little finger together, as if putting on a bangle.</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold flex items-center justify-center">2</span>
                  <p>Take a piece of string or a paper strip and wrap it around the widest part of your hand (knuckles).</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold flex items-center justify-center">3</span>
                  <p>Mark the point where the string meets and measure the length on a ruler in inches.</p>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sage-100 text-sage-700 font-bold flex items-center justify-center">4</span>
                  <p>Compare this length (Circumference) with our size chart below.</p>
                </li>
              </ol>
            </div>

            {/* Illustration */}
            <div className="bg-earth-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 mb-4 opacity-80">
                {/* SVG Illustration of a hand measuring */}
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 80 V50 C40 45 45 45 45 50 V70 M50 80 V40 C50 35 55 35 55 40 V70 M60 80 V45 C60 40 65 40 65 45 V70 M30 70 V60 C30 55 35 55 35 60 V70 M75 70 V65 C75 60 70 60 70 65 V80" stroke="#8b7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M30 70 C30 90 75 90 75 70" stroke="#8b7355" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 55 L80 55" stroke="#d4727a" strokeWidth="2" strokeDasharray="4 4"/>
                  <circle cx="20" cy="55" r="3" fill="#d4727a"/>
                  <circle cx="80" cy="55" r="3" fill="#d4727a"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-earth-700">Measure across the widest part of your knuckles.</p>
            </div>
          </div>

          {/* Size Chart Table */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-earth-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-earth-100 text-earth-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Bangle Size</th>
                  <th className="px-4 py-3 font-semibold">Diameter (inches)</th>
                  <th className="px-4 py-3 font-semibold">Circumference (inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                <tr className="hover:bg-earth-50">
                  <td className="px-4 py-3 font-medium">2.2</td>
                  <td className="px-4 py-3 text-earth-600">2.12"</td>
                  <td className="px-4 py-3 text-earth-600">6.67"</td>
                </tr>
                <tr className="hover:bg-earth-50">
                  <td className="px-4 py-3 font-medium">2.4</td>
                  <td className="px-4 py-3 text-earth-600">2.25"</td>
                  <td className="px-4 py-3 text-earth-600">7.06"</td>
                </tr>
                <tr className="hover:bg-earth-50 bg-sage-50/50">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    2.6 <span className="badge-sage text-[10px] px-1.5 py-0">Standard</span>
                  </td>
                  <td className="px-4 py-3 text-earth-600">2.37"</td>
                  <td className="px-4 py-3 text-earth-600">7.45"</td>
                </tr>
                <tr className="hover:bg-earth-50">
                  <td className="px-4 py-3 font-medium">2.8</td>
                  <td className="px-4 py-3 text-earth-600">2.50"</td>
                  <td className="px-4 py-3 text-earth-600">7.85"</td>
                </tr>
                <tr className="hover:bg-earth-50">
                  <td className="px-4 py-3 font-medium">2.10</td>
                  <td className="px-4 py-3 text-earth-600">2.62"</td>
                  <td className="px-4 py-3 text-earth-600">8.24"</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
