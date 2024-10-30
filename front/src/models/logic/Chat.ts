import { wavRecorder } from '@/models/others/WavRecorder'
import { canvasChat } from '@/models/logic/CanvasChat'
import { Socket } from 'socket.io-client';
import { MAX_FILE_SIZE_BYTES } from '@/constants/constants';
import { Msg } from '@/types/Msg';
import { gameEventEmitter } from '@/emitters/GameEventEmitter';
import { GameEvent } from '@/enums/GameEvent';

class Chat {

    socket: Socket | null;
    playerName: string | null;
    playerId: string | undefined;
    minChatWidth: number;
    allowedTypes: string[];

    constructor() {
        this.socket = null;
        this.playerName = null;
        this.minChatWidth = 150;
        this.allowedTypes = [
            'image',
            'video',
            'audio',
        ];
    }
    
    init() {
        wavRecorder.init();
    }

    sendMsg(msgText: string): void {
        const msg: Msg = { type: 'text', text: msgText };
        this.socket!.emit('chat message', msg);
        msg.player = { 
            name: this.playerName!,
            id: this.playerId!
        };
        this.addMsg(msg);
    }

    sendVoiceNote(file: any): void {
        file.name = 'PixelChat-'+this.playerName+this.timeString()+'.wav';
        this.readFile(file);
    }

    timeString() {
        let d = new Date();
        let M = this.twoDigitString(d.getMonth()+1);
        let day = this.twoDigitString(d.getDate());
        let h = this.twoDigitString(d.getHours());
        let m = this.twoDigitString(d.getMinutes());
        let s = this.twoDigitString(d.getSeconds());
        return d.getFullYear()+M+day+h+m+s;
    }

    twoDigitString(n){
        if (n<10) n = '0'+n;
        return ''+n;
    }

    checkAndReadFile(file: File) {
        if (this.allowedFile(file))
            this.readFile(file);
    }

    readFile(file: File) {
        let fr = new FileReader();
        fr.onload = (e) => {
            let data = e.target!.result as string;
            let type = data.substring(5,20).split(';')[0];
            let msg: Msg = { type: type, data: data, filename: file.name };
            this.socket!.emit('file message', msg);
            msg.player = { name: this.playerName!, id: this.playerId! };
            this.addFileMsg(msg);
        };
        fr.readAsDataURL(file);
    }

    addFileMsg(msg: Msg): void {
        gameEventEmitter.emit(GameEvent.AddMessage, msg);

        let type = msg.type!.split('/')[0];
        if (type === 'image'){
            this.addImageMsg(msg);
        }
        else if (type === 'video'){
            this.addVideoMsg(msg);
        }
        else if (type === 'audio'){
            this.addAudioMsg(msg);
        }
    }

    addImageMsg(msg){
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage';
        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.style.float = 'left';
        nameSpan.textContent = msg.player.name + ':';

        let file = document.createElement('div');
        let img = new Image();
        img.className = 'game-file';
        this.addFullWindow(img);
        img.onload = () => {
            msg.html = msgC.cloneNode(true);
            let img2 = msg.html.getElementsByTagName('img')[0];
            this.addFullWindow(img2);
            canvasChat.add(msg);
        }
        img.src = msg.data;
        let link = this.createFileLink(msg);
        file.appendChild(img);
        file.appendChild(link);

        msgD.appendChild(nameSpan);
        msgD.appendChild(file);
        msgC.appendChild(msgD);
    }

    addFullWindow(img) {
        img.onclick = () => {
            let app = document.getElementById('app')!;
            let p = document.createElement('div');
            p.className = 'game-fullWinPanel';
            app.appendChild(p);
            p.onclick = () => {
                app.removeChild(p);
            };
            let fImg = new Image();
            fImg.className = 'game-fullWinImg';
            fImg.src = img.src;
            p.appendChild(fImg);
        };
    }

