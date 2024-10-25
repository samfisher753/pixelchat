import { assets } from "@/models/others/Assets"
import { grid } from "@/models/logic/Grid"
import { PlayerCollection } from "@/types/PlayerCollection";
import { Msg } from "@/types/Msg";
import { Pos } from "@/types/Pos";

class CanvasChat {

    players: PlayerCollection;
    msgs: Msg[];
    vel: number;
    t: number;
    adjustX: number;
    moveUp: number;
    maxW: number;
    chat?: HTMLDivElement;
    defaultY?: number;

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
    }

    init(): void {
        // Create chat html element
        let app = document.getElementById('app')!;
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

    add(msg: Msg): void {
        msg.html!.style.position = 'fixed';
        const msgD: HTMLDivElement = msg.html!.getElementsByClassName('game-chatMessage')[0] as HTMLDivElement;
        msgD.className = 'game-chatMessage game-canvasChatMessage';
        msgD.style.maxWidth = (this.maxW - 18) + 'px'; // 18 padding + border
        this.chat!.appendChild(msg.html!);
        const p: DOMRect = msg.html!.getBoundingClientRect();
        msg.width = p.width;
        msg.height = p.height;

        msg.dy = -msg.height;
        msg.dx = this.adjustX - (msg.width/2);
        msg.pos = this.players[msg.player!.id].pos!;
        delete msg.player;
        delete msg.text;

        // Add player reference to chat msg
        let playerRef: HTMLImageElement = assets.getImage('msg-pos');
        playerRef = playerRef.cloneNode(true) as HTMLImageElement;
        playerRef.style.position = 'absolute';
        msg.html!.appendChild(playerRef);
        msg.playerRef = playerRef;

        if (this.msgs.length > 0){
            this.move(msg, -1);
            this.clean();
        }

        this.msgs.push(msg);
    }

    touch(a: Msg, b: Msg): boolean {
        let pa: Pos = grid.drawPos[a.pos!.y][a.pos!.x];
        let pb: Pos = grid.drawPos[b.pos!.y][b.pos!.x];
        pa = {x:pa.x+a.dx!, y:a.dy!};
        pb = {x:pb.x+b.dx!, y:b.dy!};

        if ((pb.y < pa.y && pb.y+b.height! > pa.y) ||
            (pb.y < pa.y+a.height! && pb.y+b.height! >= pa.y+a.height!) ||
            (pb.y >= pa.y && pb.y+b.height! <= pa.y+a.height!)) {

            if (pa.x < pb.x && pa.x+a.width! > pb.x) return true;
            if (pa.x < pb.x+b.width! && pa.x+a.width! > pb.x+b.width!) return true;
            if (pa.x >= pb.x && pa.x+a.width! <= pb.x+b.width!) return true;
        }

        return false;
    }

    move(msg: Msg, iIni: number): void {
        for (let i=0; i<this.msgs.length; ++i){
            if (i !== iIni && this.touch(msg,this.msgs[i])){
                // const b: Msg = this.msgs[i];
                // const bend: number = b.dy!+b.height!;
                // const aend: number = msg.dy!+msg.height!;
                this.msgs[i].dy = msg.dy! - this.msgs[i].height!;
                this.move(this.msgs[i], i);
            }
        }
    }

    clean(): void {
        for (let i=0; i<this.msgs.length; ++i){
            if (this.msgs[i].dy!+this.msgs[i].height! <= -this.defaultY! ){
                this.chat!.removeChild(this.msgs[i].html!);
                this.msgs.splice(i, 1);
                --i;
            }
        }
    }

    update(): void {
        ++this.t;

        if (this.t >= 360/this.vel) {
            // Move all msgs 1 pos up
            for (let msg of this.msgs){
                msg.dy! -= this.moveUp;
            }
            this.t = 0;
            this.clean();
        }
        
    }

    draw(): void {
        if (this.msgs.length > 0) {
            for (let msg of this.msgs){
                const dp: Pos = grid.drawPos[msg.pos!.y][msg.pos!.x];
                msg.html!.style.left = (dp.x+msg.dx!) + 'px';
                msg.html!.style.top = (this.defaultY!+msg.dy!) + 'px';
                msg.playerRef!.style.left = (msg.width!/2)-4 + 'px';
                msg.playerRef!.style.top = msg.height!-1 + 'px';
            }
        }
    }

    clear(): void {
        this.msgs = [];
        this.chat!.innerHTML = '';
    }

}

export const canvasChat = new CanvasChat();