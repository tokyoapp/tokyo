export function log(string: string) {
  const pre = document.querySelector("pre");
  if (pre) {
    const lines = pre.innerHTML.split("\n");
    lines.push(string);
    if (lines.length > 6) {
      lines.shift();
    }
    pre.innerHTML = lines.join("\n");
  }
}
