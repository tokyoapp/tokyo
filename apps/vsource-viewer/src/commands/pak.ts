import PakLoader from 'vsource-decompiler/source/PakLoader.mjs';

export default {

    usage: 'pak <map_name> [<resource_path: csgo>] [<ouput_path>]',
    description: 'Extract pakfile from map bsp.',

    async execute([ mapName, resourcePath = "csgo/", outputFilePath ]) {
        const fileSystem = window.virtualFileSystem;

        if(!mapName) {
            error('Provide a map file.');
            return;
        }

        const pakLoader = new PakLoader(fileSystem);
        const pakfile = await pakLoader.loadPakfile(mapName);
        pakfile.name = mapName + ".zip";

        log(mapName, 'pakfile extracted.');

        log('Saved pakfile to ' + exportFileName + '.zip');

        return pakfile;
    }
}
