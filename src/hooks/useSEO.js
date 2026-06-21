import { useEffect } from "react";

const SITE_NAME = "Maa Vaishno Devi Ladies Corner";

/**
 * useSEO — Dynamically update page title and meta description
 * @param {Object} options
 * @param {string} options.title - Page-specific title (without site name)
 * @param {string} [options.description] - Meta description for this page
 * @param {string} [options.image] - OG image URL
 */
export function useSEO({ title, description, image }) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | ${SITE_NAME}`;
    } else {
      document.title = `${SITE_NAME} — ऑनलाइन चूड़ियाँ और ज्वेलरी`;
    }

    // Update meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      }
      // Update OG description too
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute("content", description);
      }
    }

    // Update OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) {
      ogTitle.setAttribute("content", `${title} | ${SITE_NAME}`);
    }

    // Update OG image
    if (image) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute("content", image);
      }
    }

    // Cleanup — restore on unmount
    return () => {
      document.title = `${SITE_NAME} — ऑनलाइन चूड़ियाँ और ज्वेलरी`;
    };
  }, [title, description, image]);
}
