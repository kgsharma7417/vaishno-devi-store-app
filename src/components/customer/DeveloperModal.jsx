import { X, Phone, Mail, GraduationCap, Code, Briefcase, Award } from "lucide-react";

export default function DeveloperModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Modal Card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl border border-white/10 w-full max-w-md overflow-hidden shadow-2xl p-6 sm:p-8 animate-scale-in">

        {/* Glow effect in background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-600/20 rounded-full blur-3xl -z-10" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-slate-350 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header/Avatar */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20 mb-4 border border-white/20">
            <span className="text-3xl font-black tracking-tight text-white font-heading">KG</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Krishna Gopal Sharma</h2>
          <p className="text-violet-400 text-xs font-bold uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1.5">
            <Code className="w-3.5 h-3.5" /> Full Stack Developer
          </p>
        </div>

        {/* Content list */}
        <div className="space-y-4 text-sm mb-8 text-slate-300">
          {/* Education */}
          <div className="flex items-start gap-3.5 bg-white/5 p-3.5 rounded-2xl border border-white/5 hover:bg-white/8 transition-colors">
            <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs uppercase tracking-wider text-violet-300">Education</p>
              <p className="font-semibold text-sm mt-0.5">B.Tech in Computer Science & Engineering</p>
              <p className="text-xs text-slate-400">GLA University</p>
            </div>
          </div>

          {/* Project Details */}
          <div className="flex items-start gap-3.5 bg-white/5 p-3.5 rounded-2xl border border-white/5 hover:bg-white/8 transition-colors">
            <div className="p-2.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs uppercase tracking-wider text-fuchsia-300">About App</p>
              <p className="text-xs leading-relaxed mt-0.5">
                Designed & developed this premium e-commerce platform for Maa Vaishno Devi Ladies Corner featuring dynamic state management, custom wishlist drawers, real-time sync, and admin dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="space-y-3">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Let's build something amazing together!
          </p>

          {/* WhatsApp Button */}
          <a
            href="https://wa.me/917500298701?text=Hello Krishna Gopal! I saw your developer profile on Vaishno Devi Store. Let's connect."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Phone className="w-4 h-4 fill-white" />
            WhatsApp par baat karein
          </a>

          {/* Email Button */}
          <a
            href="mailto:krishangopalsh2424@gmail.com"
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <Mail className="w-4 h-4" />
            krishangopalsh2424@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
