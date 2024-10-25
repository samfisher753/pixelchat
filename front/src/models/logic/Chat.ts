import { wavRecorder } from '@/models/others/WavRecorder'
import { canvasChat } from '@/models/logic/CanvasChat'
import { Socket } from 'socket.io-client';
import { MAX_FILE_SIZE_BYTES, MAX_MSG_LENGTH } from '@/constants/constants';
import { Msg } from '@/types/Msg';

class Chat {

    socket: Socket | null;
    playerName: string | null;
    playerId: string | undefined;
    minChatWidth: number;
    allowedTypes: string[];
    micB: HTMLButtonElement | undefined;
    chatInput: HTMLInputElement | undefined;

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

    create() {
        this.createChatPanel(); 
        this.bindChatEvents();
    }

    remove() {
        let app = document.getElementById('app')!;
        let chat = document.getElementsByClassName('game-chat')[0];
        let chatR = document.getElementsByClassName('game-chatResize')[0];
        let hideB = document.getElementsByClassName('game-hideChatButton')[0];
        let menu = document.getElementsByClassName('game-menu')[0];
        let chatIn = document.getElementsByClassName('game-chatInput')[0];
        app.removeChild(chat);
        app.removeChild(chatR);
        app.removeChild(hideB);
        menu.removeChild(chatIn);
    }

    createChatPanel() {
        let app = document.getElementById('app')!;
        let chatC = document.createElement('div');
        chatC.className = 'game-chat';
        let chatMessagesC = document.createElement('div');
        chatMessagesC.className = 'game-chatMessagesContainer';
        let chatR = document.createElement('div');
        chatR.className = 'game-chatResize';
        let chatB = document.createElement('button');
        chatB.className = 'game-hideChatButton';
        chatB.innerHTML = '<';

        chatC.appendChild(chatMessagesC);
        app.appendChild(chatC);
        app.appendChild(chatR);
        app.appendChild(chatB);

        // Add chat input to menu bar
        let menuBar = document.getElementsByClassName('game-menu')[0];

        this.micB = document.createElement('button');
        this.micB.className = 'game-mic';
        if (!wavRecorder.available){
            this.micB.className += ' game-disabled';
            this.micB.setAttribute('disabled','');
        }
        let micBimg = document.createElement('img');
        micBimg.src = '/assets/icons/mic.png';
        this.micB.appendChild(micBimg);

        let chatInputC = document.createElement('div');
        chatInputC.className = 'game-chatInput';
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.maxLength = MAX_MSG_LENGTH;

        chatInputC.appendChild(this.micB);
        chatInputC.appendChild(this.chatInput);

        menuBar.appendChild(chatInputC);
    }

    bindChatEvents() {
        // More chat events on Game.bindEvents()
        this.chatInput!.onkeypress = (e) => {
            let msg = this.chatInput!.value.trim();
            if (msg.length >= MAX_MSG_LENGTH &&
                e.keyCode !== 46 && e.keyCode !== 8 && e.keyCode !== 13){
                e.preventDefault();
            }
            else if (e.keyCode === 13 && msg !== ''){
                this.chatInput!.value = '';
                msg = msg.slice(0,MAX_MSG_LENGTH);
                let m: Msg = { type: 'text', text: msg };
                this.socket!.emit('chat message', m);
                m.player = { 
                    name: this.playerName!,
                    id: this.playerId!
                };
                this.addMsg(m);
            }
        };

        // Record voice note
        this.micB!.onmousedown = () => {
            wavRecorder.start();
        };

        // Stop recording and send voice note
        let app = document.getElementById('app')!;
        app.onmouseup = () => {
            if (wavRecorder.recording) {
                let file: any = wavRecorder.stop();
                file.name = 'PixelChat-'+this.playerName+this.timeString()+'.wav';
                this.readFile(file);
            }
        };

        // Cancel voice note
        app.onkeydown = (e) => {
            if (e.keyCode === 27 && wavRecorder.recording){
                wavRecorder.cancel();
            }
        };

        // Maintain focus over chat input
        this.chatInput!.onblur = () => {
            this.chatInputFocus();
        }

        let b = document.getElementsByClassName('game-hideChatButton')[0] as HTMLButtonElement;
        let c = document.getElementsByClassName('game-chat')[0] as HTMLDivElement;
        let r = document.getElementsByClassName('game-chatResize')[0] as HTMLDivElement;
        b.onclick = () => {
            c.style.transition = '0.5s';
            b.style.transition = '0.5s';
            let pc = c.getBoundingClientRect();
            if (pc.left < 0){
                b.innerHTML = '<';
                c.style.left = '0';
                b.style.left = pc.width + 'px';
                r.style.display = 'block';
            }
            else {
                b.innerHTML = '>';
                c.style.left = -pc.width + 'px';
                b.style.left = '0';
                r.style.display = 'none';
            }
        };

    }

