class Assets {

    constructor(game) {
        this.game = game;
        this.floors = {};

        this.loadFloors();
    }

    loadFloors() {
        let tile = new Image();
        tile.src = './textures/floor/grass.png';
        let loaded = false;
        tile.onload = () => {
            this.floors['grass'] = tile;
            this.game.loaded = true;
        };
    }

    getFloor(floor){
        return this.floors[floor];
    }

}