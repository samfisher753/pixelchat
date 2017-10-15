let Assets = {

    floors: {},
    characters: {},

    load() {
        this.loadFloors();
        this.loadCharacters();
    },

    loadFloors() {
        let tile = new Image();
        tile.src = './textures/floor/grass.png';
        tile.onload = () => {
            this.floors['grass'] = tile;
        };
    },

    loadCharacters() {
        let a = new Image();
        a.src = './textures/character/sam4stand.png';
        let b = new Image();
        b.src = './textures/character/sam4stand-blink.png';
        b.onload = () => {
            this.characters['sam4stand'] = a;
            this.characters['sam4stand-blink'] = b;
            game.loaded = true;
        };
    },

    getFloor(floor){
        return this.floors[floor];
    },

    getCharacter(c){
        return this.characters[c];
    }

}