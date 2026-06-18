import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/shared/Toast";
import { Save, Plus, Trash2, Image as ImageIcon, GripVertical, Loader2, QrCode } from "lucide-react";

const INITIAL_SLIDE = {
  id: Date.now(),
  image: "",
  title: "",
  subtitle: "",
  desc: "",
  align: "center",
};

export default function HeroSettingsPage() {
  const { addToast } = useToast();
  const [slides, setSlides] = useState([]);
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "homepage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.heroSlides) setSlides(data.heroSlides);
          else setSlides([{ ...INITIAL_SLIDE }]);
          
          if (data.payment) {
            setUpiId(data.payment.upiId || "");
            setPayeeName(data.payment.payeeName || "");
          }
        } else {
          // If no settings exist yet, start with one empty slide
          setSlides([{ ...INITIAL_SLIDE }]);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        addToast({ type: "error", message: "Failed to load hero settings." });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [addToast]);

  const handleAddSlide = () => {
    setSlides([...slides, { ...INITIAL_SLIDE, id: Date.now() }]);
  };

  const handleRemoveSlide = (index) => {
    setSlides(slides.filter((_, i) => i !== index));
  };

  const updateSlide = (index, field, value) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  };

  const handleSave = async () => {
    // Validation
    const invalidSlide = slides.find((s) => !s.image || !s.title);
    if (invalidSlide) {
      addToast({ type: "warning", message: "Every slide must have an Image URL and a Title." });
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "homepage"), {
        heroSlides: slides,
        payment: { upiId, payeeName },
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      addToast({ type: "success", title: "Saved!", message: "Homepage hero slides have been updated successfully." });
    } catch (error) {
      console.error("Error saving settings:", error);
      addToast({ type: "error", message: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-sage-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold text-earth-800">
            Store Settings
          </h1>
          <p className="text-earth-400 mt-1">
            Customize the main homepage slider and your payment details.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className="card p-6 flex gap-6 relative group animate-scale-in">
            {/* Grip Handle */}
            <div className="flex flex-col items-center gap-4 justify-center text-earth-300">
              <span className="font-bold text-sm">#{index + 1}</span>
            </div>

            {/* Slide Editor */}
            <div className="flex-1 space-y-4">
              
              {/* Image URL */}
              <div>
                <label className="input-label">Image URL <span className="text-rose-400">*</span></label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={slide.image}
                      onChange={(e) => updateSlide(index, "image", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="input-field text-sm"
                    />
                  </div>
                  {/* Preview Thumb */}
                  {slide.image && (
                    <div className="w-16 h-16 rounded-lg bg-earth-100 overflow-hidden border border-earth-200 flex-shrink-0">
                      <img src={slide.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.src = ''} />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="input-label">Main Title <span className="text-rose-400">*</span></label>
                  <textarea
                    value={slide.title}
                    onChange={(e) => updateSlide(index, "title", e.target.value)}
                    placeholder="E.g., The Royal Bridal Heritage"
                    rows={2}
                    className="input-field text-sm resize-none"
                  />
                  <p className="text-xs text-earth-400 mt-1">Use Enter for a new line</p>
                </div>

                {/* Subtitle & Align */}
                <div className="space-y-4">
                  <div>
                    <label className="input-label">Subtitle (Small top text)</label>
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
                      placeholder="E.g., New 2026 Collection"
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="input-label">Text Alignment</label>
                    <select
                      value={slide.align}
                      onChange={(e) => updateSlide(index, "align", e.target.value)}
                      className="select-field text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="input-label">Description (Below title)</label>
                <input
                  type="text"
                  value={slide.desc}
                  onChange={(e) => updateSlide(index, "desc", e.target.value)}
                  placeholder="Short description..."
                  className="input-field text-sm"
                />
              </div>

            </div>

            {/* Remove Slide Btn */}
            <button
              onClick={() => handleRemoveSlide(index)}
              disabled={slides.length === 1}
              className="absolute top-4 right-4 p-2 text-earth-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove Slide"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {/* Add Slide Btn */}
        <button
          onClick={handleAddSlide}
          className="w-full py-6 rounded-2xl border-2 border-dashed border-earth-200 text-earth-500 font-semibold hover:border-sage-400 hover:text-sage-600 hover:bg-sage-50 transition-all flex items-center justify-center gap-2 mb-12"
        >
          <Plus className="w-5 h-5" /> Add Another Slide
        </button>
        
        {/* Payment Settings Section */}
        <div className="card p-6 md:p-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-earth-100">
            <div className="w-12 h-12 rounded-xl bg-sage-50 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-sage-600" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-earth-800">UPI Payment Settings</h2>
              <p className="text-sm text-earth-500 mt-1">Set the UPI ID where customers will send payments. A QR code will be generated automatically at checkout.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Your UPI ID <span className="text-rose-400">*</span></label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 9876543210@paytm"
                className="input-field"
              />
              <p className="text-xs text-earth-400 mt-2">Enter your active UPI ID from PhonePe, GPay, Paytm, etc.</p>
            </div>
            <div>
              <label className="input-label">Payee Name (Optional)</label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. Radhe Bangles"
                className="input-field"
              />
              <p className="text-xs text-earth-400 mt-2">The business name that will appear when customers scan the QR.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
