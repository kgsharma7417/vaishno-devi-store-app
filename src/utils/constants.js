// ─── Primary Categories (Shop-specific) ───────────────────────────────────────
export const CATEGORIES = [
  "फैंसी ज्वेलरी (Fancy Jewellery)",
  "बर्थ डे का सामान (Birthday Items)",
  "गिफ्ट्स (Gifts)",
  "लेडीज कार्नर (Cosmetics & Accessories)",
];

// ─── Sub-category map (dynamic by parent) ─────────────────────────────────────
export const SUB_CATEGORIES = {
  "फैंसी ज्वेलरी (Fancy Jewellery)": [
    "Bridal Set",
    "Maang Tikka",
    "Necklace",
    "Earrings",
    "Bangles",
    "Rings",
    "Anklet",
    "Nose Ring",
    "Choker",
    "Full Bridal Set",
  ],
  "बर्थ डे का सामान (Birthday Items)": [
    "Balloons",
    "Caps & Hats",
    "Banners",
    "Candles",
    "Party Kits",
    "Decorations",
    "Cake Toppers",
    "Ribbons & Bows",
  ],
  "गिफ्ट्स (Gifts)": [
    "Toys",
    "Showpieces",
    "Photo Frames",
    "Soft Toys",
    "Gift Hampers",
    "Idols & Figurines",
    "Keychains",
  ],
  "लेडीज कार्नर (Cosmetics & Accessories)": [
    "Makeup",
    "Bangles",
    "Hair Accessories",
    "Handbags",
    "Cosmetics",
    "Nail Art",
    "Bindis & Kajal",
    "Perfumes",
  ],
};

// ─── Occasion Tags ─────────────────────────────────────────────────────────────
export const OCCASION_TAGS = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Baby Shower",
  "Festive",
  "Daily Wear",
  "Party",
  "Mehendi",
  "Haldi",
  "Engagement",
  "Baby Naming",
  "Valentine's Day",
];

// ─── Material Types ────────────────────────────────────────────────────────────
export const MATERIAL_TYPES = [
  "AD Stone",
  "Kundan",
  "Artificial Gold",
  "Plastic",
  "Glass",
  "Lac",
  "Metal",
  "Fabric",
  "Acrylic",
  "Brass",
  "Silver-plated",
];

// ─── Rental Status Options ─────────────────────────────────────────────────────
export const RENTAL_STATUS = [
  "Available",
  "Rented Out",
  "Sent for Maintenance",
];

// ─── Standard bangle sizes (in inches) ────────────────────────────────────────
export const BANGLE_SIZES = [
  "2.0",
  "2.2",
  "2.4",
  "2.6",
  "2.8",
  "2.10",
  "2.12",
];

// ─── Available color options ───────────────────────────────────────────────────
export const AVAILABLE_COLORS = [
  "Red",
  "Maroon",
  "Gold",
  "Silver",
  "Green",
  "Blue",
  "Pink",
  "White",
  "Black",
  "Orange",
  "Yellow",
  "Purple",
  "Multi-Color",
  "Magenta",
  "Cream",
  "Peach",
];

// ─── Color swatches for visual display ────────────────────────────────────────
export const COLOR_SWATCHES = {
  Red: "#DC2626",
  Maroon: "#7F1D1D",
  Gold: "#D4A843",
  Silver: "#A8A29E",
  Green: "#16A34A",
  Blue: "#2563EB",
  Pink: "#EC4899",
  White: "#F5F5F4",
  Black: "#1C1917",
  Orange: "#EA580C",
  Yellow: "#EAB308",
  Purple: "#9333EA",
  "Multi-Color":
    "linear-gradient(135deg, #DC2626, #EAB308, #16A34A, #2563EB, #9333EA)",
  Magenta: "#C026D3",
  Cream: "#FEF3C7",
  Peach: "#FDBA74",
};

// ─── WhatsApp number from env ──────────────────────────────────────────────────
export const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";

// ─── Low stock threshold ───────────────────────────────────────────────────────
export const LOW_STOCK_THRESHOLD = 2;

// ─── Max images per product ────────────────────────────────────────────────────
export const MAX_IMAGES = 6;

// ─── Firebase Storage path for product images ─────────────────────────────────
export const STORAGE_PRODUCTS_PATH = "products";
