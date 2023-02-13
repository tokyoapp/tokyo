import GLTFFile from 'vsource-decompiler/files/util/GLTFFile.mjs';
import MapLoader from 'vsource-decompiler/source/MapLoader.mjs';

export default {

    usage: 'map <map_name> [<resource_path: csgo>] [<ouput_path>]',
    description: 'Decompile CS:GO maps from bsp to gltf format.',

    async execute([ mapName, resourcePath = "csgo/", outputFilePath, vpkFile = "pak01" ]) {
        if(!mapName) {
            error('Provide a map file.');
            return;
        }
        log('decompiling map...');

        const fileSystem = window.virtualFileSystem;
        const mapLoader = new MapLoader(fileSystem);
        const mapGeometry = await mapLoader.loadMap(mapName);

        log(mapName, 'decompiled.');

        const gltfFile = GLTFFile.fromGeometry(mapGeometry);
        gltfFile.name = mapName + ".gltf";

        log('Saved map to file ' + exportDesitination);

        return gltfFile;
    }
}
