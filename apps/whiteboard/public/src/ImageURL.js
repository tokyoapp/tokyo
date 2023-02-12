const SUPPORTED_HOSTS = [
    "www.instagram.com"
];

export default class ImageURL {

    getImageUrl() {
        return this.url;
    }

    constructor(url) {
        this.url = url;
        url = new URL(url);

        if(SUPPORTED_HOSTS.indexOf(url.host) != -1) {
            
        }
    }

}