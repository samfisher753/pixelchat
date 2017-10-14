class Player {

    constructor(player){
        this.name = player.name;
        this.room = player.room || null;
        this.pos = player.pos || null;
    }

    setRoom(room) {
        this.room = room;
    }

    setPos(pos) {
        this.pos = pos;
    }

    getName() {
        return this.name;
    }

    getRoom() {
        return this.room;
    }

    getPos() {
        return this.pos;
    }

}

if (typeof module !== 'undefined') {
    module.exports = Player;
}