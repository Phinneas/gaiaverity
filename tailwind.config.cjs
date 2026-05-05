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
          sage:        "#a1b5a8",
          tan:         "#cbb093",
          terracotta:  "#dfa477",
          cream:       "#f5dfc5",
          soil:        "#2d2a24",
          dark:        "#173404",
          mid:         "#3B6D11",
          border:      "#639922",
          light:       "#97C459",
          pale:        "#EAF3DE",
        },
      },
      fontFamily: {
        sans:  ["Inter Variable", "Inter", ...defaultTheme.fontFamily.sans],
        serif: ["Lora", ...defaultTheme.fontFamily.serif],
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
