let Assets = {

    images: {},
    imgLoaded: 0,
    imgFiles: [],

    load() {
        this.fillFileArrays();
        this.loadImages();
    },

    loadImages() {
        let tile = new Image();
        tile.src = this.imgFiles[this.imgLoaded];
        tile.onload = () => {
            let s = tile.src.split('/');
            let name = s[s.length-1].split('.')[0];
            this.images[name] = tile;
            ++this.imgLoaded;

            if (this.imgLoaded < this.imgFiles.length){
                this.loadImages();
            }
            else {
                // Start render
                requestAnimationFrame(game.gameLoop.bind(game));
            }
        };
    },

    getImage(img){
        return this.images[img];
    },

    fillFileArrays(){
        // Floors
        let path = './textures/floor/';
        this.imgFiles.push(path+'grass.png');

        // Characters
        path = './textures/character/';
        this.imgFiles.push(path+'sam1stand.png');
        this.imgFiles.push(path+'sam1walk-1.png');
        this.imgFiles.push(path+'sam1walk-2.png');
        this.imgFiles.push(path+'sam2stand.png');
        this.imgFiles.push(path+'sam2walk-1.png');
        this.imgFiles.push(path+'sam2walk-2.png');
        this.imgFiles.push(path+'sam2walk-3.png');
        this.imgFiles.push(path+'sam2walk-4.png');
        this.imgFiles.push(path+'sam3stand-1.png');
        this.imgFiles.push(path+'sam3stand-2.png');
        this.imgFiles.push(path+'sam3walk-1.png');
        this.imgFiles.push(path+'sam3walk-2.png');
        this.imgFiles.push(path+'sam3walk-3.png');
        this.imgFiles.push(path+'sam3walk-4.png');
        this.imgFiles.push(path+'sam4stand-1.png');
        this.imgFiles.push(path+'sam4stand-2.png');
        this.imgFiles.push(path+'sam4walk-1.png');
        this.imgFiles.push(path+'sam4walk-2.png');
        this.imgFiles.push(path+'sam4walk-3.png');
        this.imgFiles.push(path+'sam4walk-4.png');
        this.imgFiles.push(path+'sam5stand-1.png');
        this.imgFiles.push(path+'sam5stand-2.png');
        this.imgFiles.push(path+'sam5walk-1.png');
        this.imgFiles.push(path+'sam5walk-3.png');
        this.imgFiles.push(path+'shadow.png');
    }

}