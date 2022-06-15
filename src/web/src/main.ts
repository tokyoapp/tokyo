import init, { greet } from "hello-wasm/pkg/hello_wasm";

declare global {
  const __APP_VERSION__: string;
}

const a: number = 12;

console.log(__APP_VERSION__, a);

init().then(() => {
  greet("tim");
});
