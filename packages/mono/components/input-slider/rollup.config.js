import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "lib/sv-input-slider.js",
      format: "esm",
    },
    plugins: [typescript()],
  },
];
