export function logger(label: string, color: string) {
	return {
		info(...message: string[]) {
			const ts = new Date().toTimeString().split(' ').slice(0, 1).join(' ');
			console.log(`${ts} %c[${label}]`, `color: ${color}; font-weight: normal`, ...message);
		},
		debug(...message: string[]) {
			if (import.meta.env.DEV) {
				const ts = new Date().toTimeString().split(' ').slice(0, 1).join(' ');
				console.warn(`${ts} %c[${label}]`, `color: ${color}; font-weight: normal`, ...message);
			}
		},
		error(...message: string[]) {
			const ts = new Date().toTimeString().split(' ').slice(0, 1).join(' ');
			console.error(`${ts} %c[${label}]`, `color: ${color}; font-weight: normal`, ...message);
		},
	};
}
