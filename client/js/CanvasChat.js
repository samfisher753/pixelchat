class CanvasChat {

    constructor(){
        this.players = {};
        this.msgs = [];

        // Config vars
        this.vel = 1.5;

        // Internal vars
        this.t = -1;
        this.adjustX = 32;
        //this.overlap = 2;
        this.moveUp = 23;
        this.maxW = 345;

        // Create chat html element
        let app = document.getElementById('app');
        this.chat = document.createElement('div');
        this.chat.style.width = app.clientWidth + 'px';
        this.chat.style.height = app.clientHeight + 'px';
        this.defaultY = app.clientHeight/3;
        this.chat.id = 'canvasChat';
        this.chat.style.position = 'absolute';
        this.chat.style.zIndex = '1';
        this.chat.style.pointerEvents = 'none';
        app.appendChild(this.chat);
    }

    add(msg) {
        msg.html.style.position = 'fixed';
        let msgD = msg.html.getElementsByClassName('game-chatMessage')[0];
        msgD.style.left = '0';
        msgD.style.fontSize = '14px';
        msgD.style.maxWidth = (this.maxW - 18) + 'px'; // 18 padding + border
        msgD.style.pointerEvents = 'auto';
        this.chat.appendChild(msg.html);
        let p = msgD.getBoundingClientRect();
        msg.html.style.width = p.width + 'px';
        msg.html.style.height = p.height + 'px';
        msg.width = p.width;
        msg.height = p.height;

        msg.dy = -msg.height;
        msg.dx = this.adjustX - (msg.width/2);
        msg.pos = this.players[msg.player].pos;
        delete msg.player;
        delete msg.text;

        if (this.msgs.length > 0){
            this.move(msg, -1);
            this.clean();
        }

        this.msgs.push(msg);
    }

    touch(a, b) {
        let pa = Grid.drawPos[a.pos.y][a.pos.x];
        let pb = Grid.drawPos[b.pos.y][b.pos.x];
        pa = {x:pa.x+a.dx, y:a.dy};
        pb = {x:pb.x+b.dx, y:b.dy};

        if ((pb.y < pa.y && pb.y+b.height > pa.y) ||
            (pb.y < pa.y+a.height && pb.y+b.height >= pa.y+a.height) ||
            (pb.y >= pa.y && pb.y+b.height <= pa.y+a.height)) {

            if (pa.x < pb.x && pa.x+a.width > pb.x) return true;
            if (pa.x < pb.x+b.width && pa.x+a.width > pb.x+b.width) return true;
            if (pa.x >= pb.x && pa.x+a.width <= pb.x+b.width) return true;
        }

        return false;
    }

    move(msg, iIni) {
        for (let i=0; i<this.msgs.length; ++i){
            if (i !== iIni && this.touch(msg,this.msgs[i])){
                let b = this.msgs[i];
                let bend = b.dy+b.height;
                let aend = msg.dy+msg.height;
                this.msgs[i].dy = msg.dy - this.msgs[i].height;
                this.move(this.msgs[i], i);
            }
        }
    }

    clean() {
        for (let i=0; i<this.msgs.length; ++i){
            if (this.msgs[i].dy+this.msgs[i].height <= -this.defaultY ){
                this.chat.removeChild(this.msgs[i].html);
                this.msgs.splice(i, 1);
                --i;
            }
        }
    }

    update() {
        ++this.t;

        if (this.t >= 360/this.vel) {
            // Move all msgs 1 pos up
            for (let msg of this.msgs){
                msg.dy -= this.moveUp;
            }
            this.t = 0;
            this.clean();
        }
        
    }

    draw() {
        if (this.msgs.length > 0) {
            for (let msg of this.msgs){
                let dp = Grid.drawPos[msg.pos.y][msg.pos.x];
                msg.html.style.left = (dp.x+msg.dx) + 'px';
                msg.html.style.top = (this.defaultY+msg.dy) + 'px';
            }
        }
    }

    clear() {
        this.msgs = [];
        this.chat.innerHTML = '';
    }

}