import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ExternalLink, Trash2 } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { formatPrice } from "../../utils/helpers";
import { useToast } from "./Toast";

// ─── Markdown parser ───────────────────────────────────────────────────────────
const parseMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n- /g, "<br/>• ")
    .replace(/^- /g, "• ")
    .replace(/\n/g, "<br/>");
};

// ─── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
Tu "Aara" hai — Vaishno Devi Store ki official AI customer assistant. Agra, UP mein ek mashhoor bangle store.

BHASHA RULE (SABSE ZAROORI):
- Agar user Hindi ya Hinglish mein likhe → hamesha Hindi/Hinglish mein reply kar
- Agar user English mein likhe → English mein reply kar
- Kabhi bhi galat bhasha mat use kar

Tone: Dost jaisi, helpful, thodi si enthusiastic. Emojis thoda thoda use kar 🪬

## Store Details
- Naam: Vaishno Devi Store (Maa Vaishno Devi Ladies Corner)
- Jagah: Agra, Uttar Pradesh
- WhatsApp: +919058802144
- Timing: Mon–Sat 10am–8pm, Sunday 11am–6pm

## Products
**Glass Bangles (Kach ki Chudiyaan)**
- Plain glass, Meenakari, Mirror work
- Sizes: 2.0, 2.2, 2.4, 2.6, 2.8, 2.10, 2.12
- Price: ₹50–₹500 per dozen

**Lac Bangles (Lakh ki Chudiyaan)**
- Kundan work, Stone-studded, Bridal sets
- Price: ₹150–₹800 per set

**Metal Bangles**
- Brass, German Silver, Oxidized
- Price: ₹80–₹600 per piece

**Stone / Imitation Bangles**
- Kundan, Polki, American Diamond (AD)
- Bridal & festive — ₹200–₹2000 per set

## Size Guide
Wrist circumference (cm) → Size:
2.0=5.1cm | 2.2=5.6cm | 2.4=6.1cm | 2.6=6.6cm | 2.8=7.1cm | 2.10=7.6cm | 2.12=8.1cm

## Delivery
- Agra/Delhi NCR: 2–3 din
- Metro cities: 3–5 din  
- Other cities: 5–7 din
- Remote: 7–10 din
- FREE delivery above ₹999, ₹50 charge neeche

## Returns
- 7 din ke andar return/exchange
- Unboxing video zaroori for damage claims
- Bridal/custom sets: non-returnable

## Payment
- UPI (PhonePe, GPay, Paytm)
- COD (orders below ₹2000)
- Card / Bank Transfer

