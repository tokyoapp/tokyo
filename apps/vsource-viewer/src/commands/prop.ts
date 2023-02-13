import GLTFFile from 'vsource-decompiler/files/util/GLTFFile.mjs';
import PropLoader from 'vsource-decompiler/source/PropLoader.mjs';
import VirtualFileSystem from 'vsource-decompiler/source/VirtualFileSystem.mjs';

const fileSystem = new VirtualFileSystem();

export default {

    usage: "prop <prop name> [<resource_path: csgo>] [<ouput_path>]",
    description: "Decompile CS:GO models from mdl to gltf format.",

    async execute([ propname, resourcePath = "csgo/", outputFilePath, vpkFile = "pak01" ]) {
        const fileSystem = window.virtualFileSystem;

        if(!propname) {
            error('Provide a prop file.');
            return;
        }
        log('decompiling prop...');

        const propLoader = new PropLoader(fileSystem);
        const propMeshes = await propLoader.loadProp(propname + '.mdl');

        const geometry = {
            prop_static: []
        }

        for(let propData of propMeshes) {

            const propGeometry = {
                name: propname + '_' + propMeshes.indexOf(propData),
                vertecies: propData.vertecies,
                uvs: propData.uvs,
                normals: propData.normals,
                indices: propData.indices,
                material: propData.material,
                scale: [1, 1, 1],
                origin: [0, 0, 0],
                position: [0, 0, 0],
                rotation: [0, 0, 0],
            }

            geometry.prop_static.push(propGeometry);
        }

        log('Prop decompiled.');
        
        const exportFileName = propname.replace(/\/|\\/g, '_');
        const gltfFile = GLTFFile.fromGeometry(geometry);
        gltfFile.name = exportFileName + ".gltf";

        log('Saved prop to file ' + exportFileName + '.gltf');

        return gltfFile;
    }
}
