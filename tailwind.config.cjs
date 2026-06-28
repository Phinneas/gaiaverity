/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: colors.neutral,
        gaia: {
          ink:         "#23312b",   // primary text
          gold:        "#c98633",   // warm accent — nav, highlights, warmth
          sage:        "#80bea4",   // medium sage/teal
          forest:      "#5c7962",   // medium forest green
          pale:        "#eef4f0",   // very light green — card backgrounds
          paper:       "#f7f5f0",   // warm off-white — page background
          border:      "#80bea4",   // borders — sage
        },
      },
      fontFamily: {
        sans:  ["Cabin Variable", "Cabin", ...defaultTheme.fontFamily.sans],
        serif: ["Fraunces Variable", "Fraunces", ...defaultTheme.fontFamily.serif],
      },
      aspectRatio: {
        "4/3": "4 / 3",
        "3/2": "3 / 2",
        "2/3": "2 / 3",
        "9/16": "9 / 16",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
