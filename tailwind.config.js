/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
  ],
  corePlugins: {
    // Preflight is disabled: the site already ships a hand-built CSS reset
    // and design system (globals.css / landing.css). Enabling Preflight
    // would re-reset headings, buttons, forms, etc. and break the existing
    // landing page and component styling.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        parchment: "#f4efe4",
        ivory: "#fbf9f2",
        emerald: { DEFAULT: "#0f3b2e", 2: "#14261d" },
        forest: "#1c5240",
        brass: "#b1892c",
        gold: "#d6bb6e",
        ink: "#16211b",
        mist: "#6a786e",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
