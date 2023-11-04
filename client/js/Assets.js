let Assets = {

    images: {},
    imgLoaded: 0,
    imgFiles: [],
    avatars: {},
    imagesToLoad: 67,

    load() {
        this.fillFileArrays();
        this.loadImages();
    },

    loadImages() {
        let tile = new Image();
        tile.crossOrigin = 'Anonymous';
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
                this.loadAvatarImages('defaultAvatar', true, null);
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

        path = './textures/misc/';
        this.imgFiles.push(path+'shadow.png');
        this.imgFiles.push(path+'mouse-tile.png');
        this.imgFiles.push(path+'msg-pos.png');
    },

    loadAvatarImages(playerName, startGame, player) {
        this.avatars[playerName] = { num_loaded: 0 };
        let av = this.createAvatarFilesObject(playerName);
        for (let status in av){
            this.avatars[playerName][status] = [];
            let i = 0;
            for (let dir of av[status]){
                this.avatars[playerName][status].push([]);
                for (let frame of dir){
                    let img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.src = frame;
                    img.onload = () => {
                        this.avatars[playerName].num_loaded++;
                        if (this.avatars[playerName].num_loaded === this.imagesToLoad){
                            if (player !== null) player.images = this.avatars[playerName];
                            if (startGame) game.startGame();
                        }
                    };
                    img.onerror = () => {
                        if (playerName !== 'defaultAvatar') 
                            this.avatars[playerName] = this.avatars['defaultAvatar'];
                        if (player !== null) player.images = this.avatars[playerName];
                    };
                    this.avatars[playerName][status][i].push(img);
                }
                i++;
            }
        }
    },

    createAvatarFilesObject(playerName) {
        if (playerName === "base") {
            return this.createBaseCharacterFilesObject();
        }

        let av = {};
        av['stand'] = [
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=6&head_direction=6'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=7&head_direction=7'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=0&head_direction=0'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=1&head_direction=1',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=1&head_direction=1&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=3&head_direction=3',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=3&head_direction=3&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=5&head_direction=5',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=5&head_direction=5&gesture=eyb']
        ];

        av['walk'] = [];
        let d = 6;
        for (let i=0; i<8; ++i){
            av['walk'].push([]);
            for (let f=0; f<4; ++f){
                let s = 'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction='+d+'&head_direction='+d+'&action=wlk&frame='+f;
                av['walk'][i].push(s);
            }
            d = (d+1)%8;
        }

        av['sit'] = [
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=6&head_direction=6&action=sit'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=0&head_direction=0&action=sit'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2&action=sit',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2&action=sit&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4&action=sit',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4&action=sit&gesture=eyb']
        ];

        av['wave'] = [];
        d = 6;
        for (let i=0; i<8; ++i){
            av['wave'].push([]);
            for (let f=0; f<2; ++f){
                let s = 'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction='+d+'&head_direction='+d+'&action=wav&frame='+f;
                av['wave'][i].push(s);
            }
            d = (d+1)%8;
        }

        return av;
    },

    createBaseCharacterFilesObject() {
        let av = {};
        let path = "./textures/character/";
        let pathStand = path + "stand/";

        av['stand'] = [
            [pathStand+"bc-stand-0.png"],
            [pathStand+"bc-stand-1.png"],
            [pathStand+"bc-stand-2.png"],
            [pathStand+"bc-stand-3.png",
            pathStand+"bc-stand-3.png"],
            [pathStand+"bc-stand-4.png",
            pathStand+"bc-stand-4.png"],
            [pathStand+"bc-stand-5.png",
            pathStand+"bc-stand-5.png"],
            [pathStand+"bc-stand-6.png",
            pathStand+"bc-stand-6.png"],
            [pathStand+"bc-stand-7.png",
            pathStand+"bc-stand-7.png"]
        ];

        let pathWalk = path + "walk/";
        av['walk'] = [];
        for (let i=0; i<8; ++i){
            av['walk'].push([]);
            for (let f=0; f<4; ++f){
                let s = pathWalk+"bc-walk-"+i+"-"+f+".png";
                av['walk'][i].push(s);
            }
        }

        av['sit'] = [
            [pathStand+"bc-stand-0.png"],
            [pathStand+"bc-stand-2.png"],
            [pathStand+"bc-stand-4.png",
            pathStand+"bc-stand-4.png"],
            [pathStand+"bc-stand-6.png",
            pathStand+"bc-stand-6.png"]
        ];

        av['wave'] = [];
        for (let i=0; i<8; ++i){
            av['wave'].push([]);
            for (let f=0; f<2; ++f){
                let s = pathStand+"bc-stand-"+i+".png";
                av['wave'][i].push(s);
            }
        }

        return av;
    }

}