class CanvasChat {

    constructor(ctx){
        this.ctx = ctx;
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
        this.defaultY = null;
    }

    add(msg) {
        msg.dy = -msg.height;
        msg.dx = this.adjustX - (msg.width/2);
        msg.pos = this.players[msg.player].pos;
        delete msg.player;
        delete msg.text;

        if (this.msgs.length > 0){
            let moved = [];
            for (let i=0; i<this.msgs.length; ++i)
                moved.push(false);
            
            this.move(msg, -1, moved);
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

    move(msg, iIni, moved) {
        for (let i=0; i<this.msgs.length; ++i){
            if (i !== iIni && this.touch(msg,this.msgs[i])){
                let b = this.msgs[i];
                let bend = b.dy+b.height;
                let aend = msg.dy+msg.height;
                this.msgs[i].dy = msg.dy - this.msgs[i].height;
                this.move(this.msgs[i], i, moved);
            }
        }
    }

    clean() {
        for (let i=0; i<this.msgs.length; ++i){
            if (this.msgs[i].dy+this.msgs[i].height <= -this.defaultY ){
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
                this.ctx.drawImage(msg.img, 
                    parseInt(dp.x+msg.dx), parseInt(this.defaultY+msg.dy), 
                    parseInt(msg.width), parseInt(msg.height));
            }
        }
    }

    clear() {
        this.msgs = [];
    }

    createImg(msg) {
        let b = this.createBlob(msg);
        msg.width = b.width;
        msg.height = b.height;
        
        let DOMURL = window.URL || window.webkitURL || window;
        let img = new Image();
        let svg = new Blob([b.blob], {type: 'image/svg+xml;charset=utf-8'});
        let url = DOMURL.createObjectURL(svg);
        img.onload = () => {
            this.add(msg);
        };
        img.src = url;
        msg.img = img;
    }

    createBlob(msg) {
        // I did this function to get the real width and height of
        // the canvas bubble cause it's a bit different, and to
        // prepare the blob string while sanitizing the chat msg.

        let div = document.createElement('div');
        div.style.zIndex = -1;
        div.style.width = this.maxW + 'px';
        let div2 = document.createElement('div');
        div2.className = 'game-chatMessage';
        div2.style.maxWidth = 'calc(100% - 18px)';
        div2.style.backgroundColor = '#ffffff';
        div2.style.fontFamily = 'Arial';
        div2.style.fontSize = '14px';
        div2.style.color = '#000000';
        let span = document.createElement('span');
        span.className = 'game-boldText';
        span.style.fontWeight = 'bold';
        span.textContent = msg.player + ': ';
        div2.appendChild(span);
        div2.appendChild(msg.msgSpan);
        delete msg.msgSpan;
        div.appendChild(div2);
        let app = document.getElementById('app');
        app.appendChild(div);
        let pos = div2.getBoundingClientRect();
        app.removeChild(div);

        let style = '<style>' +
                '.game-chatMessage {' +
                    'position: relative;' +
                    'max-width: calc(100% - 18px);' +
                    'word-wrap: break-word;' +
                    'border-radius: 6px;' +
                    'background: #ffffff;' +
                    'margin: 0;' +
                    'padding: 2px 8px;' +
                    'border: 1px solid #000000;' +
                    'display: inline-block;' +
                    'font-family: Arial;' +
                    'font-size: 14px;' + 
                    'color: #000000;' +
                '}' +
                '.game-boldText {' +
                    'font-weight: bold;' +
                '}' +
                'a {' +
                    'color: #1884ff;' +
                '}' +
            '</style>';

        let blob = '<svg xmlns="http://www.w3.org/2000/svg" width="'+pos.width+'" height="'+pos.height+'">' +
                '<foreignObject width="100%" height="100%">' +
                    style +
                    '<div xmlns="http://www.w3.org/1999/xhtml">' + 
                        div.outerHTML + 
                    '</div>' +
                '</foreignObject>' +
            '</svg>';
        
        return { blob: blob, width: pos.width, height: pos.height };
    }

}