import { WHATSAPP_NUMBER } from "./constants";

/**
 * Calculate final price after discount
 * @param {number} mrp - Maximum Retail Price
 * @param {number} discountPercentage - Discount percentage (0-100)
 * @returns {number} Final price rounded to nearest integer
 */
export function calculateFinalPrice(mrp, discountPercentage) {
  if (!mrp || mrp <= 0) return 0;
  if (!discountPercentage || discountPercentage <= 0) return mrp;
  const discount = Math.min(Math.max(discountPercentage, 0), 100);
  return Math.round(mrp - (mrp * discount) / 100);
}

/**
 * Format price in Indian Rupees
 * @param {number} price
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Build WhatsApp URL with pre-filled message
 * @param {object} params
 * @param {string} params.productName
 * @param {string} params.selectedSize
 * @param {string} params.selectedColor
 * @param {number} params.finalPrice
 * @param {string} params.productUrl
 * @returns {string} WhatsApp URL
 */
export function buildWhatsAppUrl({
  productName,
  selectedSize,
  selectedColor,
  finalPrice,
  productUrl,
}) {
  const message = `Hi, I want to buy *${productName}*, Size: *${selectedSize}*, Color: *${selectedColor}* for *₹${finalPrice}*.\nLink: ${productUrl}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Generate a unique file name for Firebase Storage
 * @param {string} originalName - Original file name
 * @returns {string} Unique file name
 */
export function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const baseName = originalName.split(".").slice(0, -1).join(".").replace(/\s+/g, "-").toLowerCase();
  return `${baseName}-${timestamp}-${randomStr}.${extension}`;
}

/**
 * Validate image file
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, WebP, and AVIF images are allowed." };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "Image size must be under 5MB." };
  }

  return { valid: true };
}

/**
 * Check if any size in sizesAndStock is below threshold
 * @param {object} sizesAndStock - Map of size to stock count
 * @param {number} threshold - Low stock threshold
 * @returns {string[]} Array of low-stock size strings
 */
export function getLowStockSizes(sizesAndStock, threshold = 2) {
  return Object.entries(sizesAndStock)
    .filter(([, stock]) => stock <= threshold && stock > 0)
    .map(([size]) => size);
}

/**
 * Check if any size is out of stock
 * @param {object} sizesAndStock
 * @returns {string[]} Array of out-of-stock sizes
 */
export function getOutOfStockSizes(sizesAndStock) {
  return Object.entries(sizesAndStock)
    .filter(([, stock]) => stock === 0)
    .map(([size]) => size);
}

/**
 * Truncate text with ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Generate a unique SKU for a product
 * Format: MVD-{CATCODE}-{RANDOM4}
 * @param {string} category - Product category
 * @returns {string} SKU string e.g. "MVD-FJ-7X2K"
 */
export function generateSKU(category = "") {
  const catMap = {
    "फैंसी ज्वेलरी (Fancy Jewellery)": "FJ",
    "बर्थ डे का सामान (Birthday Items)": "BD",
    "गिफ्ट्स (Gifts)": "GF",
    "लेडीज कार्नर (Cosmetics & Accessories)": "LC",
  };
  const catCode = catMap[category] || "XX";
  const random = Math.random().toString(36).toUpperCase().substring(2, 6);
  return `MVD-${catCode}-${random}`;
}