    chatInputFocus() {
        const ua = navigator.userAgent.toLowerCase()
        const isAndroid = ua.includes('android')
        const isIPhone = (navigator.userAgent.match(/iPhone/i)) ||(navigator.userAgent.match(/iPod/i))
        if (!isAndroid && !isIPhone) this.chatInput!.focus();
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

    addFileMsg(msg) {
        let type = msg.type.split('/')[0];
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

        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];

        let file = document.createElement('div');
        let img = new Image();
        img.className = 'game-file';
        this.addFullWindow(img);
        img.onload = () => {
            chat.appendChild(msgC);
            chat.scrollTop = chat.scrollHeight;
            delete msg.data;
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

        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];

        let file;
        if (msg.type === 'video/mp4'){
            file = document.createElement('div');
            let vid = document.createElement('video');
            vid.setAttribute('controls','');
            vid.className = 'game-file';
            vid.onloadeddata = () => {
                chat.appendChild(msgC);
                chat.scrollTop = chat.scrollHeight;
            };
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
            chat.appendChild(msgC);
            chat.scrollTop = chat.scrollHeight;
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

        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];

        let file;
        if (msg.type === 'audio/mpeg' || msg.type === 'audio/wav' ||
            msg.type === 'audio/mp3'){
            file = document.createElement('div');
            let audio = document.createElement('audio');
            audio.setAttribute('controls','');
            audio.className = 'game-file';
            audio.onloadeddata = () => {
                chat.appendChild(msgC);
                chat.scrollTop = chat.scrollHeight;
                delete msg.data;
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
            chat.appendChild(msgC);
            chat.scrollTop = chat.scrollHeight;
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

    addMsg(msg: Msg) {
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
        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];
        chat.appendChild(msgC);
        chat.scrollTop = chat.scrollHeight;

        msg.html = msgC.cloneNode(true) as HTMLDivElement;
        canvasChat.add(msg);
    }

    addInfoMsg(msg: string) {
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessageC';

        let msgD = document.createElement('div');
        msgD.className = 'game-chatMessage game-chatInfoMessage game-boldText';
        msgD.textContent = msg;

        msgC.appendChild(msgD);
        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];
        chat.appendChild(msgC);
        chat.scrollTop = chat.scrollHeight;
    }

    allowedFile(file: File) {
        if (file.size > MAX_FILE_SIZE_BYTES) return false;

        for (let i=0; i<this.allowedTypes.length; ++i)
            if (file.type.split('/')[0] === this.allowedTypes[i])
                return true;

        return false;
    }

    dataURItoBlob(msg) {
        let byteString = atob(msg.data.split(',')[1]);

        let ab = new ArrayBuffer(byteString.length);
        let ua = new Uint8Array(ab);
        for (let i=0; i<byteString.length; ++i)
            ua[i] = byteString.charCodeAt(i);
        
        return new Blob([ab], {type: msg.type});
    }

}

export const chat: Chat = new Chat();
