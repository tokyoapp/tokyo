const global = {};

global.initLoaded = false;
global.resourceTypes = {
	SCENE: [".gmap"],
	JSON: [".json"],
	TEXT: [".txt"],
	IMAGE: [".png", ".jpg", ".webp"],
	VIDEO: [".mp4"],
	SHADER: [".shader", ".fs", ".vs"],
	GEOMETRY: [".obj"],
};
global.listeners = [];

global.queue = new Set();
global.map = new Map();
global.resourceRoot = '../res/';

/*
	Resource.add({ name, path }: arr, startLoading: bool): startLoading ? Promise : null
		# add resource to queue

	Resource.load(): Promise
		# initiate loading of queue

	Resource.map(void)
		# return resource map

	Resource.get(name: str)
		# return resource data by name

	Resource.finished: bool
		# returns if queue is finished
*/

export class Resources {

	static get resourceRoot() {
		return global.resourceRoot;
	}

	static set resourceRoot(path) {
		global.resourceRoot = path;
	}

	static get Types() {
		return global.resourceTypes;
	}

	static get finished() {
		return global.queue.size === 0;
	}

	static add(obj) {
		for (let key in obj) {
			global.queue.add({ name: key, path: obj[key] });
		}
	}

	static map() {
		return global.map;
	}

	static get(name) {
		return global.map.get(name);
	}

	static load() {
		if(!global.progress) {
			let loads = [];
	
			for (let res of global.queue) {
				const loading = Resources._fetch(global.resourceRoot + '/' + res.path).then(dataObj => {
					const resource = res;
					global.map.set(resource.name, dataObj);
					global.queue.delete(res);
					return dataObj;
				});
				loads.push(loading);
			}

			const progress = Promise.all(loads).then(() => {
				if (!global.initLoaded && Resources.finished) {
					global.initLoaded = true;
				}
	
				global.progress = null;
				console.log('Resources loaded', Resources.finished);

				for(let f of global.listeners) {
					f();
				}
			})
			global.progress = progress;
		}

		return global.progress;
	}

	static loaded() {
		return new Promise((resolve, reject) => {
			global.listeners.push(() => {
				resolve();
			})
		})
	}

	static _fetch(path) {
		let type = null;

		for (let t in Resources.Types) {
			for (let ending of Resources.Types[t]) {
				if (path.match(ending)) {
					type = Resources.Types[t];
				}
			}
		}

		switch (type) {

			case Resources.Types.JSON:
				return fetch(path).then(res => res.json().catch(err => {
					console.error("File failed parsing:", path);
				}));

			case Resources.Types.IMAGE:
				return new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = () => {
						resolve(img);
					}
					img.src = path;
				});

			case Resources.Types.VIDEO:
				return new Promise((resolve, reject) => {
					const vid = document.createElement('video');
					vid.oncanplay = () => {
						vid.width = 1024;
						vid.height = 1024;
						vid.loop = true;
						vid.play();
						resolve(vid);
					}
					vid.src = path;
				});

			case Resources.Types.GEOMETRY:
				return fetch(path).then(res => res.text().then(strData => {
					return OBJFile.parseFile(strData);
				}));

			case Resources.Types.TEXT:
				return fetch(path).then(res => res.text());

			case Resources.Types.SHADER:
				return fetch(path).then(res => res.text());

			case Resources.Types.SCENE:
				return fetch(path).then(res => {
					return res.arrayBuffer().then(b => {
						return MapFile.fromDataArray(b);
					})
				});

			default:
				throw `Err: not a valid resource type: "${path}"`;
		}
	}

}
