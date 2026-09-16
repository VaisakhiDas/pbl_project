/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#14171a",
          900: "#1b1f23",
          800: "#252a2f",
          700: "#343b42",
          600: "#4a535c",
          500: "#63707a",
          400: "#8b969e",
          300: "#b3bcc2",
          200: "#d6dcdf",
          100: "#eceff0",
        },
        paper: {
          50: "#fbfaf7",
          100: "#f6f4ee",
          200: "#eeebe1",
        },
        forest: {
          900: "#0e2a1f",
          800: "#123722",
          700: "#16472b",
          600: "#1c5934",
          500: "#25703f",
          400: "#38884f",
          300: "#5da472",
          200: "#a3c8ac",
          100: "#dcebe0",
          50: "#f0f7f1",
        },
        moss: {
          500: "#7cb342",
          400: "#96c95f",
          100: "#e9f3dc",
        },
        steel: {
          600: "#3f6b8a",
          500: "#4f7fa3",
          400: "#7aa0bd",
          100: "#e4edf3",
        },
        amber: {
          600: "#b3720a",
          500: "#d1890f",
          100: "#faf0d9",
        },
        rust: {
          600: "#a8402f",
          500: "#c24d39",
          100: "#f8e2dd",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(20, 23, 26, 0.06)",
      },
    },
  },
  plugins: [],
};
