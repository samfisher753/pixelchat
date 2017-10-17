class Player {

    constructor(player){
        this.name = player.name;
        this.room = player.room || null;
        this.pos = player.pos || null;

        this.adjustY = -69;
        this.character = 'sam';
        this.status = 'stand';
        this.direction = 4;
        this.animFrame = 0;
        this.images = [];

        this.fetchImages();
    }

    setRoom(room) {
        this.room = room;
    }

    setPos(pos) {
        this.pos = pos;
    }

    setDirAndStatus(dir, status) {
        this.direction = dir;
        this.status = status;
        this.animFrame = 0;
        this.fetchImages();
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

    getStatus() {
        return this.status;
    }

    getDirection() {
        return this.direction;
    }

    fetchImages() {
        let name = this.character+this.direction+this.status;
        this.images = Assets.getImgArray(name);
        this.images.push(Assets.getImage('shadow'));
    }

    draw(ctx, drawPos) {
        // Draw shadow
        ctx.drawImage(this.images[this.images.length-1], drawPos.x, drawPos.y-6);
        switch(this.status){
            case 'stand':
                this.drawStand(ctx, drawPos); 
                break;
            case 'walk':
                this.drawWalk(ctx, drawPos);
                break;
        }
    }

    drawStand(ctx, drawPos) {
        if (this.images.length === 2){
            ctx.drawImage(this.images[0], drawPos.x, drawPos.y+this.adjustY);
            // For testing purposes
            ++this.animFrame;
            if (this.animFrame === 8) {
                this.animFrame = 0;
                ++this.direction;
                this.fetchImages();
            }
        }
        else {
            if (this.animFrame < 80) ctx.drawImage(this.images[0], drawPos.x, drawPos.y+this.adjustY);
            else ctx.drawImage(this.images[1], drawPos.x, drawPos.y+this.adjustY);
            ++this.animFrame;
            if (this.animFrame === 82) {
                this.animFrame = 0;
                // For testing purposes
                ++this.direction;
                if (this.direction === 8){
                    this.direction = 0;
                    this.status = 'walk';
                }
                this.fetchImages();
            }
        }
    }

    drawWalk(ctx, drawPos) {
        let framesPerImg = 2;
        let img = this.images[parseInt(this.animFrame/framesPerImg)];
        ctx.drawImage(img, drawPos.x, drawPos.y+this.adjustY);
        ++this.animFrame;
        if (this.animFrame === (this.images.length-1)*framesPerImg){
            this.animFrame = 0;
            // For testing purposes
            ++this.direction;
            if (this.direction === 8){
                this.direction = 0;
                this.status = 'stand';
            }
            this.fetchImages();
        }
    }

}

if (typeof module !== 'undefined') {
    module.exports = Player;
}