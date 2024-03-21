#!/usr/bin/env bun

async function main(args) {
  switch (args[0]) {
    case "build":
      return await import("./build.js");
    case "dev":
      return await import("./dev.js");
  }
}

main(process.argv.slice(2));
