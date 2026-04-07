import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        mist: "#f3f6fb",
        brand: "#d62976",
        brandDark: "#962fbf",
        accent: "#feda75"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(16, 24, 40, 0.12)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(214, 41, 118, 0.28), transparent 40%), radial-gradient(circle at top right, rgba(254, 218, 117, 0.3), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%)"
      }
    }
  },
  plugins: []
};

export default config;
