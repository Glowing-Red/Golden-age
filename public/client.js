const ws = new WebSocket('ws://10.159.152.88:3000');
let currentRoom = null;
let username = prompt("Enter your name:");

ws.onopen = () => {
    console.log('Connected to server');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'room') {
        currentRoom = data.roomId;
        document.getElementById('room-name').textContent = `You are in room: ${currentRoom}`;
    } else if (data.user && data.text) {
        const messageElement = document.createElement('p');
        messageElement.textContent = `${data.user}: ${data.text}`;
        
        document.getElementById('chatWindow').appendChild(messageElement);
    }
};

function joinRoom(roomId) {
    document.getElementById('chatWindow').innerHTML = "";

    ws.send(JSON.stringify({ type: 'join', roomId }));
}

function sendMessage() {
    const message = document.getElementById('message-input').value;

    if (message && message.trim() !== "" && currentRoom) {
        ws.send(JSON.stringify({ type: 'message', user: username, text: message }));
        document.getElementById('message-input').value = '';
    }
}

document.getElementById('user-name').textContent = `You are: ${username}`;

document.getElementById('join-room').addEventListener('click', () => {
    console.log("clicked");
    const roomId = document.getElementById('room-id').value;
    joinRoom(roomId);
});

document.getElementById('message-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('send-message').click();
    }
});
document.getElementById('send-message').addEventListener('click', sendMessage);