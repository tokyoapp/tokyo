import Console from 'terminal/src/Console.js';

import command_prop from './commands/prop';
import command_map from './commands/map';
import command_pak from './commands/pak';

const Commands = {
    'prop': command_prop,
    'map': command_map,
    'pak': command_pak,
};

export default {
    moduleName: "vsource",
    commandName: "vsource",
    install() {},
    async run(args, flags = []) {
        let command = args[0];
        args = args.slice(1);

        for(let arg of [...args]) {
            if(arg[0] == "-") {
                flags.push(arg);
                args.splice(args.indexOf(arg), 1);
            }
        }

        if(Commands[command]) {
            const result = await Commands[command].execute(args, flags);

            const blob = await result.toBlob();
            const url = URL.createObjectURL(blob);

            Console.print(`\\\\\\HTML 500 15 Click <a href="${url}" download="${result.name}">Download File</a> to save the file.`);

            if(!result && Commands[command].usage) {
                Console.print(Commands[command].description);
                Console.print(`Usage: ${(Commands[command].usage)}`);
            }
        } else {
            Console.print('Commands: ' + (Object.keys(Commands).join(", ")));
        }
    }
}