## Rules
- Jo nahi pata → "WhatsApp karein: +919058802144"
- Fake offers/discounts kabhi mat bolo
- Reply chhota rakho — max 4-5 lines, bullets use karo
- Hamesha helpful ending karo
`;

// ─── Quick Replies ─────────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { label: "🪬 Kya sell karte ho?", msg: "Aap kya kya sell karte ho?" },
  { label: "📦 Order track karo", msg: "Mujhe apna order track karna hai" },
  { label: "🔄 Return policy", msg: "Return policy kya hai?" },
  { label: "🚚 Delivery charges", msg: "Delivery charge kitna lagta hai?" },
  { label: "📏 Size guide", msg: "Bangle size kaise measure karein?" },
];

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "919058802144";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { addToast } = useToast();

  // ── Initial greeting ──
  const setGreeting = () => {
    setMessages([
      {
        role: "model",
        text: "Namaste! 🪬 Vaishno Devi Store mein aapka swagat hai!\n\nMain Aara hoon — aapki AI assistant. Bangles, sizes, delivery ya koi bhi sawaal poochh sakte hain! 😊",
      },
    ]);
  };

  // ── Load from localStorage ──
  useEffect(() => {
    // Debug: Fetch available models to see which ones this API key has access to
    if (GEMINI_API_KEY) {
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`)
        .then(res => res.json())
        .then(data => {
          console.log("AVAILABLE MODELS FOR THIS KEY:", data.models?.map(m => m.name));
        })
        .catch(err => console.error("Error fetching models:", err));
    }

    const saved = localStorage.getItem("vaishno_devi_chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setGreeting();
      }
    } else {
      setGreeting();
    }
  }, []);

  // ── Proactive badge + tooltip after 8 seconds ──
  useEffect(() => {
    const badgeTimer = setTimeout(() => {
      if (!hasOpened) {
        setUnreadCount(1);
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 5000);
      }
    }, 8000);
    return () => clearTimeout(badgeTimer);
  }, [hasOpened]);

  // ── Scroll + save ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) {
      localStorage.setItem("vaishno_devi_chat", JSON.stringify(messages));
    }
  }, [messages]);

  // ── Focus input on open ──
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasOpened(true);
    setUnreadCount(0);
    setShowTooltip(false);
  };

  // ── Clear chat ──
  const clearChat = () => {
    localStorage.removeItem("vaishno_devi_chat");
    setGreeting();
    addToast({ type: "success", message: "Chat clear ho gayi!" });
  };

  // ── Firebase order lookup ──
  const lookupOrder = async (text) => {
    const words = text.trim().split(/\s+/);
    for (const word of words) {
      if (word.length >= 15 && /^[a-zA-Z0-9]+$/.test(word)) {
        try {
          const snap = await getDoc(doc(db, "orders", word));
          if (snap.exists()) {
            const d = snap.data();
            const date = d.createdAt?.toDate().toLocaleDateString("en-IN") || "N/A";
            return `✅ **Aapka order mila!**\n\n**Status:** ${d.orderStatus}\n**Total:** ${formatPrice(d.totalAmount)}\n**Date:** ${date}\n\nAur koi madad chahiye? 😊`;
          }
        } catch (e) {
          console.error("Order lookup failed:", e);
        }
      }
    }
    return null;
  };

  // ── Send message ──
  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsLoading(true);

    try {
      // 1. Order tracking check
      const isOrderQuery = /order|track|tracking|kahan|status|order id/i.test(trimmed);
      if (isOrderQuery) {
        const orderResult = await lookupOrder(trimmed);
        if (orderResult) {
          setMessages((prev) => [...prev, { role: "model", text: orderResult }]);
          setIsLoading(false);
          return;
        }
      }

      // 2. API key guard
      if (!GEMINI_API_KEY) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "⚠️ AI assistant abhi unavailable hai. WhatsApp karein: +919058802144" },
        ]);
        setIsLoading(false);
        return;
      }

      // 3. Build robust history (strictly alternating, starting with 'user')
      let cleanHistory = [];
      const pastMessages = [...messages];
      
      // Remove initial hardcoded greeting if present
      if (pastMessages.length > 0 && pastMessages[0].role === "model") {
        pastMessages.shift();
      }

      // Group consecutive messages of the same role to enforce alternation
      for (const msg of pastMessages) {
        if (cleanHistory.length === 0) {
          if (msg.role === "user") cleanHistory.push({ role: msg.role, text: msg.text });
        } else {
          const lastMsg = cleanHistory[cleanHistory.length - 1];
          if (msg.role !== lastMsg.role) {
            cleanHistory.push({ role: msg.role, text: msg.text });
          } else {
            lastMsg.text += "\n" + msg.text;
          }
        }
      }

      // History should ideally end with a 'model' message before we send a new 'user' message
      if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
        cleanHistory.pop();
      }

      const formattedHistory = cleanHistory.slice(-10).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      // 4. Gemini API call using SDK
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-lite",
        systemInstruction: SYSTEM_PROMPT
      });

      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
      });

      const result = await chat.sendMessage(trimmed);
      const reply = result.response.text();

      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "😔 Kuch gadbad ho gayi. WhatsApp karein: **+919058802144**" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 left-6 z-[90] flex flex-col items-start">

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="mb-4 w-[320px] sm:w-[360px] h-[520px] max-h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(109,40,217,0.18)] border border-violet-100 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 px-4 py-3 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Aara ✨</p>
                <p className="text-[10px] text-violet-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Online • Vaishno Devi Store
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Chat clear karo"
                className="p-2 hover:bg-white/20 rounded-full transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/60 to-white">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-slate-200" : "bg-violet-100"
                    }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-violet-600" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user"
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white rounded-tr-sm"
                      : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm"
                    }`}
                >
                  {msg.role === "user" ? (
                    msg.text
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }} />
                  )}
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies — first 4 messages mein dikhega */}
          {!isLoading && messages.length < 4 && (
            <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-white border-t border-slate-100 shrink-0">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => sendMessage(qr.msg)}
                  className="text-[11px] bg-white text-violet-700 hover:bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-full shadow-sm transition-all whitespace-nowrap font-medium active:scale-95"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Kuch bhi poochhen..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:from-slate-300 disabled:to-slate-300 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all shrink-0 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* WhatsApp fallback */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-[10px] text-slate-400 hover:text-green-600 flex items-center justify-center gap-1 transition-colors"
            >
              Seedha baat karein WhatsApp par
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      {!isOpen && (
        <div className="relative group flex items-end gap-2">
          {/* Tooltip bubble */}
          {showTooltip && (
            <div className="absolute left-16 bottom-2 bg-white text-slate-700 text-xs font-medium px-3 py-2 rounded-xl shadow-lg border border-slate-100 whitespace-nowrap animate-fade-in">
              💬 Kuch poochna hai?
              <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-white border-l border-b border-slate-100 rotate-45" />
            </div>
          )}

          {/* Glow */}
          <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />

          {/* Button */}
          <button
            onClick={handleOpen}
            aria-label="Chat kholo"
            className="relative bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-violet-300/50 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/20"
          >
            <MessageCircle className="w-7 h-7" />

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}