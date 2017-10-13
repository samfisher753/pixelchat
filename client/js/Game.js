class Game {

    constructor() {
        console.log("Initializing Game...");
        this.socket = null;
        this.player = null;
        
        this.getPlayerName();
        
    }

    start() {
        this.createChatPanel();
        this.socket = io();
        this.configureSocket();
        this.bindChatEvents();
    }

    configureSocket() {
        this.socket.on('chat message', (chatMsg) => {
            this.addChatMessage(chatMsg.player, chatMsg.msg);
        });
    }

    createChatPanel() {
        let app = document.getElementById('app');
        let chatC = document.createElement('div');
        chatC.className = 'game-chat';
        let chatMessagesC = document.createElement('div');
        chatMessagesC.className = 'game-chatMessagesContainer';
        let chatInputC = document.createElement('div');
        chatInputC.className = 'game-chatInput';
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';

        chatInputC.appendChild(this.chatInput);
        chatC.appendChild(chatMessagesC);
        chatC.appendChild(chatInputC);
        app.appendChild(chatC);
    }

    bindChatEvents() {
        this.chatInput.onkeypress = (e) => {
            let input = this.chatInput.value.trim();
            if (e.keyCode === 13 && input !== ''){
                let chatMsg = {
                    player: this.player.getName(),
                    msg: input
                };
                this.chatInput.value = '';
                this.socket.emit('chat message', chatMsg);
                this.addChatMessage(chatMsg.player,chatMsg.msg);
            }
        };
    }

    addChatMessage(player, msg) {
        let msgC = document.createElement('div');
        msgC.className = 'game-chatMessage';

        let nameSpan = document.createElement('span');
        nameSpan.className = 'game-boldText';
        nameSpan.textContent = player + ': ';

        let msgSpan = document.createElement('span');
        msgSpan.textContent = msg;

        msgC.appendChild(nameSpan);
        msgC.appendChild(msgSpan);
        let chat = document.getElementsByClassName('game-chatMessagesContainer')[0];
        chat.appendChild(msgC);
        chat.scrollTop = chat.scrollHeight;
    }

    getPlayerName(){
        let app = document.getElementById('app');

        let menu = document.createElement('div');
        menu.className = 'game-centered';

        let nickContainer = document.createElement('div');
        nickContainer.className = 'game-horizontalLayout';

        let nickLabel = document.createElement('div');
        nickLabel.className = 'game-horizontalLayout';

        let nickSpan = document.createElement('span');
        nickSpan.className = 'game-label';
        nickSpan.innerHTML = 'Nickname:';
        
        let nickInputContainer = document.createElement('div');
        nickInputContainer.className = 'game-horizontalLayout';

        let nickInput = document.createElement('input');
        nickInput.type = 'text';

        let buttonC = document.createElement('div');
        buttonC.className = 'game-horizontalLayout';

        let button = document.createElement('button');
        button.className = 'game-horizontalCentered';
        button.innerHTML = 'Play';
        button.onclick = () => {
            let nick = nickInput.value.trim();
            if (nick !== '') {
                this.player = new Player(nick);
                app.innerHTML = '';
                this.start();
            }
        };

        menu.onkeydown = (e) => {
            if (e.keyCode === 13) {
                button.onclick();
            }
        };

        nickLabel.appendChild(nickSpan);
        nickInputContainer.appendChild(nickInput);
        nickContainer.appendChild(nickLabel);
        nickContainer.appendChild(nickInputContainer);
        buttonC.appendChild(button);
        menu.appendChild(nickContainer);
        menu.appendChild(buttonC);
        app.appendChild(menu);

        nickInput.focus();
    }

}