const IPv4 = "10.159.152.96";

async function Connect() {
    try {
        const response = await fetch("/validate");
        const data = await response.json();
        
        if (!data.loggedIn) {
            console.log("User is not logged in.");

            return;
        }
        
        console.log(getCookie('connect.sid'));

        const ws = new WebSocket(`ws://${IPv4}:3000`, {
            headers: {
                'Cookie': document.cookie
            }
        });
        
        let currentRoom = null;

        let username = data.Username;

        ws.onopen = () => {
            console.log('Connected to server');

            ws.send(JSON.stringify({
                type: 'authenticate',
                sessionId: data.sessionId
            }));
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
    } catch (error) {
        console.error("Error during validation check:", error);
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

Connect();