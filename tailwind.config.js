/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        earth: {
          50: "#faf7f2",
          100: "#f0ebe3",
          200: "#ddd5c8",
          300: "#c4b8a5",
          400: "#a89880",
          500: "#8b7355",
          600: "#735e44",
          700: "#5c4a32",
          800: "#453724",
          900: "#3a2e1f",
        },
        sage: {
          50: "#f0f5f0",
          100: "#dce8dc",
          200: "#b8d4b8",
          300: "#93bd93",
          400: "#7daa7d",
          500: "#5a8f5a",
          600: "#4a7a4a",
          700: "#3d6b3d",
          800: "#2f5a2f",
          900: "#224a22",
        },
        gold: {
          50: "#fdf8eb",
          100: "#f9ecc8",
          200: "#f2d88e",
          300: "#e8c054",
          400: "#d4a843",
          500: "#b8922e",
          600: "#9a7824",
          700: "#7c5e1c",
          800: "#5e4615",
          900: "#40300e",
        },
        rose: {
          50: "#fef2f3",
          100: "#fce4e6",
          200: "#f9cdd1",
          300: "#f2a5ac",
          400: "#d4727a",
          500: "#c25a63",
          600: "#a84049",
          700: "#8c3039",
          800: "#742a32",
          900: "#63272e",
        },
      },
      fontFamily: {
        heading: ["'Playfair Display'", "serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(139, 115, 85, 0.08), 0 4px 6px -4px rgba(139, 115, 85, 0.05)",
        medium:
          "0 4px 25px -5px rgba(139, 115, 85, 0.12), 0 8px 10px -6px rgba(139, 115, 85, 0.06)",
        glow: "0 0 20px rgba(90, 143, 90, 0.3)",
        "glow-gold": "0 0 30px rgba(212, 168, 67, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-left": "fadeInLeft 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-right": "fadeInRight 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "spin-slow": "spin 20s linear infinite",
        blob: "blob 7s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(50px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-50px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(50px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-earth":
          "linear-gradient(135deg, #faf7f2 0%, #f0ebe3 50%, #dce8dc 100%)",
        "gradient-sage": "linear-gradient(135deg, #5a8f5a 0%, #4a7a4a 100%)",
        "gradient-gold": "linear-gradient(135deg, #d4a843 0%, #b8922e 100%)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
