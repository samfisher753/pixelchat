let Assets = {

    images: {},
    imgLoaded: 0,
    imgFiles: [],
    avatars: {},
    avatarFiles: {},

    loadAvatarImages(player) {
        this.avatars[player] = { loaded: false, num_loaded: 0 };
        for (let status in this.avatarFiles[player]){
            this.avatars[player][status] = [];
            let i = 0;
            for (let dir of this.avatarFiles[player][status]){
                this.avatars[player][status].push([]);
                for (let frame of dir){
                    let img = new Image();
                    img.src = frame;
                    img.onload = () => {
                        this.avatars[player].num_loaded++;
                        if (this.avatars[player].num_loaded === 45){
                            this.avatars[player].loaded = true;
                            game.startGame();
                        }
                    };
                    this.avatars[player][status][i].push(img);
                }
                i++;
            }
        }
    },

    fillAvatarArray(player) {
        let av = {};
        av['stand'] = [
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=6&head_direction=6'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=7&head_direction=7'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=0&head_direction=0'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=1&head_direction=1',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=1&head_direction=1&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=2&head_direction=2',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=2&head_direction=2&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=3&head_direction=3',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=3&head_direction=3&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=4&head_direction=4',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=4&head_direction=4&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=5&head_direction=5',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction=5&head_direction=5&gesture=eyb']
        ];

        av['walk'] = [];
        let d = 6;
        let f = 0;
        for (let i=0; i<8; ++i){
            av['walk'].push([]);
            for (let f=0; f<4; ++f){
                let s = 'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+player+'&direction='+d+'&head_direction='+d+'&action=wlk&frame='+f;
                av['walk'][i].push(s);
            }
            d = (d+1)%8;
        }

        this.avatarFiles[player] = av;
    },

    load() {
        this.fillFileArrays();
        this.loadImages();
        this.fillAvatarArray('defaultAvatar');
        this.loadAvatarImages('defaultAvatar');
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
                //game.startGame();
            }
        };
    },

    getImage(img){
        return this.images[img];
    },

    getImgArray(player, status, direction){
        return this.avatars[player][status][direction];
    },

    fillFileArrays(){
        // Floors
        let path = './textures/floor/';
        this.imgFiles.push(path+'grass.png');
        this.imgFiles.push(path+'default.png');

        path = './textures/character/';
        this.imgFiles.push(path+'shadow.png');
        // Characters
        /*
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
        */
    }

}