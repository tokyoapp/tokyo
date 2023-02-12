export class DataFile {

    static get fileEndings() {
        return [];
    }

    static get fileType() {
        return null;
    }

    static readData(fileData) {
        return fileData;
    }

    static read(file) {
        const reader = new FileReader();
        reader.onload = function() {
            try {
                this.readData(reader.result);
            } catch(err) {
                console.error("Error loading file");
            }
        }
        
        if(prompt('load file?')) {
            reader.readAsText(file);
        }
    }

}