    addVideoMsg(msg) {
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage';
        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.style.float = 'left';
        nameSpan.textContent = msg.player.name + ':';

        let file;
        if (msg.type === 'video/mp4'){
            file = document.createElement('div');
            let vid = document.createElement('video');
            vid.setAttribute('controls','');
            vid.className = 'game-file';
            vid.src = msg.data;
            let vid2 = vid.cloneNode(true) as HTMLVideoElement; 
            vid2.onloadeddata = () => {
                msg.html = msgC.cloneNode(true);
                let msgDClone = msg.html.getElementsByClassName('game-chatMessage')[0];
                let fileClone = msgDClone.getElementsByTagName('div')[0];
                let vidClone = fileClone.getElementsByTagName('video');
                // In case vid2 finish loading after vid, remove the cloned vid
                if (vidClone.length > 0) fileClone.removeChild(vidClone[0]);
                fileClone.insertBefore(vid2,fileClone.firstChild);
                canvasChat.add(msg);
            };
            vid.load();
            vid2.load();
            let link = this.createFileLink(msg);
            file.appendChild(vid);
            file.appendChild(link);
        }
        else {
            file = this.createFileLink(msg);
        }

        msgD.appendChild(nameSpan);
        msgD.appendChild(file);
        msgC.appendChild(msgD);

        if (msg.type !== 'video/mp4'){
            msg.html = msgC.cloneNode(true);
            canvasChat.add(msg);
        }
    }

    addAudioMsg(msg){
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage';
        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.style.float = 'left';
        nameSpan.textContent = msg.player.name + ':';

        let file;
        if (msg.type === 'audio/mpeg' || msg.type === 'audio/wav' ||
            msg.type === 'audio/mp3'){
            file = document.createElement('div');
            let audio = document.createElement('audio');
            audio.setAttribute('controls','');
            audio.className = 'game-file';
            audio.onloadeddata = () => {
                msg.html = msgC.cloneNode(true);
                canvasChat.add(msg);
            };
            audio.src = msg.data;
            audio.load();
            let link = this.createFileLink(msg);
            file.appendChild(audio);
            file.appendChild(link);
        }
        else {
            file = this.createFileLink(msg);
        }

        msgD.appendChild(nameSpan);
        msgD.appendChild(file);
        msgC.appendChild(msgD);

        if (msg.type !== 'audio/mpeg' && msg.type !== 'audio/wav' &&
            msg.type !== 'audio/mp3'){
            msg.html = msgC.cloneNode(true);
            canvasChat.add(msg);
        }
    }

    createFileLink(msg) {
        let link = document.createElement('a');
        link.innerHTML = 'Download '+msg.type.split('/')[0]+' file';
        let blob = this.dataURItoBlob(msg);
        let url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', msg.filename);
        link.setAttribute('target', '_blank');
        return link;
    }

    addMsg(msg: Msg): void {
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage';
        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.textContent = msg.player!.name + ':';

        // Check for urls
        let msgSpan = document.createElement('span');
        let reg = new RegExp('(https?:\/\/[^<>\\s]+)', 'gi');
        let r = reg.exec(msg.text!);
        let i = 0;
        while (r !== null){
            if (r.index > i){
                let txt = document.createTextNode(msg.text!.substring(i,r.index));
                msgSpan.appendChild(txt);
            }
            i = reg.lastIndex;
            let link = document.createElement('a');
            let l = document.createTextNode(r[0]);
            link.appendChild(l);
            link.setAttribute('href', r[0]);
            link.setAttribute('target', '_blank');
            msgSpan.appendChild(link);
            r = reg.exec(msg.text!);
        }
        if (msg.text!.length > i){
            let txt = document.createTextNode(msg.text!.substring(i,msg.text!.length));
            msgSpan.appendChild(txt);
        }

        msgD.appendChild(nameSpan);
        msgD.appendChild(msgSpan);
        msgC.appendChild(msgD);

        msg.html = msgC.cloneNode(true) as HTMLDivElement;
        gameEventEmitter.emit(GameEvent.AddMessage, msg);
        canvasChat.add(msg);
    }

    addInfoMsg(text: string): void {
        const msg: Msg = { type: "info", text: text };
        gameEventEmitter.emit(GameEvent.AddMessage, msg);
    }

    allowedFile(file: File): boolean {
        if (file.size > MAX_FILE_SIZE_BYTES) return false;

        for (let i=0; i<this.allowedTypes.length; ++i)
            if (file.type.split('/')[0] === this.allowedTypes[i])
                return true;

        return false;
    }

    dataURItoBlob(msg: Msg): Blob {
        let byteString = atob(msg.data!.split(',')[1]);

        let ab = new ArrayBuffer(byteString.length);
        let ua = new Uint8Array(ab);
        for (let i=0; i<byteString.length; ++i)
            ua[i] = byteString.charCodeAt(i);
        
        return new Blob([ab], {type: msg.type});
    }

}

export const chat: Chat = new Chat();
