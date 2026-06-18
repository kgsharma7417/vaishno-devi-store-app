// Product categories for the bangle store
export const CATEGORIES = [
  "Bangles",
  "Rings",
  "Bridal Chuda",
  "Daily Wear",
  "Party Wear",
  "Haldi Special",
  "Mehendi Special",
  "Festive Collection",
  "Trendy Bangles",
  "Kundan Set",
  "Lac Bangles",
  "Metal Bangles",
];

// Standard bangle sizes (in inches)
export const BANGLE_SIZES = [
  "2.0",
  "2.2",
  "2.4",
  "2.6",
  "2.8",
  "2.10",
  "2.12",
];

// Available color options
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

// Color swatches for visual display
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

// WhatsApp number from env
export const WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";

// Low stock threshold
export const LOW_STOCK_THRESHOLD = 2;

// Max images per product
export const MAX_IMAGES = 6;

// Firebase Storage path for product images
export const STORAGE_PRODUCTS_PATH = "products";
