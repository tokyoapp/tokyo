export default {
  content: [path.resolve(__dirname, "../src/**/*.{js,ts,jsx,tsx}")],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/container-queries")],
};
