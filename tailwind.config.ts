import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0f1d",
        bgSoft: "#111a31",
        card: "rgba(255,255,255,0.08)",
        cardHover: "rgba(255,255,255,0.14)",
        textMain: "#edf3ff",
        muted: "#9eb1d1",
        accent: "#00e5a8"
      },
      boxShadow: {
        card: "0 20px 50px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
