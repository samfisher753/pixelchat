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
                game.startGame();
            }
        };
    },

    getImage(img){
        return this.images[img];
    },

    // Returns an array with all the images that starts with "name"
    getImgArray(name){
        let array = [];
        for (let img in this.images){
            if (img.indexOf(name) === 0)
                array.push(this.images[img]);
        }
        return array;
    },

    fillFileArrays(){
        // Floors
        let path = './textures/floor/';
        this.imgFiles.push(path+'grass.png');
        this.imgFiles.push(path+'default.png');

        // Characters
        path = './textures/character/';
        this.imgFiles.push(path+'sam0stand.png');
        this.imgFiles.push(path+'sam0walk-1.png');
        this.imgFiles.push(path+'sam0walk-2.png');
        this.imgFiles.push(path+'sam0walk-3.png');
        this.imgFiles.push(path+'sam0walk-4.png');
        this.imgFiles.push(path+'sam1stand.png');
        this.imgFiles.push(path+'sam1walk-1.png');
        this.imgFiles.push(path+'sam1walk-2.png');
        this.imgFiles.push(path+'sam1walk-3.png');
        this.imgFiles.push(path+'sam1walk-4.png');
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
        this.imgFiles.push(path+'sam5walk-2.png');
        this.imgFiles.push(path+'sam5walk-3.png');
        this.imgFiles.push(path+'sam6stand-1.png');
        this.imgFiles.push(path+'sam6stand-2.png');
        this.imgFiles.push(path+'sam6walk-1.png');
        this.imgFiles.push(path+'sam6walk-2.png');
        this.imgFiles.push(path+'sam6walk-3.png');
        this.imgFiles.push(path+'sam6walk-4.png');
        this.imgFiles.push(path+'sam7stand-1.png');
        this.imgFiles.push(path+'sam7stand-2.png');
        this.imgFiles.push(path+'sam7walk-1.png');
        this.imgFiles.push(path+'sam7walk-2.png');
        this.imgFiles.push(path+'sam7walk-3.png');
        this.imgFiles.push(path+'sam7walk-4.png');
        this.imgFiles.push(path+'shadow.png');
    }

}