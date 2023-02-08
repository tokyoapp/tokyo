# file-factory
Tools to inspect many differnet file types.


Single app for converting many file types like:
- https://github.com/luckydye/csv-merger
- png sequence to gif
- png to gif
- webp to png
- camera raw
- font files (true type)
- gltf/glb
- edit config files like .yaml, .json, .cfg
- binary hex view
- compare two text files/doc files for changes (or binary)

- Can use my app-state lib
- PWA


App loads very fast.
Every module is loaded on demand in a shadow dom of custom elements.

Webpack build every individual module into a seperate bundle.

{
	"custom-element-name": "<module bundle path>"
}

Render each module from this registry.
