class Player {

    constructor(player){
        this.name = player.name;
        this.room = player.room || null;
        this.pos = player.pos || null;

        this.adjustY = 6;
        this.status = 'stand';
        this.direction = 4;
        this.animFrame = 0;
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

    draw(ctx, drawPos) {
        let floorHeight = Assets.getFloor('grass').height;
        let stand = Assets.getCharacter('sam4stand');
        let blink = Assets.getCharacter('sam4stand-blink');

        let newY = drawPos.y - stand.height + floorHeight - this.adjustY;

        if (this.animFrame < 100){
            ctx.drawImage(stand, drawPos.x, newY);
        }
        else {
            ctx.drawImage(blink, drawPos.x, newY)
        }

        ++this.animFrame;

        if (this.animFrame === 106){
            this.animFrame = 0;
        }

    }

}

if (typeof module !== 'undefined') {
    module.exports = Player;
}