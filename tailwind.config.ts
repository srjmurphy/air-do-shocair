import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        peat: "#120f0c",
        heather: "#6f5b8b",
        amber: "#d39a2d",
        malt: "#f0c66d",
        lichen: "#9caf88",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ember: "0 0 60px rgba(211, 154, 45, 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;

