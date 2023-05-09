import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function exec(exec: string, args: string[] = []): Promise<number | null> {
	return new Promise((resolve, reject) => {
		const child = spawn(exec, args, {
			stdio: "ignore",
		});

		// child.stdout.on("data", (data) => {
		// 	process.stdout.
		// 	console.log(data);
		// });

		child.stderr?.on("data", (data) => {
			reject(data);
		});

		child.on("close", (code) => {
			resolve(code);
		});
	});
}

export default function rust() {
	return {
		name: "vite-plugin-rust",
		enforce: "pre" as const,

		async resolveId(id) {
			const cargo = readFileSync(resolve("./Cargo.toml")).toString();
			const name = cargo.match(/(name\W=\W\")([a-zA-Z-]+)(")/);
			const pkgName = name ? name[2] : "";

			if (id.match(pkgName)) {
				const dist = "node_modules/" + pkgName;
				await exec("wasm-pack", ["build", "--target", "web", "--dev", "-d", dist]).catch(
					console.error
				);
			}
		},
	};
}
